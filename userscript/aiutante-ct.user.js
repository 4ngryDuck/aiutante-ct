// ==UserScript==
// @name            Aiutante CT - local AI helper for Character Tavern
// @name:it         Aiutante CT - aiutante IA locale per Character Tavern
// @namespace       https://github.com/4ngryDuck/aiutante-ct
// @version         0.7.1
// @description     A button bar for Character Tavern chats, powered by an AI model on YOUR PC: translate and polish your messages, lorebook proposals with versions and restore, current state, summaries, ideas. Needs the free local server from the homepage. Click-only: no bot, no site API.
// @description:it  Pulsantiera per le chat di Character Tavern con un modello IA sul TUO PC: traduci e rifinisci i messaggi, voci di lorebook con versioni e ripristino, stato, riassunti, idee. Serve il server locale gratuito (vedi homepage). Solo su clic: niente bot, niente API del sito.
// @author          4ngryDuck
// @license         MIT
// @homepageURL     https://github.com/4ngryDuck/aiutante-ct
// @supportURL      https://github.com/4ngryDuck/aiutante-ct/issues
// @icon            data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+PGRlZnM+PHJhZGlhbEdyYWRpZW50IGlkPSJnIiBjeD0iNTAlIiBjeT0iMTEwJSIgcj0iOTAlIj48c3RvcCBvZmZzZXQ9IjAiIHN0b3AtY29sb3I9IiM3ZmQ0ZmYiLz48c3RvcCBvZmZzZXQ9Ii4zIiBzdG9wLWNvbG9yPSIjMmE4ZmUwIi8+PHN0b3Agb2Zmc2V0PSIuNyIgc3RvcC1jb2xvcj0iIzBiNGM5YyIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzA2MjM0ZCIvPjwvcmFkaWFsR3JhZGllbnQ+PGxpbmVhckdyYWRpZW50IGlkPSJoIiB4MT0iMCIgeTE9IjAiIHgyPSIwIiB5Mj0iMSI+PHN0b3Agb2Zmc2V0PSIwIiBzdG9wLWNvbG9yPSIjZmZmIiBzdG9wLW9wYWNpdHk9Ii44NSIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iI2ZmZiIgc3RvcC1vcGFjaXR5PSIwIi8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMjkiIGZpbGw9InVybCgjZykiIHN0cm9rZT0iIzBhMWEzMyIgc3Ryb2tlLXdpZHRoPSIyIi8+PGVsbGlwc2UgY3g9IjMyIiBjeT0iMTkiIHJ4PSIyMSIgcnk9IjEzIiBmaWxsPSJ1cmwoI2gpIi8+PHBhdGggZD0iTTMyIDE2bDQgMTIgMTIgNC0xMiA0LTQgMTItNC0xMi0xMi00IDEyLTR6IiBmaWxsPSIjZmZmIi8+PC9zdmc+
// @match           https://character-tavern.com/*
// @noframes
// @grant           GM_xmlhttpRequest
// @grant           GM_getValue
// @grant           GM_setValue
// @grant           GM_setClipboard
// @connect         127.0.0.1
// @connect         localhost
// @run-at          document-idle
// ==/UserScript==

/*
 * Aiutante CT - https://github.com/4ngryDuck/aiutante-ct - MIT License
 *
 * House rule: every action starts from YOUR click and goes through the site's normal buttons, as you would do.
 * The script does NOT call Character Tavern's internal APIs, never runs by itself and never repeats actions in a loop.
 * The only request to the site is re-reading the chat page you are on (the same request as pressing F5), always after
 * a click of yours. The heavy work is done by the local server (server/server.py) with your own model.
 * Polling happens only towards that local server, for the status display.
 */
(function () {
    'use strict';

    // ------------------------------------------------------------ languages (panel in English or Italian)

    const TESTI = {
        en: {
            'title': 'Aiutante',
            'close': 'Close',
            'checking': 'checking the server…',
            'orb': 'Aiutante (click: open/close · drag: move)',
            'b.traduci': '⇄ Translate', 't.traduci': 'Your language → proper English, in the box (Ctrl+Alt+T)',
            'b.rifinisci': '✨ Polish', 't.rifinisci': 'Better prose for your message, same actions',
            'b.annulla': '↶ Undo', 't.annulla': 'Put the previous text back in the box',
            'b.leggi': '👁 Read', 't.leggi': 'Translate the last reply into your language',
            'b.lore': '📖 Lore', 't.lore': 'Propose new or updated lorebook entries',
            'b.stato': '🧭 State', 't.stato': 'Update the "Current State" entry (place, who is there, items…)',
            'b.riassunto': '📝 Summary', 't.riassunto': 'Story summary to paste into Memory',
            'b.idee': '💡 Ideas', 't.idee': 'Ideas to move the story forward',
            'b.backup': '💾 Backup', 't.backup': 'Save a copy of this chat\'s whole lorebook',
            'b.versioni': '🕘 Versions', 't.versioni': 'Saved lorebook copies: compare and restore',
            'b.guida': '❔ Guide', 't.guida': 'How it works',
            'b.impostazioni': '⚙ Settings', 't.impostazioni': 'Settings (language, server, phone)',
            'autosave': 'save to the lorebook by itself (otherwise it fills the form and you press the button)',
            'where.title': 'Account and chat the panel is working on (state, summaries and versions are kept separate for each)',
            'status': '{0} msg · {1} entries',
            'welcome': 'Write in your language in the box and press ⇄ Translate, or pick a job. First time? Press ❔ Guide.',
            'nothing.undo': 'Nothing to undo.',
            'undone': 'Previous text is back in the box.',
            'working': 'working…',
            'rereading': 'Reading the chat again…',
            'job.running': 'Working on your PC…',
            'box.empty': 'The message box is empty.',
            'no.reply': 'No reply to translate.',
            'lore.empty': 'This chat\'s lorebook is empty: nothing to save.',
            'backup.same': 'No changes since the last copy: the lorebook ({0} entries) is already saved.',
            'backup.done': 'Copy saved: {0} entries. You find it in 🕘 Versions.',
            'done.box': 'Done: {0}. Check it and send; ↶ to go back.',
            'in.box': 'Into the box',
            'lore.dropped': 'Dropped {0} broken proposals: {1}.',
            'lore.nothing': 'Nothing to add: the lorebook is up to date ({0}s).',
            'state.reason': 'Snapshot of the current situation',
            'idea.box': 'Into the box (in English)',
            'idea.writing': 'writing it as your message…',
            'idea.inbox': 'in the box: check and send (↶ to undo)',
            'copy': 'Copy', 'discard': 'Discard', 'done': 'Done.',
            'facts.ph': 'Permanent facts: full names, titles, family ties, numbers, secrets. In English, one line per fact. Example:\n- Mara Quill: born in Port Avel, her father is a lighthouse keeper.\n- The Order has 7 knights, all sworn to silence.',
            'sum.help': '1) Read the summary and fix mistakes: otherwise they repeat in later summaries. 2) Copy it and paste it into Settings → Memory → Summarization.',
            'facts.label': '📌 Permanent facts (written by you, true forever: the panel remembers them for this chat and passes them to Summary, State, Lore and Ideas)',
            'sum.label': '📝 Summary',
            'sum.copy': 'Copy facts + summary', 'sum.copied': 'Copied: paste it into Memory.',
            'sum.save': 'Save corrections', 'sum.saved': 'Corrected summary saved: the next one starts from here.',
            'resume': 'Picking up the job "{0}" started before the page was reloaded…',
            'resume.fail': 'The job "{0}" cannot be picked up: {1}',
            'tag.restore': 'restore', 'tag.update': 'update', 'tag.new': 'new',
            'tag.yours': '🔒 written by you', 'tag.yours.t': 'This entry was not created by the helper',
            'now.in': 'Now in the lorebook (it will be saved in 🕘 Versions before changing it):',
            'will.be': 'Will become:',
            'btn.restore': 'Restore in CT', 'btn.update': 'Update in CT', 'btn.insert': 'Insert in CT',
            'confirm.read': 'I have read the current version: replace it',
            'filling': 'filling in…',
            'need.kw': 'content and at least one keyword are needed',
            'before.restore': 'before restoring "{0}"', 'before.update': 'before updating "{0}"',
            'manual.backup': 'manual backup',
            'filled': 'filled in: check it and press the button yourself', 'version.saved': 'version saved; ',
            'entry.updated': 'entry updated (the previous version is in 🕘 Versions)', 'entry.created': 'entry created',
            'no.versions': 'No saved copies for this chat. Press 💾 Backup to make one; copies are also made by themselves before every change.',
            'versions.list': 'Lorebook copies of this chat ({0}). Click one to compare it with now.',
            'entries': '{0} entries',
            'opening': 'Opening the copy…',
            'all.copies': '← All copies',
            'copy.of': 'Copy of {0} ({1}): {2} entries. ',
            'n.diff': '{0} differ from now.', 'same.now': 'Same as the lorebook now.',
            'added.after': ' Entries added after this copy: {0}.',
            'was.so': 'In the copy it was like this', 'was.gone': 'It was in the copy, now it is gone',
            'same': 'same',
            'err.notfound': 'page element not found (did the site change?)',
            'err.settings': 'Settings button not found',
            'err.nolore': 'this chat has no lorebook yet: press "Create New Lorebook" (or "Get from Original Card") in the site Lorebook panel, then press the button again',
            'err.form': 'the site\'s form did not fill completely: check it and press the button yourself',
            'err.rejected': 'the site did not accept the entry: check the form and press the button yourself',
            'err.off': 'server off or unreachable: start Aiutante CT on your PC',
            'err.timeout': 'timed out', 'err.bad': 'invalid answer from the server', 'err.net': 'network',
            'lbl.server': 'Helper server address (more than one, separated by commas: the first that answers is used)',
            'lbl.key': 'Key (only for a phone or another PC: it is in data/key.txt inside the Aiutante CT folder)',
            'key.ph': 'only for the phone',
            'lbl.ui': 'Panel language', 'lbl.mylang': 'Your language (for ⇄ Translate, 👁 Read, ideas and reasons)',
            'lbl.fun': 'Visualizations and little surprises',
            'save.test': 'Save and test', 'default.addr': 'Default address', 'orb.reset': 'Put the orb back bottom-right',
            'conn.ok': 'Connected to {0}.',
            'conn.key': 'The PC answers but the KEY is wrong: copy it again from data/key.txt (no spaces).',
            'conn.net': 'The PC does not answer: check the address (http://… :8433), the network and that Aiutante CT is on.',
            'lamp.key': 'wrong key: open ⚙ Settings', 'lamp.off': 'server off: start Aiutante CT on your PC',
            'lamp.far': 'PC not reachable: on? same network? ⚙ Settings', 'lamp.nomodel': 'no model running',
            'slow': '⚠ slow', 'slow.t': '\nSlow: the graphics card is probably full (STOP and START again).',
            'last.job': 'last job: {0} ({1})', 'tok.read': ', {0} tokens read',
            'wait.chat': 'touch the orb to read the chat',
            'g.how': 'How it works',
            'g.how1': 'Drag the ✦ orb wherever you like; one click opens and closes the panel.',
            'g.how2': 'The panel works on the chat open in this tab: the 👤 · 💬 line under the display tells which account and chat.',
            'g.how3': 'Every button reads the chat again from the start: deleted and edited messages and swipes are always up to date.',
            'g.write': 'Writing',
            'g.write1': '⇄ Translate: write in your language in the box, press it, it becomes English (also Ctrl+Alt+T).',
            'g.write2': '✨ Polish: same actions, better written. ↶ Undo puts the previous text back.',
            'g.write3': '👁 Read: the character\'s last reply, in your language.',
            'g.lore': 'Lorebook',
            'g.lore1': '📖 Lore proposes new or updated entries; 🧭 State writes the "Current State" entry. You can edit them before inserting.',
            'g.lore2': 'Before changing an existing entry the helper always saves a copy (🕘 Versions).',
            'g.lore3': '🔒 written by you: entries the helper did not create are replaced only after you tick the confirmation.',
            'g.lore4': '💾 Backup saves the whole lorebook whenever you want. 🕘 Versions compares a copy with now and restores an entry.',
            'g.lore5': '"save by itself" on: fills in and saves. Off: fills in and lets you press Create/Save.',
            'g.mem': 'Memory and ideas',
            'g.mem1': '📝 Summary: read it and fix mistakes, then "Copy facts + summary" and paste into Settings → Memory → Summarization. Every 25-30 messages.',
            'g.mem2': '📌 Permanent facts (inside 📝 Summary): names, family ties, numbers that must never change. Write them once; they hold forever for this chat.',
            'g.mem3': '🧭 State every 10-15 messages or at every scene change.',
            'g.mem4': '💡 Ideas: suggestions for what comes next; "Into the box" writes one in English as your next message.',
            'g.trouble': 'If something is wrong',
            'g.trouble1': 'Red light: start Aiutante CT on your PC (START).',
            'g.trouble2': '⚠ slow in the display: the graphics card is full; close games or other models, then STOP and START.',
            'g.trouble3': '"page element not found": the site changed its look. Please open an issue on GitHub.',
            'g.rule': 'Every action starts from your click: the helper never does anything on the site by itself.',
            'egg.konami': 'Aero Glass™ unlocked. Your PC now scores 5.9 in the Windows Experience Index. (Not really.)',
            'egg.cd': 'Burning lorebook to CD… {0}%',
            'egg.cd.end': 'Just kidding. Your lorebook is safe, and it is 2026.',
            'egg.ver': 'Build 6000.16386 — totally unrelated to any 2007 operating system.',
            'egg.bday': '🎂 Happy birthday, Windows Vista (30 January 2007)',
            'egg.play': '▶ Now playing: {0}',
        },
        it: {
            'title': 'Aiutante',
            'close': 'Chiudi',
            'checking': 'controllo il server…',
            'orb': 'Aiutante (clic: apri/chiudi · trascina: sposta)',
            'b.traduci': '⇄ Traduci', 't.traduci': 'La tua lingua → inglese corretto, nel box (Ctrl+Alt+T)',
            'b.rifinisci': '✨ Rifinisci', 't.rifinisci': 'Migliora la prosa del tuo messaggio',
            'b.annulla': '↶ Annulla', 't.annulla': 'Rimetti il testo di prima nel box',
            'b.leggi': '👁 Leggi', 't.leggi': 'Traduci nella tua lingua l\'ultima risposta',
            'b.lore': '📖 Lore', 't.lore': 'Proponi voci nuove o aggiornate per il lorebook',
            'b.stato': '🧭 Stato', 't.stato': 'Aggiorna la voce Current State (luogo, chi c\'e\', oggetti...)',
            'b.riassunto': '📝 Riassunto', 't.riassunto': 'Riassunto della storia da incollare in Memory',
            'b.idee': '💡 Idee', 't.idee': 'Spunti per far andare avanti la storia',
            'b.backup': '💾 Backup', 't.backup': 'Salva una copia di tutto il lorebook di questa chat',
            'b.versioni': '🕘 Versioni', 't.versioni': 'Copie salvate del lorebook: confronta e ripristina',
            'b.guida': '❔ Guida', 't.guida': 'Come si usa',
            'b.impostazioni': '⚙ Impost.', 't.impostazioni': 'Impostazioni (lingua, server, smartphone)',
            'autosave': 'salva da solo nel lorebook (altrimenti compila e premi tu)',
            'where.title': 'Account e chat su cui sta lavorando il pannello (stato, riassunti e versioni sono separati per ognuna)',
            'status': '{0} msg · {1} voci',
            'welcome': 'Scrivi in italiano nel box e premi ⇄ Traduci, oppure scegli un lavoro. Prima volta? Premi ❔ Guida.',
            'nothing.undo': 'Niente da annullare.',
            'undone': 'Testo di prima rimesso nel box.',
            'working': 'al lavoro…',
            'rereading': 'Rileggo la chat…',
            'job.running': 'Lavoro in corso sul tuo PC…',
            'box.empty': 'Il box del messaggio e\' vuoto.',
            'no.reply': 'Nessuna risposta da tradurre.',
            'lore.empty': 'Il lorebook di questa chat e\' vuoto: niente da salvare.',
            'backup.same': 'Nessuna modifica dall\'ultima copia: il lorebook ({0} voci) e\' gia\' salvato.',
            'backup.done': 'Copia salvata: {0} voci. La trovi in 🕘 Versioni.',
            'done.box': 'Fatto: {0}. Controlla e invia; ↶ per tornare indietro.',
            'in.box': 'Nel box',
            'lore.dropped': 'Scartate {0} proposte rotte: {1}.',
            'lore.nothing': 'Niente da aggiungere: il lorebook e\' gia\' in pari ({0}s).',
            'state.reason': 'Fotografia della situazione attuale',
            'idea.box': 'Nel box (in inglese)',
            'idea.writing': 'la scrivo come tuo messaggio…',
            'idea.inbox': 'nel box: controlla e invia (↶ per annullare)',
            'copy': 'Copia', 'discard': 'Scarta', 'done': 'Fatto.',
            'facts.ph': 'Permanent facts: nomi completi, titoli, parentele, numeri, segreti. In inglese, una riga per fatto. Esempio:\n- Mara Quill: born in Port Avel, her father is a lighthouse keeper.\n- The Order has 7 knights, all sworn to silence.',
            'sum.help': '1) Leggi il riassunto e correggi gli errori: se no si ripetono nei riassunti dopo. 2) Copia e incolla in Settings → Memory → Summarization.',
            'facts.label': '📌 Fatti fissi (scritti da te, valgono per sempre: il pannello li ricorda per questa chat e li passa a Riassunto, Stato, Lore e Idee)',
            'sum.label': '📝 Riassunto',
            'sum.copy': 'Copia fatti + riassunto', 'sum.copied': 'Copiato: incollalo in Memory.',
            'sum.save': 'Salva le correzioni', 'sum.saved': 'Riassunto corretto salvato: il prossimo partira\' da qui.',
            'resume': 'Riprendo il lavoro "{0}" iniziato prima di ricaricare la pagina…',
            'resume.fail': 'Il lavoro "{0}" non si puo\' riprendere: {1}',
            'tag.restore': 'ripristina', 'tag.update': 'aggiorna', 'tag.new': 'nuova',
            'tag.yours': '🔒 scritta da te', 'tag.yours.t': 'Questa voce non l\'ha creata l\'aiutante',
            'now.in': 'Adesso nel lorebook (verra\' salvata in 🕘 Versioni prima di cambiarla):',
            'will.be': 'Diventera\':',
            'btn.restore': 'Ripristina in CT', 'btn.update': 'Aggiorna in CT', 'btn.insert': 'Inserisci in CT',
            'confirm.read': 'Ho letto la versione di adesso: sostituiscila',
            'filling': 'sto compilando…',
            'need.kw': 'servono contenuto e almeno una keyword',
            'before.restore': 'prima di ripristinare "{0}"', 'before.update': 'prima di aggiornare "{0}"',
            'manual.backup': 'backup a mano',
            'filled': 'compilato: controlla e premi tu il pulsante', 'version.saved': 'versione salvata; ',
            'entry.updated': 'voce aggiornata (la versione di prima e\' in 🕘 Versioni)', 'entry.created': 'voce creata',
            'no.versions': 'Nessuna copia salvata per questa chat. Premi 💾 Backup per farne una; le copie si fanno anche da sole prima di ogni modifica.',
            'versions.list': 'Copie del lorebook di questa chat ({0}). Clicca per confrontare con adesso.',
            'entries': '{0} voci',
            'opening': 'Apro la copia…',
            'all.copies': '← Tutte le copie',
            'copy.of': 'Copia del {0} ({1}): {2} voci. ',
            'n.diff': '{0} diverse da adesso.', 'same.now': 'Uguale al lorebook di adesso.',
            'added.after': ' Voci aggiunte dopo questa copia: {0}.',
            'was.so': 'Nella copia era cosi\'', 'was.gone': 'Nella copia c\'era, adesso non c\'e\' piu\'',
            'same': 'uguale',
            'err.notfound': 'elemento della pagina non trovato (il sito e\' cambiato?)',
            'err.settings': 'pulsante Settings non trovato',
            'err.nolore': 'questa chat non ha ancora un lorebook: premi "Create New Lorebook" (o "Get from Original Card") nel riquadro Lorebook del sito, poi premi di nuovo il pulsante',
            'err.form': 'il modulo del sito non si e\' riempito del tutto: controlla e premi tu il pulsante',
            'err.rejected': 'il sito non ha accettato la voce: controlla il modulo e premi tu il pulsante',
            'err.off': 'server spento o irraggiungibile: accendi l\'Aiutante CT sul PC',
            'err.timeout': 'tempo scaduto', 'err.bad': 'risposta non valida dal server', 'err.net': 'rete',
            'lbl.server': 'Indirizzo del server dell\'aiutante (anche piu\' di uno, separati da virgola: si usa il primo che risponde)',
            'lbl.key': 'Chiave (serve solo da smartphone o da un altro PC: e\' in data/key.txt nella cartella dell\'Aiutante CT)',
            'key.ph': 'solo per lo smartphone',
            'lbl.ui': 'Lingua del pannello', 'lbl.mylang': 'La tua lingua (per ⇄ Traduci, 👁 Leggi, idee e motivi)',
            'lbl.fun': 'Visualizzazioni e piccole sorprese',
            'save.test': 'Salva e prova', 'default.addr': 'Indirizzo predefinito', 'orb.reset': 'Rimetti la sfera in basso a destra',
            'conn.ok': 'Collegato a {0}.',
            'conn.key': 'Il PC risponde ma la CHIAVE e\' sbagliata: ricopiala da data/key.txt (senza spazi).',
            'conn.net': 'Il PC non risponde: controlla l\'indirizzo (http://… :8433), la rete e che l\'aiutante sia acceso.',
            'lamp.key': 'chiave sbagliata: tocca ⚙ Impost.', 'lamp.off': 'server spento: accendi l\'Aiutante CT sul PC',
            'lamp.far': 'PC non raggiungibile: acceso? stessa rete? ⚙ Impost.', 'lamp.nomodel': 'nessun modello acceso',
            'slow': '⚠ lento', 'slow.t': '\nLento: probabilmente la scheda video e\' piena (STOP e START di nuovo).',
            'last.job': 'ultimo lavoro: {0} ({1})', 'tok.read': ', {0} token letti',
            'wait.chat': 'tocca la sfera per leggere la chat',
            'g.how': 'Come si usa',
            'g.how1': 'La sfera ✦ si trascina dove vuoi; un clic apre e chiude il pannello.',
            'g.how2': 'Il pannello lavora sulla chat aperta in questa scheda: la riga 👤 · 💬 sotto il display dice quale account e quale chat.',
            'g.how3': 'A ogni pulsante rilegge la chat da capo: messaggi cancellati, modificati e swipe sono sempre aggiornati.',
            'g.write': 'Scrivere',
            'g.write1': '⇄ Traduci: scrivi in italiano nel box, premi, diventa inglese (anche Ctrl+Alt+T).',
            'g.write2': '✨ Rifinisci: stesse azioni, scritte meglio. ↶ Annulla rimette il testo di prima.',
            'g.write3': '👁 Leggi: l\'ultima risposta del personaggio, in italiano.',
            'g.lore': 'Lorebook',
            'g.lore1': '📖 Lore propone voci nuove o aggiornate; 🧭 Stato scrive la voce "Current State". Puoi correggerle prima di inserirle.',
            'g.lore2': 'Prima di cambiare una voce esistente l\'aiutante ne salva sempre una copia (🕘 Versioni).',
            'g.lore3': '🔒 scritta da te: le voci che non ha creato l\'aiutante si sostituiscono solo dopo che spunti la conferma.',
            'g.lore4': '💾 Backup salva tutto il lorebook quando vuoi. 🕘 Versioni confronta una copia con adesso e ripristina una voce.',
            'g.lore5': '"salva da solo" acceso: compila e salva. Spento: compila e ti lascia premere Create/Save.',
            'g.mem': 'Memoria e idee',
            'g.mem1': '📝 Riassunto: leggilo e correggi gli errori, poi "Copia fatti + riassunto" e incolla in Settings → Memory → Summarization. Ogni 25-30 messaggi.',
            'g.mem2': '📌 Fatti fissi (dentro 📝 Riassunto): nomi, parentele, numeri che non devono cambiare mai. Li scrivi tu una volta; valgono per sempre per questa chat.',
            'g.mem3': '🧭 Stato ogni 10-15 messaggi o a ogni cambio di scena.',
            'g.mem4': '💡 Idee: spunti per il seguito; "Nel box" li scrive in inglese come tuo prossimo messaggio.',
            'g.trouble': 'Se qualcosa non va',
            'g.trouble1': 'Spia rossa: accendi l\'aiutante sul PC (START).',
            'g.trouble2': '⚠ lento nel display: la scheda video e\' piena; chiudi giochi o altri modelli, poi STOP e START.',
            'g.trouble3': '"elemento della pagina non trovato": il sito e\' cambiato aspetto. Apri una segnalazione su GitHub.',
            'g.rule': 'Ogni azione parte da un tuo clic: l\'aiutante non fa niente da solo sul sito.',
            'egg.konami': 'Aero Glass™ sbloccato. Il tuo PC ora fa 5,9 nell\'Indice prestazioni Windows. (Non e\' vero.)',
            'egg.cd': 'Masterizzo il lorebook su CD… {0}%',
            'egg.cd.end': 'Scherzo. Il lorebook e\' al sicuro, ed e\' il 2026.',
            'egg.ver': 'Build 6000.16386 — nessun legame con sistemi operativi del 2007.',
            'egg.bday': '🎂 Buon compleanno, Windows Vista (30 gennaio 2007)',
            'egg.play': '▶ In riproduzione: {0}',
        },
    };
    const linguaPannello = () => {
        const scelta = GM_getValue('ui_lang', 'auto');
        if (TESTI[scelta]) return scelta;
        return /^it\b/i.test(navigator.language || '') ? 'it' : 'en';
    };
    const LINGUA = linguaPannello();
    /** t('key', a, b) -> text in the panel language, with {0} {1} filled in. */
    const t = (k, ...a) => String(TESTI[LINGUA][k] ?? TESTI.en[k] ?? k).replace(/\{(\d)\}/g, (_, i) => a[i]);
    /** The user's own language, sent to the server for translations, reasons and ideas. */
    const miaLingua = () => GM_getValue('my_lang', '') || (LINGUA === 'it' ? 'Italian' : 'English');

    // Server address(es) and key: changed from ⚙ (needed only for a phone). With several addresses
    // (e.g. home network and Tailscale) the first that answers is used. The local server rewrites this line
    // when the script is installed from another device.
    const SERVER_PREDEFINITO = 'http://127.0.0.1:8433';
    const indirizzi = () => GM_getValue('server', SERVER_PREDEFINITO).split(/[\s,;]+/).filter(Boolean).map((s) => s.replace(/\/+$/, ''));
    let attivo = null;
    const server = () => attivo || indirizzi()[0];
    const chiaveServer = () => GM_getValue('chiave', '');

    // ------------------------------------------------------------ reading the data already in the page

    /**
     * Tiny parser for the JS objects SvelteKit puts in the page (no eval).
     * Repeated strings become variables: (function(a){ ...message:a... }("text")). `scope` resolves them.
     */
    function nuovoParser(src, i, scope = {}) {
        const spazi = () => { while (i < src.length && /\s/.test(src[i])) i++; };
        const ident = () => { const m = /^[A-Za-z_$][\w$]*/.exec(src.slice(i, i + 200)); if (!m) throw new Error('name expected at ' + i); i += m[0].length; return m[0]; };
        function stringa() {
            const q = src[i]; let j = i + 1;
            while (j < src.length && src[j] !== q) j += src[j] === '\\' ? 2 : 1;
            const grezza = src.slice(i, j + 1); i = j + 1;
            if (q === '"') return JSON.parse(grezza);
            return JSON.parse('"' + grezza.slice(1, -1).replace(/\\'/g, "'").replace(/"/g, '\\"') + '"');
        }
        function argomenti() { // (a, b, ...)
            const out = []; i++; spazi();
            while (src[i] !== ')') { out.push(valore()); spazi(); if (src[i] === ',') i++; spazi(); }
            i++; return out;
        }
        function valore() {
            spazi();
            const c = src[i];
            if (c === '{') {
                const o = {}; i++; spazi();
                while (src[i] !== '}') {
                    const k = (src[i] === '"' || src[i] === "'") ? stringa() : ident();
                    spazi(); i++; // :
                    o[k] = valore(); spazi();
                    if (src[i] === ',') i++; spazi();
                }
                i++; return o;
            }
            if (c === '[') {
                const a = []; i++; spazi();
                while (src[i] !== ']') { a.push(valore()); spazi(); if (src[i] === ',') i++; spazi(); }
                i++; return a;
            }
            if (c === '"' || c === "'") return stringa();
            const num = /^-?(\d+\.?\d*(e[+-]?\d+)?|\.\d+)/i.exec(src.slice(i, i + 40));
            if (num) { i += num[0].length; return Number(num[0]); }
            const nome = ident();
            spazi();
            if (nome === 'new') { ident(); spazi(); const a = src[i] === '(' ? argomenti() : []; return a[0] ?? null; }
            if (nome === 'void') { valore(); return undefined; }
            if (src[i] === '(') { argomenti(); return null; }
            if (Object.prototype.hasOwnProperty.call(scope, nome)) return scope[nome];
            return ({ true: true, false: false, null: null, undefined: undefined, Infinity: Infinity, NaN: NaN })[nome] ?? null;
        }
        return { valore, argomenti };
    }

    /** Index right after the bracket closing the one at src[i], skipping strings. */
    function fineBlocco(src, i) {
        let d = 0, q = null;
        for (; i < src.length; i++) {
            const c = src[i];
            if (q) { if (c === '\\') i++; else if (c === q) q = null; continue; }
            if (c === '"' || c === "'" || c === '`') q = c;
            else if ('{[('.includes(c)) d++;
            else if ('}])'.includes(c) && --d === 0) return i + 1;
        }
        return -1;
    }

    function variabili(t) {
        const m = /\(function\(([\w$,]*)\)\s*\{/.exec(t);
        if (!m) return {};
        let j = fineBlocco(t, m.index + m[0].length - 1);
        while (/\s/.test(t[j])) j++;
        if (t[j] !== '(') return {};
        const valori = nuovoParser(t, j).argomenti();
        return Object.fromEntries(m[1].split(',').filter(Boolean).map((n, k) => [n, valori[k]]));
    }

    function cercaOggetto(testo, chiave, scope) {
        const m = new RegExp('[{,]' + chiave + ':(?=[\\[{])').exec(testo);
        if (!m) return null;
        try { return nuovoParser(testo, m.index + m[0].length, scope).valore(); } catch (e) { console.warn('[aiutante]', chiave, e); return null; }
    }

    function scriptDati(documento) {
        const s = [...documento.scripts].find((x) => x.textContent.includes('messages:['));
        return s ? s.textContent : null;
    }

    function leggiPagina(t) {
        if (!t) return null;
        let scope = {};
        try { scope = variabili(t); } catch (e) { console.warn('[aiutante] variabili', e); }
        const messaggi = cercaOggetto(t, 'messages', scope) || [];
        const lorebook = cercaOggetto(t, 'lorebook', scope);
        const card = cercaOggetto(t, 'card', scope) || {};
        const chat = cercaOggetto(t, 'chat', scope) || {};
        const io = cercaOggetto(t, 'user', scope) || {};
        const idPersona = Number((/[{,]selectedPersona:(\d+)/.exec(t) || [])[1]);
        const persona = (cercaOggetto(t, 'personas', scope) || []).find((p) => p.id === idPersona) || {};
        const personaggio = card.inChatName || card.name || 'Character';
        const utente = persona.name || 'User';
        return {
            account: io.username || io.displayName || 'account',
            chatId: chat.id || 0,
            carta: card.name || personaggio,
            personaggio,
            utente,
            riassunto: typeof chat.summary === 'string' ? chat.summary : '',
            messaggi: messaggi.map((m) => {
                const scelto = (m.swipes || []).find((s) => s.isSelected);
                return { ruolo: m.role, nome: m.role === 'user' ? utente : personaggio, testo: (scelto && scelto.content) || m.message || '' };
            }),
            lorebook: ((lorebook && lorebook.entries) || []).map((e) => ({ nome: e.name || '', keywords: e.keys || [], contenuto: e.content || '', attiva: e.enabled !== false })),
        };
    }

    const dati = Object.assign({ account: 'account', chatId: 0, carta: '', personaggio: 'Character', utente: 'User', riassunto: '', messaggi: [], lorebook: [], create: [] },
        leggiPagina(scriptDati(document)) || {});
    // Previous state and summary: one per ACCOUNT + CHAT (two accounts, or two chats of the same card, never mix).
    const CHIAVE = (k) => `${dati.account}::${dati.chatId}::${k}`;

    function scaricaPagina() {
        return fetch(location.href, { credentials: 'include', cache: 'no-store' })
            .then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
            .catch(() => new Promise((ok, ko) => GM_xmlhttpRequest({   // fallback for Firefox/LibreWolf
                method: 'GET', url: location.href, timeout: 20000,
                onload: (r) => (r.status === 200 ? ok(r.responseText) : ko(new Error('HTTP ' + r.status))),
                onerror: () => ko(new Error(t('err.net'))), ontimeout: () => ko(new Error(t('err.timeout'))),
            })));
    }

    /**
     * Reads the chat as it is now: fetches the page "quietly" (the same request as F5) and reads its data,
     * so deleted/edited messages, swipes and lorebook entries are always up to date.
     * Runs only after a click of yours (a button or opening the panel), never by itself.
     */
    async function aggiornaDati() {
        try {
            const nuovo = leggiPagina(scriptDati(new DOMParser().parseFromString(await scaricaPagina(), 'text/html')));
            if (nuovo) Object.assign(dati, nuovo);
        } catch (e) {
            console.warn('[aiutante] cannot re-read the chat, using the one already read', e);
        }
        try { dati.create = (await chiamaServer('/lorebook/versioni', {})).create || []; } catch (e) { /* server off */ }
        aggiornaStato();
    }

    // ------------------------------------------------------------ calls to the local server

    function chiamaServer(percorso, extra = {}, riprova = true) {
        const corpo = { chat: location.pathname, account: dati.account, chat_id: dati.chatId, ...extra };
        return new Promise((ok, ko) => {
            GM_xmlhttpRequest({
                method: 'POST', url: server() + percorso, data: JSON.stringify(corpo), timeout: 900000,
                headers: { 'Content-Type': 'application/json', 'X-Chiave': chiaveServer() },
                onload: (r) => { try { const j = JSON.parse(r.responseText); j.ok ? ok(j) : ko(new Error(j.errore || 'error')); } catch (e) { ko(new Error(t('err.bad'))); } },
                onerror: async () => {
                    // Network changed (e.g. left home)? Look for another address that answers and retry once.
                    if (riprova && indirizzi().length > 1) {
                        const vecchio = server();
                        attivo = null;
                        await salute();
                        if (server() !== vecchio) return chiamaServer(percorso, extra, false).then(ok, ko);
                    }
                    ko(new Error(t('err.off')));
                },
                ontimeout: () => ko(new Error(t('err.timeout'))),
            });
        });
    }

    function chiediEsito(id) {
        return new Promise((ok, ko) => GM_xmlhttpRequest({
            method: 'GET', url: `${server()}/esito/${id}`, timeout: 20000, headers: { 'X-Chiave': chiaveServer() },
            onload: (r) => { try { ok(JSON.parse(r.responseText)); } catch (e) { ko(new Error(t('err.bad'))); } },
            onerror: () => ko(new Error(t('err.net'))), ontimeout: () => ko(new Error(t('err.net'))),
        }));
    }

    /**
     * The server starts the job and answers at once with an id; then the panel asks "done?" every 3 seconds.
     * A single long request (a 3+ minute Lore) used to be closed by the browser before the answer.
     */
    async function lavoro(nome, extra = {}) {
        const avvio = await chiamaServer(`/lavoro/${nome}`,
            { personaggio: dati.personaggio, utente: dati.utente, messaggi: dati.messaggi, lorebook: dati.lorebook,
              fatti_fissi: GM_getValue(CHIAVE('fissi'), ''), lingua: miaLingua(), ...extra, in_fondo: true });
        if (!avvio.in_fondo) return avvio;   // old server: it already answered with the result
        // Remember the running job: if the page is reloaded, the panel picks it up again (see riprendi()).
        GM_setValue(CHIAVE('incorso'), { id: avvio.in_fondo, nome, quando: Date.now() });
        try { return await attendiEsito(avvio.in_fondo); } finally { GM_setValue(CHIAVE('incorso'), null); }
    }

    async function attendiEsito(id) {
        let falliti = 0;
        for (const fine = Date.now() + 1800000; Date.now() < fine;) {
            await new Promise((r) => setTimeout(r, 3000));
            let j;
            try { j = await chiediEsito(id); falliti = 0; } catch (e) {
                if (++falliti >= 10) throw new Error(t('err.off'));
                continue;
            }
            if (j.ok && j.finito === false) continue;
            if (!j.ok) throw new Error(j.errore || 'error');
            return j;
        }
        throw new Error(t('err.timeout'));
    }

    const backup = (motivo, forza = false) => chiamaServer('/lorebook/backup', { lorebook: dati.lorebook, motivo, forza });

    // ------------------------------------------------------------ actions on the page (like your clicks)

    const dorme = (ms) => new Promise((r) => setTimeout(r, ms));
    async function aspetta(fn, ms = 5000) {
        const fine = Date.now() + ms;
        while (Date.now() < fine) { const x = fn(); if (x) return x; await dorme(100); }
        throw new Error(t('err.notfound'));
    }
    function imposta(el, v) {
        const p = Object.getPrototypeOf(el);
        Object.getOwnPropertyDescriptor(p, 'value').set.call(el, v);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
    }
    const finestre = () => [...document.querySelectorAll('[role=dialog]')];
    const bottone = (radice, testo) => [...radice.querySelectorAll('button')].find((b) => b.innerText.trim() === testo);
    const casella = () => document.querySelector('textarea[placeholder="Type here"]');
    const stesso = (a, b) => (a || '').trim().toLowerCase() === (b || '').trim().toLowerCase();

    async function apriLorebook() {
        let pannello = finestre().find((d) => /SELECT LOREBOOK/i.test(d.innerText));
        if (pannello) return pannello;
        if (!finestre().some((d) => /Chat Settings/.test(d.innerText))) {
            const imp = document.querySelector('button[aria-label="Settings"], button[title="Settings"]')
                || [...document.querySelectorAll('header button, button')].find((b) => /settings/i.test(b.getAttribute('aria-label') || ''));
            if (!imp) throw new Error(t('err.settings'));
            imp.click();
        }
        const tessera = await aspetta(() => finestre().map((d) => [...d.querySelectorAll('button')].find((b) => /^Lorebooks/.test(b.innerText.trim()))).find(Boolean));
        tessera.click();
        // Chat senza lorebook: il sito mostra "No lorebooks available" invece della lista; lo dico chiaro.
        const vuoto = () => [...document.querySelectorAll('[role=dialog], aside, section, div')]
            .find((d) => d.children.length < 40 && /No lorebooks available/i.test(d.innerText || ''));
        pannello = await aspetta(() => finestre().find((d) => /SELECT LOREBOOK/i.test(d.innerText)) || (vuoto() ? 'vuoto' : null));
        if (pannello === 'vuoto') throw new Error(t('err.nolore'));
        if (!bottone(pannello, 'Add Entry')) throw new Error(t('err.nolore'));
        return pannello;
    }

    async function riempiModulo(modulo, voce) {
        imposta(modulo.querySelector('input[placeholder="Entry name"]'), voce.nome.slice(0, 100));
        imposta(modulo.querySelector('textarea'), voce.contenuto.slice(0, 6000));
        // After every removal the list is redrawn: always remove the first one while there are any.
        for (let n = 0; n < 60; n++) {
            const via = modulo.querySelector('button[aria-label^="Remove keyword"]');
            if (!via) break;
            via.click();
            await dorme(80);
        }
        const kw = modulo.querySelector('input[placeholder^="Type a keyword"]');
        const parole = voce.keywords.slice(0, 50);
        for (const k of parole) {
            imposta(kw, k);
            modulo.querySelector('button[aria-label="Add keyword"]').click();
            await dorme(80);
        }
        // Before pressing Create/Save, wait until the site's form is really full (text and all keywords).
        const testo = voce.contenuto.slice(0, 6000);
        await aspetta(() => modulo.querySelector('textarea').value === testo
            && modulo.querySelectorAll('button[aria-label^="Remove keyword"]').length === parole.length, 4000)
            .catch(() => { throw new Error(t('err.form')); });
    }

    /** Creates or updates an entry through the site's buttons. Before touching an existing entry it saves a version. */
    async function inserisciVoce(voce, salva, motivo) {
        const esistente = dati.lorebook.find((v) => stesso(v.nome, voce.nome));
        if (esistente) {
            // No safety copy, no change.
            await backup(motivo || t('before.update', esistente.nome), true);
        }
        const pannello = await apriLorebook();
        let modulo;
        if (esistente) {
            const scheda = await aspetta(() => [...pannello.querySelectorAll('*')].find((e) => e.children.length === 0 && e.textContent.trim() === esistente.nome));
            scheda.click();
            const vista = await aspetta(() => finestre().find((d) => bottone(d, 'Edit')));
            bottone(vista, 'Edit').click();
            modulo = await aspetta(() => finestre().find((d) => /Edit Entry/.test(d.innerText)));
        } else {
            bottone(pannello, 'Add Entry').click();
            modulo = await aspetta(() => finestre().find((d) => /Create New Entry/.test(d.innerText)));
        }
        await riempiModulo(modulo, voce);
        if (!salva) return (esistente ? t('version.saved') : '') + t('filled');
        const conferma = bottone(modulo, esistente ? 'Save Changes' : 'Create Entry');
        await dorme(300);
        conferma.click();
        await dorme(900);
        // The site sometimes refuses ("Entry content is required") if the click comes too early: set the text again and retry once.
        if (document.body.contains(modulo) && /is required/i.test(modulo.innerText)) {
            imposta(modulo.querySelector('textarea'), voce.contenuto.slice(0, 6000));
            await dorme(500);
            conferma.click();
            await dorme(900);
            if (document.body.contains(modulo) && /is required/i.test(modulo.innerText)) throw new Error(t('err.rejected'));
        }
        if (esistente) {
            const vista = finestre().find((d) => bottone(d, 'Edit'));
            if (vista) { const x = vista.querySelector('button[aria-label="Close"]'); if (x) x.click(); }
            Object.assign(esistente, { nome: voce.nome, keywords: voce.keywords, contenuto: voce.contenuto });
            return t('entry.updated');
        }
        dati.lorebook.push({ nome: voce.nome, keywords: voce.keywords, contenuto: voce.contenuto, attiva: true });
        try { dati.create = (await chiamaServer('/lorebook/creata', { nome: voce.nome })).create; } catch (e) { /* not serious */ }
        return t('entry.created');
    }

    // ------------------------------------------------------------ interface

    const ospite = document.createElement('div');
    ospite.style.cssText = 'position:fixed;z-index:2147483000;width:44px;height:44px;';
    document.body.appendChild(ospite);
    const ombra = ospite.attachShadow({ mode: 'open' });
    ombra.innerHTML = `
<style>
  :host { all: initial; }
  * { box-sizing: border-box; font-family: "Segoe UI", Tahoma, sans-serif; }

  /* ---- the orb (like the Play button of Windows Media Player 11): drag it wherever you like ---- */
  .tasto { position:absolute; inset:0; width:44px; height:44px; border-radius:50%; cursor:grab; color:#fff; font-size:18px; padding:0;
           border:1px solid #0a1a33; touch-action:none; user-select:none;
           background: radial-gradient(circle at 50% 120%, #7fd4ff 0%, #2a8fe0 28%, #0b4c9c 62%, #06234d 100%);
           box-shadow: 0 0 0 2px #1d2a3a, 0 0 0 3px #5f6b78, 0 5px 14px #000c, 0 0 14px #2a8fe066, inset 0 -5px 10px #5fd0ff88;
           text-shadow: 0 0 6px #bfe8ff, 0 1px 1px #003; transition: box-shadow .2s, filter .2s; opacity:.92; }
  .tasto::before { content:""; position:absolute; left:6px; right:6px; top:2px; height:46%; border-radius:50% 50% 45% 45%;
                   background: linear-gradient(#ffffffd0, #ffffff10); pointer-events:none; }
  .tasto:hover { filter: brightness(1.15); opacity:1; box-shadow: 0 0 0 2px #1d2a3a, 0 0 0 3px #8fa0b2, 0 5px 14px #000c, 0 0 24px #4fb6ffcc, inset 0 -5px 12px #7fe0ffaa; }
  .tasto.trascino { cursor:grabbing; filter: brightness(1.25); }

  /* ---- the glass window ---- */
  .pannello { display:none; position:fixed; width:min(460px, calc(100vw - 24px)); max-height:min(76vh, 720px); flex-direction:column; overflow:hidden;
              color:#e8f2ff; font-size:12.5px; border-radius:10px; border:1px solid #000;
              background: linear-gradient(180deg, #2b3440 0%, #12171e 34px, #0b0f15 35px, #05070a 100%);
              box-shadow: 0 0 0 1px #6b7b8c inset, 0 14px 44px #000e, 0 0 24px #1e6fc433; }
  .pannello.aperto { display:flex; }

  .titolo { position:relative; height:34px; display:flex; align-items:center; gap:8px; padding:0 12px; flex:none;
            background: linear-gradient(180deg, #5d6a78 0%, #36414d 48%, #1b2129 52%, #222a33 100%);
            border-bottom:1px solid #000; box-shadow: inset 0 1px 0 #ffffff55; }
  .titolo b { flex:1; font-weight:600; font-size:13px; letter-spacing:.2px; text-shadow: 0 1px 2px #000, 0 0 8px #7fc8ff66; }
  .titolo .logo { width:16px; height:16px; border-radius:50%; background: radial-gradient(circle at 40% 30%, #fff 0, #8fd8ff 20%, #1a7fd6 60%, #073b78 100%); box-shadow: 0 0 6px #5fc0ff; }
  .titolo .chiudi { width:30px; height:22px; flex:none; cursor:pointer; color:#fff; font-size:13px; line-height:1; padding:0; border-radius:4px;
                    border:1px solid #000; text-shadow:0 1px 1px #000;
                    background: linear-gradient(180deg, #6b7787 0%, #3c4652 49%, #20272f 50%, #2d3640 100%); box-shadow: inset 0 1px 0 #ffffff55; }
  .titolo .chiudi:hover { background: linear-gradient(180deg, #f08a7a 0%, #c8402c 49%, #8f1a08 50%, #b8321e 100%); box-shadow: inset 0 1px 0 #ffffff80, 0 0 8px #ff5a3a99; }
  .info { color:#9fb3c8; font-size:11px; }
  .titolo .info { color:#cfe6ff; text-shadow:0 1px 1px #000; }

  /* ---- the command bar (chrome reflection) ---- */
  .griglia { display:grid; grid-template-columns:repeat(4, 1fr); gap:6px; padding:10px 12px; position:relative; flex:none;
             background: linear-gradient(180deg, #1a2330 0%, #0c1119 50%, #070a0f 51%, #0d131b 100%);
             border-bottom:1px solid #2c3a4a; box-shadow: inset 0 1px 0 #ffffff14; }
  .griglia button, .azioni button {
             position:relative; overflow:hidden; cursor:pointer; color:#eaf4ff; font-size:12px; padding:7px 3px; border-radius:6px;
             border:1px solid #000; text-shadow: 0 1px 1px #000;
             background: linear-gradient(180deg, #4a5868 0%, #2a3440 49%, #121820 50%, #1d2631 100%);
             box-shadow: inset 0 1px 0 #ffffff40, inset 0 0 0 1px #ffffff12, 0 1px 2px #0008; }
  .griglia button.servizio { background: linear-gradient(180deg, #3a4452 0%, #222a34 49%, #0f141a 50%, #181f28 100%); color:#cfe0f2; }
  .griglia button:hover, .azioni button:hover {
             background: linear-gradient(180deg, #5aa9e6 0%, #2a74b8 49%, #0c3f78 50%, #1d5ea3 100%);
             box-shadow: inset 0 1px 0 #ffffff70, 0 0 10px #3fa2ff99, 0 1px 2px #0008; }
  .griglia button:active, .azioni button:active { background: linear-gradient(180deg, #0c3f78 0%, #1d5ea3 100%); box-shadow: inset 0 2px 4px #000a; }
  .griglia button:disabled, .azioni button:disabled { opacity:.45; cursor:wait; filter: grayscale(.4); }

  /* ---- the content (like WMP's "Library") ---- */
  /* Short window: the whole panel scrolls, so results and boxes at the bottom are never cut off. */
  .pannello { overflow-y:auto; }
  .corpo { padding:10px 12px; overflow:visible; flex:1 0 auto; min-height:90px; background: linear-gradient(180deg, #05070a, #0a0f16); }
  .corpo::-webkit-scrollbar { width:10px; }
  .corpo::-webkit-scrollbar-thumb { border-radius:5px; border:1px solid #000; background: linear-gradient(90deg, #4a5868, #2a3440 50%, #1a222c); }
  .scheda { border-radius:8px; padding:10px; margin-bottom:9px; border:1px solid #000;
            background: linear-gradient(180deg, #1c2633 0%, #111821 40%, #0b1017 100%);
            box-shadow: inset 0 1px 0 #ffffff1c, inset 0 0 0 1px #3a6ea522, 0 2px 6px #0009; }
  .scheda h4 { margin:0 0 4px; font-size:13px; font-weight:600; display:flex; gap:6px; align-items:center; flex-wrap:wrap; text-shadow:0 0 8px #5fb8ff55; }
  .etichetta { font-size:10px; padding:1px 7px; border-radius:9px; color:#fff; border:1px solid #000; text-shadow:0 1px 1px #000;
               background: linear-gradient(180deg, #8fd36b 0%, #3f9a22 50%, #2a7a12 51%, #3f9a22 100%); box-shadow: inset 0 1px 0 #ffffff80; }
  .etichetta.agg { background: linear-gradient(180deg, #7fc8ff 0%, #2a84d6 50%, #0d5aa8 51%, #2a84d6 100%); }
  .etichetta.tua { background: linear-gradient(180deg, #ffd98a 0%, #d99a1e 50%, #a86a00 51%, #d99a1e 100%); }
  .etichetta.grigia { background: linear-gradient(180deg, #8a96a3 0%, #556170 50%, #3a4552 51%, #556170 100%); }
  .motivo { color:#a9c3dc; margin:2px 0 7px; font-style:italic; }
  .prima { color:#c9b48a; font-size:11px; margin:6px 0 3px; }
  .vecchio { white-space:pre-wrap; font-size:11.5px; line-height:1.45; color:#d8c9a8; padding:6px 7px; border-radius:4px; max-height:140px; overflow:auto;
             background:#120e06; border:1px solid #000; box-shadow: inset 0 1px 3px #000, 0 0 0 1px #4a3a1b; }
  textarea, input[type=text], input[type=password] { width:100%; color:#e8f2ff; font-size:12px; padding:6px 7px; border-radius:4px; resize:vertical;
                               border:1px solid #000; background:#04060a; box-shadow: inset 0 1px 3px #000, 0 0 0 1px #2b3a4b; }
  textarea:focus, input:focus { outline:none; box-shadow: inset 0 1px 3px #000, 0 0 0 1px #3f9fff, 0 0 8px #3f9fff88; }
  textarea { min-height:90px; font-family: "Segoe UI", Tahoma, sans-serif; }
  .azioni { display:flex; gap:6px; margin-top:7px; flex-wrap:wrap; align-items:center; }
  .azioni button { padding:5px 12px; }
  .azioni .primo { background: linear-gradient(180deg, #6cc0ff 0%, #2a84d6 49%, #0b55a6 50%, #2378c8 100%); box-shadow: inset 0 1px 0 #ffffff90, 0 0 8px #3fa2ff66; }
  .errore { color:#ff9c8f; text-shadow:0 0 6px #ff4a3066; }
  .ok { color:#a6f08a; text-shadow:0 0 6px #5fd03a55; }
  .testo { white-space:pre-wrap; line-height:1.55; }
  .guida h5 { margin:10px 0 3px; font-size:12.5px; color:#9fd8ff; }
  .guida p, .guida li { margin:2px 0; line-height:1.5; color:#d6e6f5; }
  .guida ul { margin:2px 0; padding-left:18px; }
  .riga { display:flex; gap:8px; align-items:center; padding:6px 4px; border-bottom:1px solid #1c2633; cursor:pointer; }
  .riga:hover { background:#13202e; }
  .riga .quando { font-family: Consolas, monospace; color:#8fe3ff; font-size:11px; white-space:nowrap; }
  .riga .cosa { flex:1; color:#d6e6f5; }
  label.campo { display:block; color:#cfe0f2; font-size:11px; margin:8px 0 3px; }
  label.conferma { display:flex; gap:6px; align-items:center; color:#ffd98a; font-size:11px; margin-top:6px; cursor:pointer; }

  /* ---- the "Now Playing" display: light, model, speed ---- */
  .display { display:flex; flex-wrap:wrap; align-items:center; gap:4px 8px; margin:10px 12px 0; padding:5px 9px; border-radius:5px; min-height:24px; flex:none;
             font-family: Consolas, "Lucida Console", monospace; font-size:11px; color:#8fe3ff; text-shadow:0 0 6px #2fb6ff88;
             border:1px solid #000; background: linear-gradient(180deg, #02101c, #041a2c 60%, #02101c);
             box-shadow: inset 0 1px 4px #000, 0 0 0 1px #2b3a4b; }
  .display #modello { flex:1; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }
  .display #vel { color:#c8f4ff; white-space:nowrap; margin-left:auto; }
  .dove { margin:7px 12px 4px; padding:0 2px; font-family: Consolas, monospace; font-size:11px; line-height:1.5; color:#7fa6c4; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:none; }

  /* ---- phone: full-width panel, bigger buttons and text to touch ---- */
  @media (max-width: 600px) {
    .pannello { font-size:13.5px; border-radius:12px; }
    .titolo { height:44px; }
    .titolo b { font-size:15px; }
    .titolo .chiudi { width:40px; height:32px; font-size:16px; }
    .display { font-size:12px; padding:7px 10px; }
    .dove { font-size:12px; margin:8px 12px 6px; }
    .griglia { gap:8px; padding:10px; }
    .pannello { overflow-y:auto; -webkit-overflow-scrolling:touch; }   /* with the keyboard open the whole panel scrolls */
    .corpo { flex:none; overflow:visible; min-height:140px; }
    .griglia button { font-size:13px; padding:12px 1px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .display #modello { flex-basis:calc(100% - 20px); }
    .display #vel { flex-basis:100%; margin-left:18px; white-space:normal; }
    .azioni button { font-size:13.5px; padding:10px 14px; }
    textarea, input[type=text], input[type=password] { font-size:15px; padding:8px; }
    label.salva, label.conferma { font-size:13px; }
    .piede { padding:9px 12px; }
  }
  .led { width:10px; height:10px; border-radius:50%; flex:none; border:1px solid #000; background:#3a3a3a; }
  .led.verde { background: radial-gradient(circle at 35% 30%, #eaffd8, #5fe03a 45%, #1e7a0c); box-shadow:0 0 6px #5fe03a; }
  .led.giallo { background: radial-gradient(circle at 35% 30%, #fff6d0, #ffc22e 45%, #a86a00); box-shadow:0 0 6px #ffc22e; animation: pulsa 1s ease-in-out infinite; }
  .led.rosso { background: radial-gradient(circle at 35% 30%, #ffd8d0, #ff4a30 45%, #8a1400); box-shadow:0 0 6px #ff4a30; }
  @keyframes pulsa { 50% { opacity:.35; } }

  /* ---- the status bar at the bottom ---- */
  .piede { display:flex; align-items:center; gap:8px; padding:6px 12px; border-top:1px solid #000; flex:none;
           background: linear-gradient(180deg, #2b3440 0%, #171d25 50%, #0d1218 51%, #161c24 100%); box-shadow: inset 0 1px 0 #ffffff22; }
  label.salva { display:flex; gap:6px; align-items:center; color:#cfe0f2; font-size:11px; cursor:pointer; }
  label.salva input, label.conferma input { accent-color:#2a84d6; }
</style>
<div class="pannello">
  <div class="titolo"><span class="logo"></span><b>${t('title')}</b><span class="info" id="stato"></span><button class="chiudi" id="chiudi" title="${t('close')}">✕</button></div>
  <div class="display"><span class="led" id="led"></span><span id="modello">${t('checking')}</span><canvas id="viz" width="96" height="14" hidden></canvas><span id="vel"></span></div>
  <div class="dove" id="dove"></div>
  <div class="griglia">
    <button data-l="traduci" title="${t('t.traduci')}">${t('b.traduci')}</button>
    <button data-l="rifinisci" title="${t('t.rifinisci')}">${t('b.rifinisci')}</button>
    <button data-l="annulla" title="${t('t.annulla')}">${t('b.annulla')}</button>
    <button data-l="leggi" title="${t('t.leggi')}">${t('b.leggi')}</button>
    <button data-l="lore" title="${t('t.lore')}">${t('b.lore')}</button>
    <button data-l="stato" title="${t('t.stato')}">${t('b.stato')}</button>
    <button data-l="riassunto" title="${t('t.riassunto')}">${t('b.riassunto')}</button>
    <button data-l="idee" title="${t('t.idee')}">${t('b.idee')}</button>
    <button data-l="backup" class="servizio" title="${t('t.backup')}">${t('b.backup')}</button>
    <button data-l="versioni" class="servizio" title="${t('t.versioni')}">${t('b.versioni')}</button>
    <button data-l="guida" class="servizio" title="${t('t.guida')}">${t('b.guida')}</button>
    <button data-l="impostazioni" class="servizio" title="${t('t.impostazioni')}">${t('b.impostazioni')}</button>
  </div>
  <div class="corpo" id="corpo"></div>
  <div class="piede"><label class="salva"><input type="checkbox" id="salva"> ${t('autosave')}</label></div>
</div>
<button class="tasto" title="${t('orb')}">✦</button>`;

    const $ = (s) => ombra.querySelector(s);
    const pannello = $('.pannello');
    const corpo = $('#corpo');
    const sfera = $('.tasto');
    const salvaDaSolo = $('#salva');
    salvaDaSolo.checked = GM_getValue('salvaDaSolo', false);
    salvaDaSolo.onchange = () => GM_setValue('salvaDaSolo', salvaDaSolo.checked);

    const el = (tag, attr = {}, ...figli) => { const e = document.createElement(tag); Object.assign(e, attr); e.append(...figli.filter((f) => f !== null && f !== undefined)); return e; };
    // Which 'service' view is open (guide, settings): pressing the same button again closes it.
    let vista = null;
    const mostra = (...nodi) => { vista = null; corpo.replaceChildren(...nodi.filter(Boolean)); };
    const chiudiVista = () => el('div', { className: 'azioni' }, el('button', { textContent: '✕ ' + t('close'), onclick: () => mostraBenvenuto() }));
    const avviso = (testo, cls = 'info') => mostra(el('div', { className: cls, textContent: testo }));

    // ---- position of the orb (draggable, remembered) and of the panel next to it

    const LATO = 44, MARGINE = 8;
    function limita(x, y) {
        return [Math.min(Math.max(MARGINE, x), innerWidth - LATO - MARGINE), Math.min(Math.max(MARGINE, y), innerHeight - LATO - MARGINE)];
    }
    function mettiSfera(x, y) {
        [x, y] = limita(x, y);
        ospite.style.left = x + 'px';
        ospite.style.top = y + 'px';
        if (pannello.classList.contains('aperto')) mettiPannello();
    }
    function mettiPannello() {
        const r = ospite.getBoundingClientRect();
        // Phone: the full screen width, minus a small border.
        const stretto = innerWidth < 600;
        pannello.style.width = stretto ? (innerWidth - 12) + 'px' : '';
        // Above or below the orb, on the side with more room; the panel gets shorter if needed, so it never covers it.
        const sotto = innerHeight - r.bottom - 10 - MARGINE, sopra = r.top - 10 - MARGINE;
        const giu = sotto >= sopra;
        pannello.style.maxHeight = Math.max(260, Math.min(720, giu ? sotto : sopra)) + 'px';
        const w = pannello.offsetWidth || 460, h = pannello.offsetHeight || 500;
        const sx = r.left + LATO / 2 > innerWidth / 2 ? r.right - w : r.left;             // opens towards the centre of the screen
        pannello.style.left = (stretto ? 6 : Math.min(Math.max(MARGINE, sx), innerWidth - w - MARGINE)) + 'px';
        pannello.style.top = Math.max(MARGINE, giu ? r.bottom + 10 : r.top - 10 - h) + 'px';
    }
    const pos = GM_getValue('posizione', null);   // in fractions of the screen: survives resizes
    mettiSfera(pos ? pos.fx * innerWidth : innerWidth - LATO - 24, pos ? pos.fy * innerHeight : innerHeight - LATO - 110);
    addEventListener('resize', () => { const p = GM_getValue('posizione', null); if (p) mettiSfera(p.fx * innerWidth, p.fy * innerHeight); else mettiSfera(innerWidth - LATO - 24, innerHeight - LATO - 110); });

    let trascina = null;
    sfera.addEventListener('pointerdown', (e) => {
        trascina = { x: e.clientX, y: e.clientY, ox: ospite.offsetLeft, oy: ospite.offsetTop, mosso: false };
        sfera.setPointerCapture(e.pointerId);
    });
    sfera.addEventListener('pointermove', (e) => {
        if (!trascina) return;
        const dx = e.clientX - trascina.x, dy = e.clientY - trascina.y;
        if (!trascina.mosso && Math.hypot(dx, dy) < 6) return;
        trascina.mosso = true;
        sfera.classList.add('trascino');
        mettiSfera(trascina.ox + dx, trascina.oy + dy);
    });
    sfera.addEventListener('pointerup', () => {
        if (!trascina) return;
        sfera.classList.remove('trascino');
        if (trascina.mosso) {
            GM_setValue('posizione', { fx: ospite.offsetLeft / innerWidth, fy: ospite.offsetTop / innerHeight });
        } else {
            apriChiudi();
        }
        trascina = null;
    });
    // On phones the system sometimes "steals" the touch (scroll, gestures): never stay stuck mid-drag.
    sfera.addEventListener('pointercancel', () => { trascina = null; sfera.classList.remove('trascino'); });

    function apriChiudi(forza) {
        const aprire = forza === undefined ? !pannello.classList.contains('aperto') : forza;
        pannello.classList.toggle('aperto', aprire);
        GM_setValue('aperto', aprire);
        if (aprire) {
            mettiPannello();
            aggiornaBarra();
            aggiornaDati();
            if (!corpo.childNodes.length) mostraBenvenuto();
        }
    }
    $('#chiudi').onclick = () => apriChiudi(false);

    function aggiornaStato() {
        $('#stato').textContent = t('status', dati.messaggi.length, dati.lorebook.length);
        $('#dove').textContent = `👤 ${dati.account} · 💬 ${dati.carta} #${dati.chatId}`;
        $('#dove').title = t('where.title');
    }
    aggiornaStato();

    function mostraBenvenuto() {
        mostra(el('div', { className: 'info', textContent: t('welcome') }));
    }

    let precedente = null;
    let occupato = false;
    const bottoni = () => ombra.querySelectorAll('.griglia button');

    // ---- the buttons

    async function esegui(nome) {
        if (nome === 'annulla') {
            if (precedente === null) return avviso(t('nothing.undo'));
            imposta(casella(), precedente); precedente = null; return avviso(t('undone'), 'ok');
        }
        if ((nome === 'guida' || nome === 'impostazioni') && vista === nome) return mostraBenvenuto();
        if (nome === 'guida') { mostraGuida(); vista = 'guida'; return; }
        if (nome === 'impostazioni') { mostraImpostazioni(); vista = 'impostazioni'; return; }
        if (occupato) return;
        occupato = true;
        bottoni().forEach((b) => { b.disabled = true; });
        const conModello = !['backup', 'versioni'].includes(nome);
        if (conModello) { $('#led').className = 'led giallo'; $('#vel').textContent = t('working'); chicche.lavoro(true); }
        avviso(t('rereading'));
        await aggiornaDati();
        if (conModello) avviso(t('job.running'));
        try {
            if (nome === 'traduci' || nome === 'rifinisci') {
                const box = casella();
                if (!box || !box.value.trim()) throw new Error(t('box.empty'));
                mostraEsito(nome, await lavoro(nome, { testo: box.value }));
            } else if (nome === 'leggi') {
                const ultimo = [...dati.messaggi].reverse().find((m) => m.ruolo !== 'user');
                if (!ultimo) throw new Error(t('no.reply'));
                mostraEsito(nome, await lavoro('leggi', { testo: ultimo.testo }));
            } else if (nome === 'stato') {
                const vecchia = dati.lorebook.find((v) => stesso(v.nome, 'Current State'));
                mostraEsito(nome, await lavoro('stato', { stato_precedente: vecchia ? vecchia.contenuto : GM_getValue(CHIAVE('stato'), '') }));
            } else if (nome === 'riassunto') {
                mostraEsito(nome, await lavoro('riassunto', { riassunto_precedente: GM_getValue(CHIAVE('riassunto'), '') || dati.riassunto }));
            } else if (nome === 'lore' || nome === 'idee') {
                mostraEsito(nome, await lavoro(nome));
            } else if (nome === 'backup') {
                if (!dati.lorebook.length) throw new Error(t('lore.empty'));
                const r = await backup(t('manual.backup'), false);
                avviso(r.uguale ? t('backup.same', dati.lorebook.length) : t('backup.done', dati.lorebook.length), 'ok');
            } else if (nome === 'versioni') {
                await mostraVersioni();
            }
        } catch (e) {
            avviso(e.message, 'errore');
        } finally {
            occupato = false;
            bottoni().forEach((b) => { b.disabled = false; });
            if (conModello) { chicche.lavoro(false); aggiornaBarra(); }
        }
    }

    // ---- shows a job's result (also one picked up after a page reload)

    function mostraEsito(nome, r, ripreso = false) {
        const ris = r.risultato || {};
        if (nome === 'traduci' || nome === 'rifinisci') {
            const box = casella();
            if (!ripreso && box) {
                precedente = box.value;
                imposta(box, ris.testo);
                box.focus();
                return avviso(t('done.box', velocita(r.misure) || r.secondi + 's'), 'ok');
            }
            return mostra(el('div', { className: 'testo', textContent: ris.testo }),
                el('div', { className: 'azioni' }, el('button', { className: 'primo', textContent: t('in.box'), onclick: () => { const b = casella(); precedente = b.value; imposta(b, ris.testo); } })));
        }
        if (nome === 'leggi') return mostra(el('div', { className: 'testo', textContent: ris.testo }));
        if (nome === 'lore') {
            const voci = ris.voci || [];
            const scartate = ris.scartate || [];
            const nota = scartate.length ? el('div', { className: 'info', textContent: t('lore.dropped', scartate.length, scartate.join('; ')) }) : null;
            if (!voci.length) return mostra(el('div', { className: 'ok', textContent: t('lore.nothing', r.secondi) }), nota);
            return mostra(...voci.map((v) => schedaVoce(v)), nota);
        }
        if (nome === 'stato') {
            GM_setValue(CHIAVE('stato'), ris.testo);
            const vecchia = dati.lorebook.find((v) => stesso(v.nome, 'Current State'));
            const kw = [dati.personaggio, dati.utente].map((s) => s.toLowerCase()).filter((s) => s && s !== 'user');
            return mostra(schedaVoce({ azione: vecchia ? 'aggiorna' : 'nuova', nome: 'Current State', keywords: vecchia ? vecchia.keywords : kw, contenuto: ris.testo, motivo: t('state.reason') }));
        }
        if (nome === 'riassunto') {
            GM_setValue(CHIAVE('riassunto'), ris.testo);
            return mostraRiassunto(ris.testo);
        }
        if (nome === 'idee') {
            return mostra(...(ris.idee || []).map((i) => {
                const esito = el('span', { className: 'info' });
                const nelBox = el('button', { textContent: t('idea.box') });
                nelBox.onclick = async () => {
                    // The idea is in your language and in third person: turn it into your next message, ready to send.
                    nelBox.disabled = true; esito.className = 'info'; esito.textContent = t('idea.writing');
                    try {
                        const m = await lavoro('idea_box', { testo: `${i.titolo}: ${i.testo}` });
                        const b = casella(); precedente = b.value; imposta(b, m.risultato.testo); b.focus();
                        esito.className = 'ok'; esito.textContent = t('idea.inbox');
                    } catch (e) { esito.className = 'errore'; esito.textContent = e.message; }
                    nelBox.disabled = false;
                };
                return el('div', { className: 'scheda' },
                    el('h4', { textContent: i.titolo }), el('div', { className: 'testo', textContent: i.testo }),
                    el('div', { className: 'azioni' }, nelBox, el('button', { textContent: t('copy'), onclick: () => GM_setClipboard(i.testo) }), esito));
            }));
        }
        return avviso(t('done'), 'ok');
    }

    // ---- 📝 Summary with the "permanent facts": the paragraph written by you that the automatic summary cannot spoil

    function mostraRiassunto(testo) {
        const fissi = el('textarea', { value: GM_getValue(CHIAVE('fissi'), ''),
            placeholder: t('facts.ph') });
        fissi.style.minHeight = '110px';
        fissi.oninput = () => GM_setValue(CHIAVE('fissi'), fissi.value);
        const area = el('textarea', { value: testo });
        area.style.minHeight = '200px';
        const insieme = () => (fissi.value.trim() ? `Permanent facts:\n${fissi.value.trim()}\n\nStory so far:\n${area.value.trim()}` : area.value.trim());
        mostra(
            el('div', { className: 'info', textContent: t('sum.help') }),
            el('label', { className: 'campo', textContent: t('facts.label') }), fissi,
            el('label', { className: 'campo', textContent: t('sum.label') }), area,
            el('div', { className: 'azioni' },
                el('button', { className: 'primo', textContent: t('sum.copy'), onclick: () => { GM_setValue(CHIAVE('riassunto'), area.value); GM_setClipboard(insieme()); avviso(t('sum.copied'), 'ok'); } }),
                el('button', { textContent: t('sum.save'), onclick: () => { GM_setValue(CHIAVE('riassunto'), area.value); avviso(t('sum.saved'), 'ok'); } })));
    }

    // ---- job picked up again: if the page was reloaded while the server worked, the result is not lost

    async function riprendi() {
        const p = GM_getValue(CHIAVE('incorso'), null);
        if (!p || !p.id || Date.now() - (p.quando || 0) > 1800000 || occupato) return;
        occupato = true;
        bottoni().forEach((b) => { b.disabled = true; });
        apriChiudi(true);
        $('#led').className = 'led giallo'; $('#vel').textContent = t('working'); chicche.lavoro(true);
        avviso(t('resume', p.nome));
        try { mostraEsito(p.nome, await attendiEsito(p.id), true); } catch (e) { avviso(t('resume.fail', p.nome, e.message), 'errore'); }
        chicche.lavoro(false);
        GM_setValue(CHIAVE('incorso'), null);
        occupato = false;
        bottoni().forEach((b) => { b.disabled = false; });
        aggiornaBarra();
    }

    // ---- an entry proposal (Lore, State, Restore)

    function schedaVoce(v, opzioni = {}) {
        const vecchia = dati.lorebook.find((x) => stesso(x.nome, v.nome));
        const aggiorna = !!vecchia;
        // Entries the helper did not create were written by you: replacing them needs your confirmation.
        const tua = aggiorna && !dati.create.some((n) => stesso(n, vecchia.nome));
        const nome = el('input', { type: 'text', value: v.nome || '' });
        const kw = el('input', { type: 'text', value: (v.keywords || []).join(', ') });
        const testo = el('textarea', { value: v.contenuto || '' });
        const esito = el('span', { className: 'info' });
        const conferma = tua ? el('input', { type: 'checkbox' }) : null;
        const intestazione = el('h4', {},
            el('span', { className: 'etichetta' + (aggiorna ? ' agg' : ''), textContent: opzioni.ripristino ? t('tag.restore') : (aggiorna ? t('tag.update') : t('tag.new')) }),
            tua ? el('span', { className: 'etichetta tua', textContent: t('tag.yours'), title: t('tag.yours.t') }) : null,
            el('span', { textContent: v.nome }));
        const scheda = el('div', { className: 'scheda' }, intestazione, el('div', { className: 'motivo', textContent: v.motivo || '' }));
        if (aggiorna) {
            scheda.append(el('div', { className: 'prima', textContent: t('now.in') }),
                el('div', { className: 'vecchio', textContent: vecchia.contenuto }),
                el('div', { className: 'prima', textContent: t('will.be') }));
        }
        scheda.append(nome, el('div', { style: 'height:4px' }), kw, el('div', { style: 'height:4px' }), testo);
        const vai = el('button', { className: 'primo', textContent: opzioni.ripristino ? t('btn.restore') : (aggiorna ? t('btn.update') : t('btn.insert')) });
        if (tua) {
            vai.disabled = true;
            conferma.onchange = () => { vai.disabled = !conferma.checked; };
            scheda.append(el('label', { className: 'conferma' }, conferma, t('confirm.read')));
        }
        vai.onclick = async () => {
            vai.disabled = true; esito.className = 'info'; esito.textContent = t('filling');
            try {
                const voce = { nome: nome.value.trim(), keywords: kw.value.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean), contenuto: testo.value.trim() };
                if (!voce.contenuto || !voce.keywords.length) throw new Error(t('need.kw'));
                esito.textContent = await inserisciVoce(voce, salvaDaSolo.checked, opzioni.ripristino ? t('before.restore', voce.nome) : undefined);
                esito.className = 'ok';
                aggiornaStato();
            } catch (e) { esito.textContent = e.message; esito.className = 'errore'; vai.disabled = false; }
        };
        scheda.append(el('div', { className: 'azioni' }, vai,
            el('button', { textContent: t('copy'), onclick: () => GM_setClipboard(testo.value) }),
            el('button', { textContent: t('discard'), onclick: () => scheda.remove() }), esito));
        return scheda;
    }

    // ---- 🕘 Versions: list of copies, compare with now, restore

    async function mostraVersioni() {
        const r = await chiamaServer('/lorebook/versioni', {});
        dati.create = r.create || [];
        if (!r.versioni.length) return avviso(t('no.versions'));
        mostra(el('div', { className: 'info', textContent: t('versions.list', r.versioni.length) }),
            ...r.versioni.map((v) => el('div', { className: 'riga', onclick: () => apriVersione(v) },
                el('span', { className: 'quando', textContent: v.quando.replace('T', ' ') }),
                el('span', { className: 'cosa', textContent: v.motivo }),
                el('span', { className: 'info', textContent: t('entries', v.n) }))));
    }

    async function apriVersione(v) {
        avviso(t('opening'));
        try {
            await aggiornaDati();
            const copia = await chiamaServer('/lorebook/versione', { file: v.file });
            const confronto = copia.voci.map((voce) => {
                const ora = dati.lorebook.find((x) => stesso(x.nome, voce.nome));
                const uguale = ora && ora.contenuto === voce.contenuto && ora.keywords.join(',') === voce.keywords.join(',');
                return { voce, ora, uguale };
            });
            const diverse = confronto.filter((c) => !c.uguale);
            const nuoveDopo = dati.lorebook.filter((x) => !copia.voci.some((y) => stesso(x.nome, y.nome)));
            const torna = el('button', { textContent: t('all.copies'), onclick: () => esegui('versioni') });
            const testa = el('div', {},
                el('div', { className: 'azioni' }, torna),
                el('div', { className: 'info', textContent: t('copy.of', copia.quando.replace('T', ' '), copia.motivo, copia.voci.length) +
                    (diverse.length ? t('n.diff', diverse.length) : t('same.now')) +
                    (nuoveDopo.length ? t('added.after', nuoveDopo.map((x) => x.nome).join(', ')) : '') }));
            mostra(testa, ...diverse.map((c) => {
                const s = schedaVoce({ ...c.voce, motivo: c.ora ? t('was.so') : t('was.gone') }, { ripristino: true });
                return s;
            }), ...confronto.filter((c) => c.uguale).map((c) => el('div', { className: 'riga' },
                el('span', { className: 'etichetta grigia', textContent: t('same') }), el('span', { className: 'cosa', textContent: c.voce.nome }))));
        } catch (e) { avviso(e.message, 'errore'); }
    }

    // ---- ❔ Guide and ⚙ Settings

    function mostraGuida() {
        const h = (k) => el('h5', { textContent: t(k) });
        const p = (k) => el('p', { textContent: t(k) });
        const ul = (...r) => el('ul', {}, ...r.map((k) => el('li', { textContent: t(k) })));
        mostra(el('div', { className: 'guida' },
            h('g.how'), ul('g.how1', 'g.how2', 'g.how3'),
            h('g.write'), ul('g.write1', 'g.write2', 'g.write3'),
            h('g.lore'), ul('g.lore1', 'g.lore2', 'g.lore3', 'g.lore4', 'g.lore5'),
            h('g.mem'), ul('g.mem1', 'g.mem2', 'g.mem3', 'g.mem4'),
            h('g.trouble'), ul('g.trouble1', 'g.trouble2', 'g.trouble3'),
            p('g.rule')), chiudiVista());
    }

    function mostraImpostazioni() {
        const ind = el('input', { type: 'text', value: indirizzi().join(', ') });
        const chiave = el('input', { type: 'password', value: chiaveServer(), placeholder: t('key.ph') });
        const lingua = el('select', {},
            ...[['auto', 'Auto (browser)'], ['en', 'English'], ['it', 'Italiano']].map(([v, n]) => el('option', { value: v, textContent: n })));
        lingua.value = GM_getValue('ui_lang', 'auto');
        const mia = el('input', { type: 'text', value: GM_getValue('my_lang', ''), placeholder: miaLingua() });
        const sorprese = el('input', { type: 'checkbox', checked: chicche.attive() });
        const esito = el('span', { className: 'info' });
        const versione = el('div', { className: 'info versione', textContent: `Aiutante CT ${GM_info.script.version} · MIT` });
        versione.title = t('egg.ver');   // a hidden tooltip for the curious
        mostra(el('div', {},
            el('label', { className: 'campo', textContent: t('lbl.ui') }), lingua,
            el('label', { className: 'campo', textContent: t('lbl.mylang') }), mia,
            el('label', { className: 'conferma' }, sorprese, t('lbl.fun')),
            el('label', { className: 'campo', textContent: t('lbl.server') }), ind,
            el('label', { className: 'campo', textContent: t('lbl.key') }), chiave,
            el('div', { className: 'azioni' },
                el('button', { className: 'primo', textContent: t('save.test'), onclick: async () => {
                    const cambiata = lingua.value !== GM_getValue('ui_lang', 'auto');
                    GM_setValue('ui_lang', lingua.value);
                    GM_setValue('my_lang', mia.value.trim());
                    GM_setValue('chicche', sorprese.checked);
                    GM_setValue('server', ind.value.trim() || SERVER_PREDEFINITO);
                    GM_setValue('chiave', chiave.value.trim());
                    attivo = null;
                    const s = await salute();
                    esito.textContent = (s ? t('conn.ok', server()) : motivoErrore === 'chiave' ? t('conn.key') : t('conn.net'))
                        + (cambiata ? ' ⟳ F5' : '');
                    esito.className = s ? 'ok' : 'errore';
                    aggiornaBarra();
                } }),
                el('button', { textContent: t('default.addr'), onclick: () => { ind.value = SERVER_PREDEFINITO; } }),
                el('button', { textContent: t('orb.reset'), onclick: () => { GM_setValue('posizione', null); mettiSfera(innerWidth - LATO - 24, innerHeight - LATO - 110); } }),
                esito), versione, chiudiVista()));
    }

    // ------------------------------------------------------------ display: server status and speed
    // Asks only the helper's own server, never the site; and only while the panel is open.

    // Why the last attempt failed, to say it clearly in ⚙: 'chiave' (the PC answers but refuses) or 'rete'.
    let motivoErrore = '';
    function saluteDi(base) {
        return new Promise((ok) => GM_xmlhttpRequest({
            method: 'GET', url: `${base}/salute`, timeout: 4000, headers: { 'X-Chiave': chiaveServer() },
            onload: (r) => {
                if (r.status === 401) { motivoErrore = 'chiave'; return ok(null); }
                try { const j = JSON.parse(r.responseText); ok(j.stato ? j : null); } catch (e) { motivoErrore = 'rete'; ok(null); }
            },
            onerror: () => { motivoErrore = motivoErrore || 'rete'; ok(null); }, ontimeout: () => { motivoErrore = motivoErrore || 'rete'; ok(null); },
        }));
    }

    /** Tries the address in use; if it does not answer, the others in order. Remembers the one that works. */
    async function salute() {
        const ordine = [...new Set([attivo, ...indirizzi()].filter(Boolean))];
        motivoErrore = '';
        for (const base of ordine) {
            const s = await saluteDi(base);
            if (s) { attivo = base; return s; }
        }
        attivo = null;
        return null;
    }

    function velocita(m) {
        if (!m) return '';
        const p = [];
        if (m.lettura_ts && m.lettura_ts < 100 && (m.token_letti || 0) > 300) p.push(t('slow'));
        if (m.scrittura_ts) p.push(`✍ ${m.scrittura_ts} tok/s`);
        if (m.lettura_ts) p.push(`👁 ${m.lettura_ts} tok/s`);
        else if (m.cache) p.push('👁 cache');
        if (m.token_scritti) p.push(`${m.token_scritti} tok`);
        if (m.secondi) p.push(`${m.secondi}s`);
        return p.join(' · ');
    }

    async function aggiornaBarra() {
        const s = await salute();
        if (occupato) return;
        const led = $('#led'), modello = $('#modello');
        if (!s) {
            led.className = 'led rosso'; modello.textContent = motivoErrore === 'chiave' ? t('lamp.key') : (/127\.0\.0\.1|localhost/.test(server()) ? t('lamp.off') : t('lamp.far')); modello.title = server(); return;
        }
        const accesi = Object.entries(s.motori || {}).filter(([, v]) => v);
        if (!accesi.length) {
            led.className = 'led rosso'; modello.textContent = t('lamp.nomodel'); modello.title = ''; return;
        }
        led.className = 'led verde';
        modello.textContent = accesi[0][1];
        modello.title = accesi.map(([n, v]) => `${n}: ${v}`).join('\n') + `\nserver: ${server()}`;
        if (s.ultimo && s.ultimo.lavoro) {
            $('#vel').textContent = velocita(s.ultimo);
            $('#vel').title = t('last.job', s.ultimo.lavoro, s.ultimo.motore) + (s.ultimo.token_letti ? t('tok.read', s.ultimo.token_letti) : '')
                + (velocita(s.ultimo).includes('⚠') ? t('slow.t') : '');
        } else {
            $('#vel').textContent = '';
        }
    }

    // ------------------------------------------------------------ little surprises (WMP 11 / Vista style)
    // All inside the panel's own shadow DOM: nothing on the site is touched. Off with ⚙ → "Visualizations and
    // little surprises"; animations also stay still when the system asks for reduced motion.

    const chicche = (() => {
        const attive = () => GM_getValue('chicche', true);
        const calma = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
        const stile = document.createElement('style');
        stile.textContent = `
  select { width:100%; color:#e8f2ff; font-size:12px; padding:5px 6px; border-radius:4px; border:1px solid #000; background:#04060a; box-shadow: inset 0 1px 3px #000, 0 0 0 1px #2b3a4b; }
  .versione { margin-top:10px; text-align:right; font-family: Consolas, monospace; cursor:help; }
  #viz { flex:none; width:96px; height:14px; margin-left:auto; }
  .tasto.gira { animation: gira .9s cubic-bezier(.3,1.4,.5,1); }
  .tasto.ding { animation: ding .7s ease-out; }
  @keyframes gira { to { transform: rotate(360deg) scale(1.08); } }
  @keyframes ding { 0% { box-shadow: 0 0 0 0 #7fd4ffcc, 0 5px 14px #000c; } 100% { box-shadow: 0 0 0 18px #7fd4ff00, 0 5px 14px #000c; } }
  .pannello.aero .titolo, .pannello.aero .griglia { background-size: 300% 100%; animation: aurora 6s linear infinite;
      background-image: linear-gradient(100deg, #10324f, #1f6aa8 20%, #5fc8c0 35%, #27407a 50%, #7a3fa8 65%, #1f6aa8 80%, #10324f); }
  .pannello.aero { box-shadow: 0 0 0 1px #9fd8ff inset, 0 14px 44px #000e, 0 0 40px #5fc8ff88; }
  @keyframes aurora { to { background-position: 300% 0; } }
  .brindisi { position:fixed; z-index:5; box-sizing:border-box; padding:8px 10px; border-radius:6px; font-size:11.5px;
      color:#eaf6ff; border:1px solid #000; background: linear-gradient(180deg, #2a5f93ee, #0c2c52ee); box-shadow: inset 0 1px 0 #ffffff60, 0 4px 14px #000a;
      opacity:0; transform: translateY(6px); transition: opacity .25s, transform .25s; pointer-events:none; }
  .brindisi.su { opacity:1; transform:none; }
  .titolo .logo { cursor:pointer; }`;
        ombra.appendChild(stile);

        // A toast inside the panel, Vista-balloon style.
        let timerBrindisi = null;
        function brindisi(testo, ms = 4200) {
            let b = ombra.querySelector('.brindisi');
            if (!b) { b = el('div', { className: 'brindisi' }); ombra.appendChild(b); }
            const r = pannello.getBoundingClientRect();   // over the bottom of the panel, wherever it is scrolled
            Object.assign(b.style, { left: r.left + 12 + 'px', width: r.width - 24 + 'px', top: Math.max(8, r.bottom - 92) + 'px' });
            b.textContent = testo;
            requestAnimationFrame(() => b.classList.add('su'));
            clearTimeout(timerBrindisi);
            timerBrindisi = setTimeout(() => b.classList.remove('su'), ms);
        }

        // ---- "Bars" visualization in the display while a job runs (like WMP's Now Playing)
        const tela = $('#viz');
        const g = tela.getContext('2d');
        let anima = 0, alti = new Array(16).fill(0);
        function disegna() {
            const w = tela.width, h = tela.height, n = alti.length, bw = w / n;
            g.clearRect(0, 0, w, h);
            const grad = g.createLinearGradient(0, h, 0, 0);
            grad.addColorStop(0, '#1a7fd6'); grad.addColorStop(0.6, '#5fd0ff'); grad.addColorStop(1, '#eaffff');
            g.fillStyle = grad;
            const tempo = performance.now() / 1000;
            for (let i = 0; i < n; i++) {
                const obiettivo = (0.35 + 0.65 * Math.abs(Math.sin(tempo * (1.3 + i * 0.37) + i))) * (0.6 + Math.random() * 0.4);
                alti[i] += (obiettivo - alti[i]) * 0.25;
                const bh = Math.max(1, alti[i] * h);
                g.fillRect(i * bw + 1, h - bh, bw - 2, bh);
            }
            anima = requestAnimationFrame(disegna);
        }
        function lavoro(si) {
            cancelAnimationFrame(anima);
            const mostrare = si && attive() && !calma();
            tela.hidden = !mostrare;
            $('#vel').hidden = mostrare;
            if (mostrare) disegna();
            else if (!si && attive() && !calma()) { sfera.classList.remove('ding'); void sfera.offsetWidth; sfera.classList.add('ding'); }
        }

        // ---- Konami code: ↑ ↑ ↓ ↓ ← → ← → B A  -> Aero aurora for a while (only watched, never blocked)
        const KONAMI = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];
        let passo = 0;
        document.addEventListener('keydown', (e) => {
            if (!attive() || !pannello.classList.contains('aperto')) return;
            const k = (e.key || '').toLowerCase();
            passo = k === KONAMI[passo] ? passo + 1 : (k === KONAMI[0] ? 1 : 0);
            if (passo === KONAMI.length) {
                passo = 0;
                pannello.classList.add('aero');
                brindisi(t('egg.konami'), 6000);
                setTimeout(() => pannello.classList.remove('aero'), calma() ? 3000 : 15000);
            }
        });

        // ---- the orb: three quick clicks make it spin like a WMP 11 Play button showing off
        let clic = [];
        sfera.addEventListener('click', () => {
            if (!attive() || calma()) return;
            const ora = Date.now();
            clic = clic.filter((x) => ora - x < 700).concat(ora);
            if (clic.length >= 3) { clic = []; sfera.classList.remove('gira'); void sfera.offsetWidth; sfera.classList.add('gira'); }
        });

        // ---- the title logo: five clicks "burn the lorebook to CD"
        let colpi = 0, timerColpi = null;
        $('.titolo .logo').addEventListener('click', () => {
            if (!attive()) return;
            clearTimeout(timerColpi);
            timerColpi = setTimeout(() => { colpi = 0; }, 1500);
            if (++colpi < 5) return;
            colpi = 0;
            let pct = 0;
            const giro = setInterval(() => {
                pct = Math.min(100, pct + 7 + Math.floor(Math.random() * 13));
                brindisi(t('egg.cd', pct), 2000);
                if (pct >= 100) { clearInterval(giro); setTimeout(() => brindisi(t('egg.cd.end'), 3500), 600); }
            }, 280);
        });

        // ---- hidden tooltips: the logo plays the current card; on 30 January Vista has a birthday
        const logo = $('.titolo .logo');
        const oggi = new Date();
        logo.addEventListener('mouseenter', () => {
            logo.title = attive() ? (oggi.getMonth() === 0 && oggi.getDate() === 30 ? t('egg.bday') : t('egg.play', dati.carta || '…')) : '';
        });

        return { attive, lavoro, brindisi };
    })();

    setInterval(() => { if (pannello.classList.contains('aperto') && !document.hidden) aggiornaBarra(); }, 15000);
    bottoni().forEach((b) => { b.onclick = () => esegui(b.dataset.l); });
    document.addEventListener('keydown', (e) => {
        if (inChat() && e.ctrlKey && e.altKey && e.key.toLowerCase() === 't') { e.preventDefault(); esegui('traduci'); }
    }, true);

    // The site changes page without reloading (Library -> chat): the script runs on the whole site and shows the orb
    // only inside a chat. It only looks at the address bar: no request to the site until you touch something.
    function inChat() { return /^\/chat\//.test(location.pathname); }
    let ultimaPagina = null;
    function controllaPagina() {
        if (location.pathname === ultimaPagina) return;
        ultimaPagina = location.pathname;
        const primaVolta = !controllaPagina.vista;
        controllaPagina.vista = true;
        const si = inChat();
        ospite.style.display = si ? '' : 'none';
        if (!si) { pannello.classList.remove('aperto'); return; }
        // A different chat from the one the tab opened with: the data in the page belong to the first page,
        // so they are not valid. They are read again at the next touch (orb or button).
        if (!primaVolta) Object.assign(dati, { chatId: 0, carta: t('wait.chat'), messaggi: [], lorebook: [] });
        mostraBenvenuto();
        aggiornaStato();
        if (pannello.classList.contains('aperto')) { aggiornaBarra(); aggiornaDati(); }
    }
    controllaPagina();
    setInterval(controllaPagina, 1000);
    if (inChat() && GM_getValue('aperto', false)) apriChiudi(true);
    if (inChat()) riprendi();
})();
