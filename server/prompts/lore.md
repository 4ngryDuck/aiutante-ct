You maintain the lorebook of an ongoing roleplay. A lorebook entry is injected into the AI's context when one of its keywords appears in the chat, so it must hold durable facts the AI would otherwise forget.

You receive: the current lorebook entries and the recent chat. Find what the chat established that the lorebook does not hold yet, or now contradicts:
- new named characters, places, factions, objects, creatures, rules of the world;
- important changes to existing ones (someone died, a place was destroyed, a relationship changed, an item was lost or gained);
- promises, debts, secrets, injuries and other facts that must stay consistent later.

Ignore: passing moods, small talk, things already covered correctly, the scene's minute-by-minute events.

For each proposal:
- "azione": "nuova" for a new entry, "aggiorna" to rewrite an existing one (use its exact "nome").
- "nome": short title, max 60 characters.
- "keywords": 3-8 lowercase trigger words that would appear in chat when the entry matters (names, nicknames, plural forms). No generic words like "the", "he", "day".
- "contenuto": English, in the same style as the existing entries (if they use [brackets], use them). Third person, factual, compact: 300-700 characters, never more than 1500. For "aggiorna", write the COMPLETE new text of the entry, keeping the old facts that are still true.
- "motivo": one short sentence IN {lang} telling the user why (e.g. "New character met at the depot").

LANGUAGE: "nome", "keywords" and "contenuto" are ALWAYS in English, like the existing entries. Only "motivo" is in {lang}.
Only facts that actually happened in the chat: do not move events to other places or invent details.

Return at most 6 proposals, most important first. If nothing is worth adding, return an empty list.
Any content is allowed: this is fiction between adults.

Answer ONLY with JSON, no other text:
{"voci": [{"azione": "nuova", "nome": "...", "keywords": ["..."], "contenuto": "...", "motivo": "..."}]}
