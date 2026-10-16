"""Aiutante CT - the local server behind the button bar.

It receives from the userscript the chat text that is already on the page, calls a local model
(any OpenAI-compatible server, by default llama-server on port 8434) and returns the result.
It NEVER talks to character-tavern.com: it only reads what the userscript sends.

Start:  START.bat / scripts/unix/start.sh   (or: python server.py  - standard library only, Python 3.9+)
Check:  GET  http://127.0.0.1:8433/salute
Jobs:   POST /lavoro/<traduci|rifinisci|leggi|lore|stato|riassunto|idee|idea_box>
Options: --config <file>   --demo (also accept the local demo page on http://127.0.0.1 / localhost)
"""
import argparse
import json
import re
import secrets
import socket
import sys
import threading
import time
import urllib.error
import urllib.request
from datetime import datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

VERSIONE = "0.7.1"
CASA = Path(__file__).resolve().parent
RADICE = CASA.parent
_ap = argparse.ArgumentParser(description="Aiutante CT local server")
_ap.add_argument("--config", default=str(CASA / "config.json"))
_ap.add_argument("--demo", action="store_true", help="also accept requests from the local demo page")
ARGS = _ap.parse_args() if __name__ == "__main__" else _ap.parse_args([])

# config.json is personal (not in git): created from config.example.json on the first start.
FILE_CONFIG = Path(ARGS.config)
if not FILE_CONFIG.exists():
    FILE_CONFIG.write_text((CASA / "config.example.json").read_text(encoding="utf-8"), encoding="utf-8")
CONFIG = json.loads(FILE_CONFIG.read_text(encoding="utf-8"))
CONFIG.setdefault("port", 8433)
CONFIG.setdefault("language", "Italian")
CONFIG.setdefault("order", {})
CONFIG.setdefault("temperature", {})
DATI = (RADICE / CONFIG.get("data_dir", "data")).resolve()
DATI.mkdir(parents=True, exist_ok=True)
ORIGINI_OK = {"https://character-tavern.com", "https://www.character-tavern.com"}
DEMO = re.compile(r"^http://(127\.0\.0\.1|localhost)(:\d+)?$")

# Key for devices other than this PC (smartphone). Random, created on the first start, never in git.
FILE_CHIAVE = DATI / "key.txt"
if not FILE_CHIAVE.exists():
    FILE_CHIAVE.write_text(secrets.token_urlsafe(18), encoding="utf-8")
CHIAVE = FILE_CHIAVE.read_text(encoding="utf-8").strip()

# Characters of chat per job (besides the prompt). None = as much as fits in the engine's context.
BUDGET = {"traduci": 6000, "rifinisci": 6000, "leggi": 0, "lore": None, "stato": 20000, "riassunto": None, "idee": 30000, "idea_box": 6000}
MAX_TOKENS = {"traduci": 1200, "rifinisci": 1500, "leggi": 2500, "lore": 3000, "stato": 600, "riassunto": 1500, "idee": 1500, "idea_box": 800}
JSON_LAVORI = {"lore", "idee"}


def log(*a):
    print(datetime.now().strftime("%H:%M:%S"), *a, flush=True)


# ---------------------------------------------------------------- engines

def acceso(url):
    u = urlparse(url)
    try:
        with socket.create_connection((u.hostname, u.port or 80), timeout=0.4):
            return True
    except OSError:
        return False


def scegli_motore(lavoro):
    for nome in CONFIG["order"].get(lavoro, list(CONFIG["engines"])):
        m = CONFIG["engines"].get(nome)
        if m and acceso(m["url"]):
            return nome, m
    return None, None


def chiama(motore, sistema, utente, lavoro):
    corpo = {
        "model": motore["model"],
        "messages": [{"role": "system", "content": sistema}, {"role": "user", "content": utente}],
        "temperature": CONFIG["temperature"].get(lavoro, 0.5),
        "max_tokens": MAX_TOKENS[lavoro],
        "stream": False,
        **motore.get("extra", {}),
    }
    if lavoro in JSON_LAVORI and motore.get("json_mode"):
        corpo["response_format"] = {"type": "json_object"}   # llama-server: the grammar guarantees valid JSON
    req = urllib.request.Request(motore["url"], json.dumps(corpo).encode(), {"Content-Type": "application/json"})
    t0 = time.time()
    with urllib.request.urlopen(req, timeout=900) as r:
        dati = json.loads(r.read())
    testo = dati["choices"][0]["message"].get("content") or ""
    return re.sub(r"<think>.*?</think>", "", testo, flags=re.S).strip(), misura(motore, dati, time.time() - t0)


def base_url(motore):
    u = urlparse(motore["url"])
    return f"{u.scheme}://{u.netloc}"


def leggi_json(url, timeout=1.0):
    try:
        with urllib.request.urlopen(url, timeout=timeout) as r:
            return json.loads(r.read())
    except (OSError, ValueError):
        return None


def misura(motore, dati, secondi):
    """Tokens and speed of the last request: llama-server sends them in 'timings', KoboldCPP in /api/extra/perf."""
    uso = dati.get("usage") or {}
    m = {"token_letti": uso.get("prompt_tokens"), "token_scritti": uso.get("completion_tokens")}
    t = dati.get("timings")
    if t:
        m.update(token_letti=t.get("prompt_n"), token_scritti=t.get("predicted_n"),
                 lettura_ts=t.get("prompt_per_second"), scrittura_ts=t.get("predicted_per_second"))
    else:
        perf = leggi_json(base_url(motore) + "/api/extra/perf") or {}
        if perf.get("last_eval_speed"):
            m["scrittura_ts"] = float(perf["last_eval_speed"])
        if perf.get("last_process_speed"):
            m["lettura_ts"] = float(perf["last_process_speed"])
        if perf.get("last_input_count"):
            m["token_letti"] = perf["last_input_count"]
        if perf.get("last_token_count"):
            m["token_scritti"] = perf["last_token_count"]
    if m.get("lettura_ts", 0) > 5000:   # prompt almost all cached: the "speed" means nothing
        del m["lettura_ts"]
        m["cache"] = True
    if not m.get("scrittura_ts") and m.get("token_scritti"):
        m["scrittura_ts"] = m["token_scritti"] / max(secondi, 0.1)   # estimate: includes prompt reading
    return {k: (round(v, 1) if isinstance(v, float) else v) for k, v in m.items() if v is not None}


def nome_modello(motore):
    """The name of the loaded model, asked to the engine (KoboldCPP or llama-server)."""
    b = base_url(motore)
    k = leggi_json(b + "/api/v1/model")
    if k and k.get("result"):
        return k["result"].split("/")[-1]
    o = leggi_json(b + "/v1/models")
    if o and o.get("data"):
        return o["data"][0].get("id", "?").split("/")[-1].replace(".gguf", "")
    return motore.get("model", "?")


def pulisci_lore(risultato):
    """Drop or repair the broken entries the model sometimes produces (mangled keys, cut-off or looping text)."""
    buone, scartate = [], []
    for v in (risultato.get("voci") or []) if isinstance(risultato, dict) else []:
        if not isinstance(v, dict):
            continue
        v = dict(v)
        for k in list(v):   # mangled keys: "motpos" -> "motivo", "content" -> "contenuto", ...
            kk = k.lower()
            for giusta, inizi in (("motivo", ("mot",)), ("contenuto", ("cont",)), ("keywords", ("key",)),
                                  ("nome", ("nom", "name")), ("azione", ("az", "act"))):
                if kk != giusta and kk.startswith(inizi) and giusta not in v:
                    v[giusta] = v.pop(k)
                    break
        nome = str(v.get("nome") or "").strip()
        testo = str(v.get("contenuto") or "").strip()
        kw = v.get("keywords") or []
        kw = [str(x).strip().lower() for x in (kw if isinstance(kw, list) else str(kw).split(","))]
        kw = list(dict.fromkeys(x for x in kw if x and len(x) <= 40))
        motivo = ""
        if not nome or len(nome) > 100:
            motivo = "no name"
        elif len(testo) < 30:
            motivo = "text too short"
        elif len(testo) > 3000 or re.search(r"(.{3,40}?)\1{5,}", testo):
            motivo = "text repeating forever"
        elif testo.startswith("[") and not testo.rstrip().endswith("]"):
            motivo = "text cut off"
        elif not kw:
            motivo = "no keywords"
        if motivo:
            scartate.append(f"{nome or '?'}: {motivo}")
            continue
        buone.append({"azione": v.get("azione") or "nuova", "nome": nome, "keywords": kw[:12], "contenuto": testo,
                      "motivo": str(v.get("motivo") or "").strip()})
    if scartate:
        log("lore: dropped " + "; ".join(scartate))
    return {"voci": buone, "scartate": scartate}


def estrai_json(testo):
    testo = re.sub(r"^```(?:json)?|```$", "", testo.strip(), flags=re.M).strip()
    a, b = testo.find("{"), testo.rfind("}")
    if a < 0 or b < a:
        raise ValueError("nessun JSON nella risposta")
    return json.loads(testo[a:b + 1])


# ---------------------------------------------------------------- text for the model

def chat_testo(messaggi, budget):
    """The latest messages that fit in the budget, in order. budget<=0: none."""
    righe, tot = [], 0
    for m in reversed(messaggi or []):
        r = f"{m.get('nome') or m.get('ruolo')}: {m.get('testo', '').strip()}"
        if righe and tot + len(r) > budget:
            break
        righe.append(r)
        tot += len(r) + 2
    tagliati = len(messaggi or []) - len(righe)
    testa = f"(... {tagliati} earlier messages not shown ...)\n\n" if tagliati else ""
    return testa + "\n\n".join(reversed(righe))


def lorebook_testo(voci, corto=False):
    if not voci:
        return "(empty)"
    out = []
    for v in voci:
        c = v.get("contenuto", "")
        if corto and len(c) > 300:
            c = c[:300] + "..."
        out.append(f"### {v.get('nome') or '(no name)'}\nkeywords: {', '.join(v.get('keywords', []))}\n{c}")
    return "\n\n".join(out)


# Repeated at the end of the request: after a long chat, roleplay models tend to continue the story instead.
PROMEMORIA = {
    "traduci": "Translate ONLY the MESSAGE TO PROCESS into English. Do not continue the story.",
    "rifinisci": "Polish ONLY the MESSAGE TO PROCESS. Do not continue the story.",
    "leggi": None,
    "lore": "Now output the JSON with your lorebook proposals. Do not continue the story.",
    "stato": "Now output the updated Current State sheet in [square brackets]. Do not continue the story.",
    "riassunto": "Now write the complete summary of the story so far. Do not continue the story.",
    "idee": "Now output the JSON with 5 ideas in {lang}. Do not continue the story.",
    "idea_box": "Write ONLY the user's next message in English, carrying out the IDEA. Write nothing for the other characters.",
}


def componi(lavoro, d, motore):
    testo = _componi(lavoro, d, motore)
    p = PROMEMORIA.get(lavoro)
    return f"{testo}\n\n=== TASK ===\n{p.replace('{lang}', lingua(d))}" if p else testo


def lingua(d):
    """The user's own language (translations, reasons, ideas): sent by the panel, or the one in config.json."""
    l = re.sub(r"[^\w ()-]", "", str(d.get("lingua") or ""))[:30].strip()
    return l or CONFIG["language"]


def _componi(lavoro, d, motore):
    chi = f"The AI character is {d.get('personaggio') or '?'}; the user's character is {d.get('utente') or '?'}."
    budget = BUDGET[lavoro]
    if budget is None:
        budget = motore.get("context_chars", 30000) - len(lorebook_testo(d.get("lorebook"))) - 6000
    budget = max(budget, 0)
    chat = chat_testo(d.get("messaggi"), budget)
    testo = (d.get("testo") or "").strip()
    # Permanent facts written by the user (names, family ties, numbers): always true, never to be contradicted.
    f = (d.get("fatti_fissi") or "").strip()
    fissi = (f"\n\nPERMANENT FACTS (written by the user: always true, never contradict them; "
             f"the user's version wins over the chat and over any previous summary):\n{f}") if f else ""

    if lavoro in ("traduci", "rifinisci"):
        return f"{chi}\n\nRECENT CHAT (for style and context only):\n{chat}\n\nMESSAGE TO PROCESS:\n{testo}"
    if lavoro == "leggi":
        return testo
    if lavoro == "lore":
        return f"{chi}{fissi}\n\nCURRENT LOREBOOK:\n{lorebook_testo(d.get('lorebook'))}\n\nCHAT:\n{chat}"
    if lavoro == "stato":
        prima = d.get("stato_precedente") or "(none)"
        return f"{chi}{fissi}\n\nPREVIOUS SHEET:\n{prima}\n\nRECENT CHAT:\n{chat}"
    if lavoro == "riassunto":
        prima = d.get("riassunto_precedente") or "(none)"
        return f"{chi}{fissi}\n\nPREVIOUS SUMMARY:\n{prima}\n\nCHAT:\n{chat}"
    if lavoro == "idee":
        return f"{chi}{fissi}\n\nLOREBOOK:\n{lorebook_testo(d.get('lorebook'), corto=True)}\n\nRECENT CHAT:\n{chat}"
    if lavoro == "idea_box":
        return f"{chi}\n\nRECENT CHAT (for style and context only):\n{chat}\n\nIDEA (describing what the user's character could do next):\n{testo}"
    raise KeyError(lavoro)


# ---------------------------------------------------------------- jobs

def esegui(lavoro, d):
    if lavoro not in BUDGET:
        return 404, {"ok": False, "errore": f"unknown job: {lavoro}"}
    if lavoro in ("traduci", "rifinisci", "leggi") and not (d.get("testo") or "").strip():
        return 400, {"ok": False, "errore": "empty text"}
    nome, motore = scegli_motore(lavoro)
    if not motore:
        return 503, {"ok": False, "errore": "no model is running: start Aiutante CT on your PC (START)"}

    sistema = (CASA / "prompts" / f"{lavoro}.md").read_text(encoding="utf-8").replace("{lang}", lingua(d))
    utente = componi(lavoro, d, motore)
    t0 = time.time()
    log(f"{lavoro} on {nome}: {len(utente)} characters")
    testo, misure = chiama(motore, sistema, utente, lavoro)
    if lavoro in JSON_LAVORI:
        try:
            risultato = estrai_json(testo)
        except ValueError:
            log(f"{lavoro}: invalid JSON, retrying")
            testo, misure = chiama(motore, sistema + "\n\nIMPORTANT: your previous answer was not valid JSON. Output ONLY the JSON object.", utente, lavoro)
            risultato = estrai_json(testo)
        if lavoro == "lore":
            risultato = pulisci_lore(risultato)
    else:
        risultato = {"testo": testo}
    secondi = round(time.time() - t0, 1)
    misure["secondi"] = secondi
    log(f"{lavoro} done in {secondi}s  {misure}")
    ULTIMO.clear()
    ULTIMO.update(lavoro=lavoro, motore=nome, **misure)
    archivia(lavoro, d, risultato)
    return 200, {"ok": True, "motore": nome, "secondi": secondi, "misure": misure, "risultato": risultato}


ULTIMO = {}   # measures of the last job, for the panel's display

# Background jobs: the panel starts one, gets an id at once and asks for the result every few seconds.
# A single long request (a 3+ minute Lore) gets closed by the browser before the answer arrives.
ESITI = {}
ESITI_LOCK = threading.Lock()


def esegui_protetto(lavoro, d):
    try:
        return esegui(lavoro, d)
    except urllib.error.URLError as e:
        return 502, {"ok": False, "errore": f"the model does not answer: {e}"}
    except Exception as e:  # noqa: BLE001 - any error goes back to the panel as a message
        log("ERROR", repr(e))
        return 500, {"ok": False, "errore": str(e)}


def avvia_in_fondo(lavoro, d):
    ident = secrets.token_hex(8)
    with ESITI_LOCK:
        for vecchio in list(ESITI)[:-50]:   # keep only the last 50 results
            del ESITI[vecchio]
        ESITI[ident] = None

    def corri():
        esito = esegui_protetto(lavoro, d)
        with ESITI_LOCK:
            ESITI[ident] = esito

    threading.Thread(target=corri, daemon=True).start()
    return 200, {"ok": True, "in_fondo": ident}


def _pulito(s, n=60):
    return re.sub(r"[^a-zA-Z0-9_-]+", "_", str(s or "")).strip("_")[:n] or "no-name"


def cartella_chat(d):
    """One drawer per ACCOUNT + CHAT: data/<account>/<card>__<chat id>.
    The page address is the card's (the same for two accounts and for two chats of the same card),
    so the account name and the chat id, read by the userscript from the page, are needed too."""
    carta = (d.get("chat") or "").rstrip("/").split("/")[-1]
    c = DATI / _pulito(d.get("account"), 40) / f"{_pulito(carta)}__{_pulito(d.get('chat_id'), 20)}"
    c.mkdir(parents=True, exist_ok=True)
    return c


def archivia(lavoro, d, risultato):
    """Keeps a history per chat: lore proposals, states, summaries, ideas (not translations)."""
    if lavoro in ("traduci", "rifinisci", "leggi"):
        return
    riga = {"quando": datetime.now().isoformat(timespec="seconds"), "lavoro": lavoro, "risultato": risultato}
    with open(cartella_chat(d) / "storico.jsonl", "a", encoding="utf-8") as f:
        f.write(json.dumps(riga, ensure_ascii=False) + "\n")


# ---------------------------------------------------------------- lorebook versions

def _voci(lorebook):
    return [{"nome": v.get("nome", ""), "keywords": list(v.get("keywords") or []), "contenuto": v.get("contenuto", "")}
            for v in (lorebook or [])]


def _create(c):
    f = c / "create_dall_aiutante.json"
    return json.loads(f.read_text(encoding="utf-8")) if f.exists() else []


def lorebook_azione(azione, d):
    c = cartella_chat(d)
    versioni = c / "versioni"
    versioni.mkdir(exist_ok=True)

    if azione == "backup":
        voci = _voci(d.get("lorebook"))
        elenco = sorted(versioni.glob("*.json"))
        if elenco and json.loads(elenco[-1].read_text(encoding="utf-8"))["voci"] == voci and not d.get("forza"):
            return 200, {"ok": True, "file": elenco[-1].name, "uguale": True}   # no identical duplicates
        adesso = datetime.now()
        nome = adesso.strftime("%Y%m%d-%H%M%S-%f") + ".json"
        dati = {"quando": adesso.isoformat(timespec="seconds"), "motivo": (d.get("motivo") or "backup")[:200], "voci": voci}
        (versioni / nome).write_text(json.dumps(dati, ensure_ascii=False, indent=1), encoding="utf-8")
        log(f"lorebook: version saved {c.name}/{nome} ({dati['motivo']})")
        return 200, {"ok": True, "file": nome}

    if azione == "versioni":
        out = []
        for f in sorted(versioni.glob("*.json"), reverse=True)[:200]:
            v = json.loads(f.read_text(encoding="utf-8"))
            out.append({"file": f.name, "quando": v["quando"], "motivo": v["motivo"], "n": len(v["voci"])})
        return 200, {"ok": True, "versioni": out, "create": _create(c), "cartella": str(c.relative_to(DATI))}

    if azione == "versione":
        nome = d.get("file") or ""
        if not re.fullmatch(r"[0-9-]+\.json", nome) or not (versioni / nome).exists():
            return 404, {"ok": False, "errore": "version not found"}
        return 200, {"ok": True, **json.loads((versioni / nome).read_text(encoding="utf-8"))}

    if azione == "creata":
        create = _create(c)
        n = (d.get("nome") or "").strip()
        if n and n.lower() not in [x.lower() for x in create]:
            create.append(n)
            (c / "create_dall_aiutante.json").write_text(json.dumps(create, ensure_ascii=False, indent=1), encoding="utf-8")
        return 200, {"ok": True, "create": create}

    return 404, {"ok": False, "errore": f"unknown action: {azione}"}


# ---------------------------------------------------------------- http

LOCALI = ("127.0.0.1", "::1")
USERSCRIPT = RADICE / "userscript" / "aiutante-ct.user.js"


def origine_ammessa(o):
    return o in ORIGINI_OK or (ARGS.demo and bool(DEMO.match(o or "")))


def userscript_locale(host):
    """The userscript as served by this PC. Opening /aiutante-ct.user.js in the browser makes Tampermonkey or
    Violentmonkey show "Install", and later updates come from here too (no account, no external site).
    The address is rewritten with the one the device used, so a phone gets updates from the PC it sees."""
    porta = CONFIG["port"]
    testo = USERSCRIPT.read_text(encoding="utf-8")
    url = f"http://{host}/aiutante-ct.user.js"
    righe = [f"// @updateURL    {url}", f"// @downloadURL  {url}"]
    nome_host = host.rsplit(":", 1)[0].strip("[]")
    if nome_host not in ("127.0.0.1", "localhost", "::1"):
        righe.append(f"// @connect      {nome_host}")   # the phone talks to this address, not to 127.0.0.1
        altri = [f"http://{i}:{porta}" for i in (CONFIG.get("network") or {}).get("addresses") or []]
        elenco = ", ".join(dict.fromkeys([f"http://{host}"] + altri))
        testo = testo.replace(f"const SERVER_PREDEFINITO = 'http://127.0.0.1:{porta}';", f"const SERVER_PREDEFINITO = '{elenco}';")
    return testo.replace("// ==/UserScript==", "\n".join(righe) + "\n// ==/UserScript==", 1)


class Gestore(BaseHTTPRequestHandler):
    server_version = f"AiutanteCT/{VERSIONE}"

    def _origine_ok(self):
        # Tampermonkey on Chrome sends no Origin; on Firefox the extensions send moz-extension://.
        # A web site cannot pretend to be an extension, so foreign sites stay out.
        o = self.headers.get("Origin")
        return o is None or origine_ammessa(o) or o.startswith(("moz-extension://", "chrome-extension://"))

    def _cors(self):
        o = self.headers.get("Origin")
        if origine_ammessa(o):
            self.send_header("Access-Control-Allow-Origin", o)
            self.send_header("Vary", "Origin")

    def _rispondi(self, codice, dati):
        if self.client_address[0] not in LOCALI:   # from the phone: logged, to understand what arrives
            log(f"from {self.client_address[0]}: {self.command} {self.path.split('?')[0]} -> {codice}")
        corpo = json.dumps(dati, ensure_ascii=False).encode()
        self.send_response(codice)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(corpo)))
        self._cors()
        self.end_headers()
        self.wfile.write(corpo)

    def do_OPTIONS(self):
        self.send_response(204)
        if origine_ammessa(self.headers.get("Origin")):
            self._cors()
            self.send_header("Access-Control-Allow-Methods", "GET, POST")
            self.send_header("Access-Control-Allow-Headers", "Content-Type, X-Chiave")
        self.end_headers()

    def _chiave_ok(self):
        """Everything from this PC is allowed; from other devices (phone on the home network) the key is needed."""
        if self.client_address[0] in LOCALI:
            return True
        return bool(CHIAVE) and secrets.compare_digest(self.headers.get("X-Chiave", ""), CHIAVE)

    def do_GET(self):
        percorso = self.path.split("?")[0]
        if percorso == "/aiutante-ct.user.js":
            host = re.sub(r"[^A-Za-z0-9.:\[\]-]", "", self.headers.get("Host") or "") or f"127.0.0.1:{CONFIG['port']}"
            corpo = userscript_locale(host).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/javascript; charset=utf-8")
            self.send_header("Content-Length", str(len(corpo)))
            self.send_header("Cache-Control", "no-cache")
            self.end_headers()
            self.wfile.write(corpo)
            return
        if not self._chiave_ok():
            return self._rispondi(401, {"ok": False, "errore": "missing or wrong key"})
        if percorso in ("/", "/salute"):
            motori = {n: (nome_modello(m) if acceso(m["url"]) else None) for n, m in CONFIG["engines"].items()}
            return self._rispondi(200, {"stato": "ci sono", "versione": VERSIONE, "motori": motori, "ultimo": ULTIMO})
        if percorso.startswith("/esito/"):
            ident = percorso.split("/")[2]
            with ESITI_LOCK:
                if ident not in ESITI:
                    return self._rispondi(404, {"ok": False, "errore": "unknown job (server restarted?)"})
                # The result stays (last 50): if the page is reloaded mid-job, the panel picks it up again.
                esito = ESITI[ident]
            if esito is None:
                return self._rispondi(200, {"ok": True, "finito": False})
            return self._rispondi(*esito)
        self._rispondi(404, {"ok": False, "errore": "not found"})

    def do_POST(self):
        if not self._origine_ok():
            return self._rispondi(403, {"ok": False, "errore": "origin not allowed"})
        if not self._chiave_ok():
            return self._rispondi(401, {"ok": False, "errore": "missing or wrong key"})
        parti = self.path.split("?")[0].split("/")
        if len(parti) < 3 or parti[1] not in ("lavoro", "lorebook"):
            return self._rispondi(404, {"ok": False, "errore": "not found"})
        try:
            lunghezza = int(self.headers.get("Content-Length") or 0)
            if lunghezza > 20_000_000:
                return self._rispondi(413, {"ok": False, "errore": "request too large"})
            d = json.loads(self.rfile.read(lunghezza) or b"{}")
            if parti[1] == "lavoro" and d.pop("in_fondo", False):
                return self._rispondi(*avvia_in_fondo(parti[2], d))
            codice, risposta = (esegui if parti[1] == "lavoro" else lorebook_azione)(parti[2], d)
        except urllib.error.URLError as e:
            codice, risposta = 502, {"ok": False, "errore": f"the model does not answer: {e}"}
        except Exception as e:  # noqa: BLE001 - any error goes back to the panel as a message
            log("ERROR", repr(e))
            codice, risposta = 500, {"ok": False, "errore": str(e)}
        self._rispondi(codice, risposta)

    def log_message(self, *a):
        pass


def main():
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except AttributeError:
        pass
    porta = CONFIG["port"]
    log(f"Aiutante CT {VERSIONE} listening on http://127.0.0.1:{porta}  (data: {DATI})")
    log(f"  install / update the userscript: http://127.0.0.1:{porta}/aiutante-ct.user.js")
    for n, m in CONFIG["engines"].items():
        log(f"  engine {n:8} {'ON ' if acceso(m['url']) else 'off'}  {m['url']}")
    if ARGS.demo:
        log("  demo mode: the local demo page (http://127.0.0.1 / localhost) is allowed too")
    # Phone: off by default. config.json -> "network": {"enabled": true, "addresses": ["<this PC's LAN or Tailscale IP>"]}
    rete = CONFIG.get("network") or {}
    if rete.get("enabled"):
        for ind in rete.get("addresses") or []:
            srv = ThreadingHTTPServer((ind, porta), Gestore)
            threading.Thread(target=srv.serve_forever, daemon=True).start()
            log(f"  also on http://{ind}:{porta} (other devices need the key in {FILE_CHIAVE})")
    ThreadingHTTPServer(("127.0.0.1", porta), Gestore).serve_forever()


if __name__ == "__main__":
    main()
