"""Demo: a fake chat page with the panel on it, a mock engine and the helper server. No GPU, no Character Tavern.

    python demo/serve.py        then open http://127.0.0.1:8530/chat/demo-story/?open=1   (&lang=en or &lang=it)

Stops with Ctrl+C. Nothing here touches character-tavern.com.
"""
import subprocess
import sys
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

DEMO = Path(__file__).resolve().parent
RADICE = DEMO.parent
FILE = {"/gm-shim.js": DEMO / "gm-shim.js", "/aiutante-ct.user.js": RADICE / "userscript" / "aiutante-ct.user.js"}


class Pagina(SimpleHTTPRequestHandler):
    def do_GET(self):
        percorso = self.path.split("?")[0]
        f = FILE.get(percorso) or (DEMO / "chat.html" if percorso.startswith("/chat/") else None)
        if not f:
            return self.send_error(404)
        corpo = f.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", "text/javascript; charset=utf-8" if f.suffix == ".js" else "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(corpo)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(corpo)

    def log_message(self, *a):
        pass


if __name__ == "__main__":
    figli = [subprocess.Popen([sys.executable, str(RADICE / "tools" / "mock_engine.py"), "--port", "8535"]),
             subprocess.Popen([sys.executable, str(RADICE / "server" / "server.py"), "--demo", "--config", str(DEMO / "config.demo.json")])]
    url = "http://127.0.0.1:8530/chat/demo-story/?open=1"
    print(f"demo page: {url}")
    if "--no-browser" not in sys.argv:
        webbrowser.open(url)
    try:
        ThreadingHTTPServer(("127.0.0.1", 8530), Pagina).serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        for p in figli:
            p.terminate()
