"""Aiutante CT - one-time setup: downloads llama.cpp (llama-server) and a model, checks every SHA-256,
and writes the choice into server/config.json. Standard library only.

    python scripts/setup.py                 # asks
    python scripts/setup.py --backend vulkan --model gemma4-26b-heretic
    python scripts/setup.py --model none    # engine only (you bring your own .gguf or your own server)

Everything stays inside this folder: engine/ and models/ (both ignored by git).
"""
import argparse
import hashlib
import json
import platform
import shutil
import sys
import tarfile
import time
import urllib.request
import zipfile
from pathlib import Path

RADICE = Path(__file__).resolve().parent.parent
MANIFESTO = json.loads((RADICE / "scripts" / "downloads.json").read_text(encoding="utf-8"))
CONFIG = RADICE / "server" / "config.json"
ESEMPIO = RADICE / "server" / "config.example.json"


def chiedi(domanda, scelte, predefinita):
    print(f"\n{domanda}")
    for i, (k, testo) in enumerate(scelte, 1):
        print(f"  {i}) {testo}{'   <- default' if k == predefinita else ''}")
    while True:
        r = input("> ").strip()
        if not r:
            return predefinita
        if r.isdigit() and 1 <= int(r) <= len(scelte):
            return scelte[int(r) - 1][0]
        print("  type a number (or Enter for the default)")


def sha256(percorso):
    h = hashlib.sha256()
    with open(percorso, "rb") as f:
        for blocco in iter(lambda: f.read(1 << 20), b""):
            h.update(blocco)
    return h.hexdigest()


def scarica(url, dest, atteso):
    """Download with a progress line, resume-friendly (a complete file with the right hash is not downloaded again)."""
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists() and sha256(dest) == atteso:
        print(f"  already here, hash OK: {dest.name}")
        return
    parziale = dest.with_suffix(dest.suffix + ".part")
    print(f"  downloading {url}")
    req = urllib.request.Request(url, headers={"User-Agent": "AiutanteCT-setup"})
    with urllib.request.urlopen(req, timeout=60) as r, open(parziale, "wb") as f:
        totale = int(r.headers.get("Content-Length") or 0)
        fatto, t0, ultimo = 0, time.time(), 0
        while True:
            blocco = r.read(1 << 20)
            if not blocco:
                break
            f.write(blocco)
            fatto += len(blocco)
            if time.time() - ultimo > 0.5:
                ultimo = time.time()
                mb_s = fatto / max(ultimo - t0, 0.1) / 1e6
                pct = f"{fatto * 100 / totale:5.1f}%" if totale else ""
                print(f"\r  {fatto / 1e9:6.2f} GB {pct}  {mb_s:5.1f} MB/s   ", end="", flush=True)
    print()
    h = sha256(parziale)
    if h != atteso:
        parziale.unlink()
        sys.exit(f"  HASH MISMATCH for {dest.name}\n  expected {atteso}\n  got      {h}\n  The file was deleted. Nothing was installed.")
    parziale.replace(dest)
    print(f"  hash OK: {h[:16]}...")


def estrai(archivio, dove):
    print(f"  extracting {archivio.name}")
    dove.mkdir(parents=True, exist_ok=True)
    if archivio.name.endswith(".zip"):
        with zipfile.ZipFile(archivio) as z:
            for m in z.namelist():   # no paths outside the target folder
                if m.startswith(("/", "\\")) or ".." in Path(m).parts:
                    sys.exit(f"  unsafe path in archive: {m}")
            z.extractall(dove)
    else:
        with tarfile.open(archivio) as t:
            for m in t.getmembers():
                if m.name.startswith("/") or ".." in Path(m.name).parts:
                    sys.exit(f"  unsafe path in archive: {m.name}")
            t.extractall(dove)


def trova_server(dove):
    nome = "llama-server.exe" if platform.system() == "Windows" else "llama-server"
    trovati = sorted(dove.rglob(nome))
    return trovati[0] if trovati else None


def piattaforma():
    s, m = platform.system(), platform.machine().lower()
    if s == "Windows":
        return "win"
    if s == "Darwin":
        return "macos-arm64" if m in ("arm64", "aarch64") else "macos-x64"
    return "linux"


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--backend", choices=["vulkan", "cuda", "cpu"])
    ap.add_argument("--model", help="model id from scripts/downloads.json, or 'none'")
    ap.add_argument("--yes", action="store_true", help="do not ask, use defaults")
    a = ap.parse_args()

    print("Aiutante CT setup  -  everything is downloaded into this folder and checked with SHA-256.")
    p = piattaforma()
    if p.startswith("macos"):
        chiave, backend = p, "metal"
    else:
        backend = a.backend or ("vulkan" if a.yes else chiedi(
            "Your graphics card?",
            [("vulkan", "AMD / Intel / any (Vulkan)"), ("cuda", "NVIDIA (CUDA, fastest on NVIDIA)"), ("cpu", "no usable GPU (CPU only, slow)")],
            "vulkan"))
        chiave = f"{p}-{backend}"

    modelli = MANIFESTO["models"]
    scelta = a.model or (modelli[0]["id"] if a.yes else chiedi(
        "Which model? (you can change it later in server/config.json)",
        [(m["id"], f"{m['name']}  -  {m['size_gb']} GB, VRAM {m['vram']}") for m in modelli] + [("none", "none: I already have a .gguf or my own server")],
        modelli[0]["id"]))

    # ---- engine
    llama = MANIFESTO["llama_cpp"]
    motore = RADICE / "engine"
    if trova_server(motore):
        print(f"\nEngine already installed: {trova_server(motore).relative_to(RADICE)}")
    else:
        print(f"\nEngine: llama.cpp {llama['tag']} ({chiave})")
        scaricati = RADICE / "engine" / "_downloads"
        for x in llama["assets"][chiave]:
            f = scaricati / x["file"]
            scarica(llama["base_url"] + x["file"], f, x["sha256"])
            estrai(f, motore)
        shutil.rmtree(scaricati, ignore_errors=True)
        exe = trova_server(motore)
        if not exe:
            sys.exit("  llama-server not found in the archive")
        if platform.system() != "Windows":
            exe.chmod(0o755)
        print(f"  engine ready: {exe.relative_to(RADICE)}")

    # ---- model
    m = next((x for x in modelli if x["id"] == scelta), None)
    if m:
        print(f"\nModel: {m['name']} ({m['size_gb']} GB)  -  {m['page']}")
        scarica(m["url"], RADICE / "models" / m["file"], m["sha256"])
    elif scelta != "none":
        sys.exit(f"unknown model id: {scelta}")

    # ---- config
    if not CONFIG.exists():
        CONFIG.write_text(ESEMPIO.read_text(encoding="utf-8"), encoding="utf-8")
    c = json.loads(CONFIG.read_text(encoding="utf-8"))
    e = c.setdefault("engine", {})
    e["backend"] = backend
    e["llama_dir"] = "engine"
    if m:
        e["model_file"] = f"models/{m['file']}"
    CONFIG.write_text(json.dumps(c, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("\nDone. Saved in server/config.json. Now start it with START (Windows) or scripts/unix/start.sh.")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit("\nstopped")
