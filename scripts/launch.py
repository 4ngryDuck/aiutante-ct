"""Aiutante CT - start / stop / status, the same on Windows, Linux and macOS. Standard library only.

    python scripts/launch.py start      # llama-server (if configured and not already running) + the helper server
    python scripts/launch.py stop       # stops only the processes started from this folder
    python scripts/launch.py status

If something already answers on the engine port (your own llama-server, LM Studio, KoboldCPP...),
it is used as it is: nothing is closed without you.
"""
import json
import os
import platform
import signal
import socket
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

RADICE = Path(__file__).resolve().parent.parent
SERVER = RADICE / "server"
WIN = platform.system() == "Windows"


def config():
    f = SERVER / "config.json"
    if not f.exists():
        f.write_text((SERVER / "config.example.json").read_text(encoding="utf-8"), encoding="utf-8")
    return json.loads(f.read_text(encoding="utf-8"))


C = config()
DATI = (RADICE / C.get("data_dir", "data")).resolve()
RUN, LOG = DATI / "run", DATI / "logs"


def risponde(porta, percorso):
    try:
        with urllib.request.urlopen(f"http://127.0.0.1:{porta}{percorso}", timeout=2) as r:
            return json.loads(r.read() or b"{}")
    except (OSError, ValueError):
        return None


def porta_occupata(porta):
    try:
        with socket.create_connection(("127.0.0.1", porta), timeout=0.4):
            return True
    except OSError:
        return False


def vivo(pid):
    if WIN:
        r = subprocess.run(["tasklist", "/FI", f"PID eq {pid}", "/NH"], capture_output=True, text=True)
        return str(pid) in r.stdout
    try:
        os.kill(pid, 0)
        return True
    except OSError:
        return False


def pid_di(nome):
    f = RUN / f"{nome}.pid"
    try:
        pid = int(f.read_text())
        return pid if vivo(pid) else None
    except (OSError, ValueError):
        return None


def avvia(nome, argomenti, env=None, cwd=None):
    LOG.mkdir(parents=True, exist_ok=True)
    RUN.mkdir(parents=True, exist_ok=True)
    out = open(LOG / f"{nome}.log", "w", encoding="utf-8", errors="replace")
    extra = {}
    if WIN:
        extra["creationflags"] = 0x08000000 | 0x00000200   # CREATE_NO_WINDOW | CREATE_NEW_PROCESS_GROUP
    else:
        extra["start_new_session"] = True
    p = subprocess.Popen(argomenti, stdout=out, stderr=subprocess.STDOUT, stdin=subprocess.DEVNULL,
                         cwd=cwd, env={**os.environ, **(env or {})}, **extra)
    (RUN / f"{nome}.pid").write_text(str(p.pid))
    return p


def ferma(nome):
    pid = pid_di(nome)
    if pid:
        if WIN:
            subprocess.run(["taskkill", "/PID", str(pid), "/T", "/F"], capture_output=True)
        else:
            try:
                os.killpg(pid, signal.SIGTERM)
            except OSError:
                os.kill(pid, signal.SIGTERM)
    (RUN / f"{nome}.pid").unlink(missing_ok=True)
    return bool(pid)


def llama_server():
    e = C.get("engine") or {}
    dove = RADICE / e.get("llama_dir", "engine")
    nome = "llama-server.exe" if WIN else "llama-server"
    trovati = sorted(dove.rglob(nome)) if dove.exists() else []
    return trovati[0] if trovati else None


def avvia_motore():
    e = C.get("engine") or {}
    porta = e.get("port", 8434)
    if porta_occupata(porta):
        print(f"  engine: something already answers on port {porta}, I use it")
        return True
    exe = llama_server()
    modello = RADICE / e.get("model_file", "")
    if not exe:
        print("  engine: llama-server not found. Run SETUP first (or start your own OpenAI-compatible server).")
        return False
    if not modello.is_file():
        print(f"  engine: model file not found: {modello}\n          run SETUP, or set engine.model_file in server/config.json")
        return False
    argomenti = [str(exe), "-m", str(modello), "--alias", e.get("alias", "local-model"),
                 "-c", str(e.get("context", 32768)), "-np", str(e.get("parallel", 2)),
                 "--host", "127.0.0.1", "--port", str(porta), *e.get("extra_args", [])]
    env = dict(e.get("env") or {})
    if not WIN:
        env["LD_LIBRARY_PATH"] = f"{exe.parent}:{os.environ.get('LD_LIBRARY_PATH', '')}"
    print(f"  engine: starting {exe.name} with {modello.name} ({modello.stat().st_size / 1e9:.1f} GB)")
    avvia("engine", argomenti, env=env, cwd=exe.parent)
    return True


def start():
    print("Aiutante CT: starting...")
    porta = C.get("port", 8433)
    motore_ok = avvia_motore()
    if risponde(porta, "/salute"):
        print(f"  helper server: already running on {porta}")
    else:
        avvia("server", [sys.executable, "-u", str(SERVER / "server.py")], cwd=SERVER)
    e = C.get("engine") or {}
    for _ in range(300):   # a 14 GB model usually loads in 20-60 s
        s = risponde(porta, "/salute")
        pronto = (risponde(e.get("port", 8434), "/health") or {}).get("status") == "ok"
        if s and (pronto or not motore_ok):
            break
        if motore_ok and pid_di("engine") is None and not porta_occupata(e.get("port", 8434)):
            print(f"\nThe engine stopped while loading. Look at {LOG / 'engine.log'}")
            return 1
        print(".", end="", flush=True)
        time.sleep(1)
    print()
    s = risponde(porta, "/salute")
    if not s:
        print(f"The helper server did NOT start. Look at {LOG / 'server.log'}")
        return 1
    if WIN and C.get("tray", True):
        tray = RADICE / "scripts" / "windows" / "tray.ps1"
        if tray.exists() and not pid_di("tray"):
            avvia("tray", ["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-WindowStyle", "Hidden", "-File", str(tray)])
    log = LOG / "engine.log"
    if log.exists() and "failed to fit" in log.read_text(encoding="utf-8", errors="replace"):
        print("WARNING: the graphics card did not have enough free memory; part of the model is in normal RAM.\n"
              "It works, but 10-20x slower. Close games, browsers with hardware acceleration or other models, then STOP and START.")
    modelli = [v for v in (s.get("motori") or {}).values() if v]
    print(f"Aiutante CT is ON.  Model: {modelli[0] if modelli else 'none running (red light in the panel)'}")
    print(f"Open a chat on character-tavern.com and click the blue orb. Userscript: http://127.0.0.1:{porta}/aiutante-ct.user.js")
    return 0


def stop():
    fatti = [n for n in ("server", "engine", "tray") if ferma(n)]
    print("Aiutante CT is OFF." if fatti else "Aiutante CT was already off (nothing started from this folder is running).")
    return 0


def status():
    s = risponde(C.get("port", 8433), "/salute")
    print("helper server:", f"ON, version {s.get('versione')}" if s else "off")
    for n, v in ((s or {}).get("motori") or {}).items():
        print(f"  engine {n}: {v or 'off'}")
    return 0


if __name__ == "__main__":
    comando = (sys.argv[1:] or ["start"])[0]
    sys.exit({"start": start, "stop": stop, "status": status}.get(comando, lambda: print(__doc__) or 2)())
