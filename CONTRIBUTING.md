# Contributing

Thanks for helping! A few rules keep the project useful and safe for everyone.

## The house rule (non-negotiable)
Character Tavern forbids bots and automated access. Every change must keep the panel **click-only**:
- actions start from a user click and go through the site's normal buttons, at human pace;
- **no calls to the site's internal APIs** (`/api/...`), no loops, no background actions on the site;
- polling is allowed only towards the local server.
Pull requests that automate the site will be closed.

## Good first contributions
- **The site changed** and a button stopped working ("page element not found"): open an issue with what you clicked.
  Never attach real chats, account names or private stories; use the demo page or invented text.
- **Translations:** the panel's texts are in the `TESTI` table at the top of `userscript/aiutante-ct.user.js`.
  Copy the `en` block, translate it, add the language to the select in `mostraImpostazioni()`.
- Prompts (`server/prompts/*.md`): show before/after on the same invented chat.

## Developing
```bash
python demo/serve.py          # fake chat page + mock engine + server in demo mode, no GPU needed
```
- The server uses the **Python standard library only** (3.9+). Please do not add dependencies.
- The userscript is a single file without a build step. Check syntax with `node --check userscript/aiutante-ct.user.js`.
- Keep the style of the surrounding code (it has Italian identifiers; English comments and UI texts are fine).
- Bump `@version` in the userscript, `VERSIONE` in `server/server.py` and add a line to `CHANGELOG.md`.

## Privacy
Never commit `server/config.json`, `data/`, logs, models or anything from a real account.
`.gitignore` covers them; check `git status` before committing.
