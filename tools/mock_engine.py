"""A fake OpenAI-compatible engine for the demo and for tests: no GPU, no model, canned answers.

    python tools/mock_engine.py [--port 8535] [--delay 2.5]

It recognises the job from the system prompt and answers in the right shape (JSON for Lore and Ideas,
a [sheet] for State, plain text for the rest), with llama-server style 'timings' so the panel shows speeds.
"""
import argparse
import json
import random
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

LORE = {"voci": [
    {"azione": "nuova", "nome": "The Saltglass Lantern", "keywords": ["lantern", "saltglass", "saltglass lantern"],
     "contenuto": "[The Saltglass Lantern: an old brass lantern with a lens of salt-crusted glass, kept in the lighthouse of Port Avel. "
                  "When lit, it shows ships that are not there yet. Mara inherited it from her father and never lets anyone else light it.]",
     "motivo": "New object that came up in the chat"},
    {"azione": "nuova", "nome": "Port Avel", "keywords": ["port avel", "harbour", "harbor", "avel"],
     "contenuto": "[Port Avel: a foggy fishing town on a black-rock coast. Narrow stairs, salt markets, one lighthouse. "
                  "The harbour master owes Mara a favour since the winter storm.]",
     "motivo": "A place named several times"},
]}
IDEE = {"idee": [
    {"titolo": "A ship that is not there", "testo": "The lantern shows a ship with torn red sails entering the bay, but the sea is empty."},
    {"titolo": "The harbour master's favour", "testo": "Mara decides to call in the favour: she needs a boat before dawn."},
    {"titolo": "A crack in the lens", "testo": "A thin crack appears in the saltglass; Mara hides it from Rowan."},
    {"titolo": "Something honest", "testo": "Mara admits she has never seen her father's last ship come back."},
    {"titolo": "Rowan's move", "testo": "Rowan could offer to keep watch with her through the night."},
]}
TESTI = {
    "translator": "*Rowan leans against the railing, watching the fog roll in.* \"Does it always get this quiet before a storm?\"",
    "polish": "*Rowan leans on the cold railing as the fog crawls in over the black rocks.* \"Is it always this quiet before a storm?\"",
    "Translate a message": "*Mara alza la lanterna verso la finestra.* \"Guarda. La vedi anche tu, vero? Quella nave non dovrebbe esserci.\"",
    "summarize": "Rowan arrived in Port Avel looking for passage north and met Mara Quill, keeper of the lighthouse. "
                 "She showed him the Saltglass Lantern, inherited from her father, which reveals ships before they arrive. "
                 "That night the lantern showed a ship with red sails that was not on the sea.",
    "Current State": "[Time: night, fog. Place: top of the Port Avel lighthouse. Present: Mara (tired, worried), Rowan (curious). "
                     "Items: the Saltglass Lantern, lit. Open threads: the red-sailed ship; Mara's father's last voyage.]",
    "turn a story idea": "*Rowan pulls up a stool next to the lantern and sits down.* \"Then I'm staying. Someone should watch with you.\"",
}


def risposta(sistema):
    if "lorebook of an ongoing roleplay" in sistema:
        return json.dumps(LORE)
    if "co-author" in sistema:
        return json.dumps(IDEE)
    for chiave, testo in TESTI.items():
        if chiave in sistema:
            return testo
    return "OK."


class Gestore(BaseHTTPRequestHandler):
    def _json(self, dati):
        corpo = json.dumps(dati).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(corpo)))
        self.end_headers()
        self.wfile.write(corpo)

    def do_GET(self):
        if self.path.startswith("/health"):
            return self._json({"status": "ok"})
        if self.path.startswith("/v1/models"):
            return self._json({"data": [{"id": "mock-model (demo, no GPU)"}]})
        self.send_error(404)

    def do_POST(self):
        d = json.loads(self.rfile.read(int(self.headers.get("Content-Length") or 0)) or b"{}")
        sistema = next((m["content"] for m in d.get("messages", []) if m.get("role") == "system"), "")
        time.sleep(ARGS.delay * random.uniform(0.7, 1.3))
        testo = risposta(sistema)
        letti = sum(len(m.get("content", "")) for m in d.get("messages", [])) // 4
        self._json({
            "choices": [{"message": {"role": "assistant", "content": testo}}],
            "usage": {"prompt_tokens": letti, "completion_tokens": len(testo) // 4},
            "timings": {"prompt_n": letti, "predicted_n": len(testo) // 4,
                        "prompt_per_second": round(random.uniform(300, 420), 1), "predicted_per_second": round(random.uniform(34, 41), 1)},
        })

    def log_message(self, *a):
        pass


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=8535)
    ap.add_argument("--delay", type=float, default=2.5)
    ARGS = ap.parse_args()
    print(f"mock engine on http://127.0.0.1:{ARGS.port}")
    ThreadingHTTPServer(("127.0.0.1", ARGS.port), Gestore).serve_forever()
