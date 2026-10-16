// Tiny stand-in for the userscript manager on the DEMO page only (Tampermonkey/Violentmonkey provide these for real).
// Values live in this page's localStorage; requests go through fetch to the local helper server in --demo mode.
(function () {
    const P = 'aiutante-demo:';
    const q = new URLSearchParams(location.search);
    if (q.has('lang')) localStorage.setItem(P + 'ui_lang', JSON.stringify(q.get('lang')));
    if (q.has('open')) localStorage.setItem(P + 'aperto', 'true');
    if (localStorage.getItem(P + 'server') === null) localStorage.setItem(P + 'server', JSON.stringify('http://127.0.0.1:8533'));
    window.GM_info = { script: { version: '0.7.0' }, scriptHandler: 'demo-shim' };
    window.GM_getValue = (k, d) => { try { const v = localStorage.getItem(P + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } };
    window.GM_setValue = (k, v) => { try { localStorage.setItem(P + k, JSON.stringify(v)); } catch (e) { /* private mode */ } };
    window.GM_setClipboard = (t) => navigator.clipboard && navigator.clipboard.writeText(t).catch(() => {});
    window.GM_xmlhttpRequest = (o) => {
        const ctl = new AbortController();
        const timer = setTimeout(() => { ctl.abort(); o.ontimeout && o.ontimeout(); }, o.timeout || 60000);
        fetch(o.url, { method: o.method || 'GET', headers: o.headers, body: o.data, signal: ctl.signal })
            .then(async (r) => { clearTimeout(timer); o.onload && o.onload({ status: r.status, responseText: await r.text() }); })
            .catch(() => { clearTimeout(timer); if (!ctl.signal.aborted) o.onerror && o.onerror(); });
    };
    // ?run=lore (or another button) presses that panel button once the page is ready: used for the README screenshots.
    if (q.has('run')) addEventListener('load', () => setTimeout(() => {
        const host = [...document.body.children].find((e) => e.shadowRoot && e.shadowRoot.querySelector('.griglia'));
        const b = host && host.shadowRoot.querySelector(`[data-l="${q.get('run')}"]`);
        if (b) b.click();
    }, 1200));
})();
