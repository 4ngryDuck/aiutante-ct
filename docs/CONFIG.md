# Configuration

`server/config.json` is created from `server/config.example.json` on the first start. It is yours and is not in git.
After a change: STOP and START (or restart only the server).

| Key | Default | What it is |
|---|---|---|
| `port` | `8433` | Port of the helper server (the userscript's default address is `http://127.0.0.1:8433`) |
| `language` | `"Italian"` | Your language when the panel does not send one (⚙ Settings → *Your language* wins) |
| `data_dir` | `"data"` | History, lorebook versions, key, logs. Relative to the project folder or absolute |
| `network.enabled` | `false` | Also listen on other addresses (phone). Other devices must send the key in `data/key.txt` |
| `network.addresses` | `[]` | This PC's IPs to listen on, e.g. `["192.168.1.20", "100.101.102.103"]` |
| `engine.*` | | How START launches `llama-server` (below) |
| `engines.<name>` | `local`, `kobold` | OpenAI-compatible chat endpoints the server may use |
| `order.<job>` | `["local", "kobold"]` | For each job, engines tried in order: the first one running is used |
| `temperature.<job>` | | Sampling temperature per job |

## `engine` (only used by START / start.sh)

| Key | Example | |
|---|---|---|
| `backend` | `vulkan` / `cuda` / `cpu` / `metal` | Written by setup |
| `llama_dir` | `engine` | Where `llama-server` is |
| `model_file` | `models/gemma-4-26B-A4B-it-heretic.IQ4_XS.gguf` | Any `.gguf` works |
| `alias` | `local-model` | Name the server reports (keep it equal to `engines.local.model`) |
| `port` | `8434` | Keep it equal to the port in `engines.local.url` |
| `context` | `65536` | Context tokens, shared by `parallel` slots (2 × 32K: Translate does not wait for Lore) |
| `parallel` | `2` | |
| `extra_args` | `["--load-mode", "none", "-fa", "on", "-ctk", "q4_0", "-ctv", "q4_0", "--jinja", "--reasoning", "off"]` | Passed to llama-server as they are. `--load-mode none` loads the model without mmap: with the model fully in VRAM, llama-server uses ~0.9 GB of RAM instead of ~14 GB, same speed (this build has no `--no-mmap`) |
| `env` | `{"GGML_VK_DISABLE_INTEGER_DOT_PRODUCT": "1"}` | Environment variables. That one made prompt reading 2-3× faster on a Radeon VII (Vulkan) |

Recent llama.cpp builds fit the model to the **free** VRAM by themselves (`--fit`, on by default): if the card is busy
(other programs, the desktop), some layers' experts stay in RAM. It works, just slower; START warns you.

## Using an engine you already have

Leave START's engine alone by pointing `engines.local.url` at your server and keeping something running there:

| You have | `url` | `model` |
|---|---|---|
| llama-server | `http://127.0.0.1:8080/v1/chat/completions` | anything |
| KoboldCPP | `http://127.0.0.1:5001/v1/chat/completions` | `kobold` |
| LM Studio | `http://127.0.0.1:1234/v1/chat/completions` | the model id shown by LM Studio |
| Ollama | `http://127.0.0.1:11434/v1/chat/completions` | e.g. `gemma3:27b` |

Set `json_mode` to `true` only for engines that support `response_format: {"type": "json_object"}` (llama-server does).
`context_chars` is how much chat (in characters, ~4 per token) is sent for the long jobs: keep it below the engine's
context. `extra` is merged into every request (e.g. `{"chat_template_kwargs": {"enable_thinking": false}}`).

If START finds something already answering on `engine.port`, it uses it and does not start its own.
