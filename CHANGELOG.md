# Changelog

All notable changes. Format: [Keep a Changelog](https://keepachangelog.com), versions: [SemVer](https://semver.org).

## [0.7.0] - 2026-10-16 - first public release

### Added
- Panel in **English and Italian** (browser language, or chosen in ⚙ Settings); "your language" setting for
  Translate, Read, ideas and reasons (sent to the server, used in the prompts).
- **Setup** for Windows, Linux and macOS: downloads llama.cpp and a model, checks every SHA-256 (`scripts/downloads.json`);
  official embeddable Python on Windows if none is installed.
- Cross-platform **start / stop / status** (`scripts/launch.py`); START/STOP for Windows, `start.sh`/`stop.sh` for Unix.
  An engine already running on the port (your own llama-server, KoboldCPP, LM Studio…) is used, never closed.
- **Demo page** with a mock engine (`python demo/serve.py`): try the panel without a GPU and without the real site.
- Model choice and engine options in `server/config.json` (created from `config.example.json`).
- Little surprises in WMP 11 / Vista style (visualization, codes, tooltips), switchable off, respecting reduced motion.
- Userscript metadata for Greasy Fork / OpenUserJS (`@license`, `@homepageURL`, `@supportURL`, icon, `@noframes`).

### Changed
- Phone/network access is **off by default**; the key is random, created on the first start in `data/key.txt`.
- `@connect` limited to `127.0.0.1` and `localhost` (no more `@connect *`); the copy served by your PC adds its own
  address for phones.
- Data, logs and run files live in `data/` (configurable); server messages are in English.

## [0.6.0] - 2026-10-16 (private)
- Permanent facts in Summary, background jobs that survive a page reload, Lore entry cleaning, Ideas → "Into the box".

## [0.5.x] - 2026-10 (private)
- Lorebook versions and restore, "written by you" protection, draggable orb, phone access, background jobs.
