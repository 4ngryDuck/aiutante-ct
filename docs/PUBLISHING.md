# Publishing notes (for the maintainer)

## Userscript: two channels, one file

`userscript/aiutante-ct.user.js` in the repository has **no** `@updateURL` / `@downloadURL`.

1. **Local install** (recommended in the README): the helper server serves the file at
   `http://127.0.0.1:8433/aiutante-ct.user.js` and adds `@updateURL`/`@downloadURL` pointing at itself (and, for a
   phone, the address it used plus a matching `@connect`). Updates arrive when the user updates this folder, so the
   panel always matches the server version. Nothing external is involved.
2. **Greasy Fork / OpenUserJS**: upload the same file (or sync it from the raw GitHub URL). Greasy Fork serves updates
   itself and ignores foreign update URLs, which is why the repository file has none.

Greasy Fork checklist: `@license MIT` ✓, readable code (no minification) ✓, `@description` says the script needs a
local server ✓, no `@connect *` ✓ (only `127.0.0.1` and `localhost`), `@icon` is an inline SVG ✓, `@noframes` ✓.
A phone install from Greasy Fork cannot reach a LAN address unless the manager allows it: phones should use the local
install from the PC (channel 1).

## Before every release
1. Bump `@version` (userscript), `VERSIONE` (server/server.py), `CHANGELOG.md`, README badge.
2. `python demo/serve.py`, try every button in English and Italian.
3. Search for secrets/personal data: `git grep -nE "192\.168\.|100\.6[4-9]\.|key\.txt|@gmail"` (only docs examples).
4. Tag `vX.Y.Z` and create the GitHub release; then update Greasy Fork.
