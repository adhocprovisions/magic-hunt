/* Secret Missions — Thanksgiving Division */
(() => {
const G = window.GAME;
const BASE = 'https://ntfy.sh/' + G.topic;
const LS = k => 'tg26.' + k;
const $app = document.getElementById('app');
const $sync = document.getElementById('sync');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(LS(k))) ?? d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(LS(k), JSON.stringify(v)); } catch {} };
const agentNo = s => 'Agent № ' + String(s).padStart(2, '0');

/* ---------- crypto ---------- */
const b64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
async function unlock(pw, box) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(norm(pw)), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: b64(box.s), iterations: G.iter, hash: 'SHA-256' },
    base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
  try {
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(box.i) }, key, b64(box.c));
    return JSON.parse(new TextDecoder().decode(pt));
  } catch { return null; }
}

/* ---------- shared state (ntfy.sh topic, append-only; latest message wins) ---------- */
let cache = load('cache', {});        // ntfy id -> parsed msg  (kept locally so nothing is lost)
let state = { players: {}, reveal: false, marks: { m: {}, d: {} } };
function rebuild() {
  const s = { players: {}, reveal: false, revealTs: 0, marks: { m: {}, d: {}, ts: 0 } };
  for (const m of Object.values(cache)) {
    if (m.t === 'p') { const cur = s.players[m.slot]; if (!cur || m.ts > cur.ts) s.players[m.slot] = m; }
    if (m.t === 'reveal' && m.ts > s.revealTs) { s.reveal = !!m.on; s.revealTs = m.ts; }
    if (m.t === 'marks' && m.ts > s.marks.ts) s.marks = m;
  }
  state = s;
}
let pulling = null;
async function pull() {
  if (pulling) return pulling;
  pulling = (async () => {
    try {
      const r = await fetch(BASE + '/json?poll=1&since=all', { cache: 'no-store' });
      if (!r.ok) throw new Error(r.status);
      const txt = await r.text();
      for (const line of txt.split('\n')) {
        if (!line.trim()) continue;
        try { const e = JSON.parse(line); if (e.event === 'message') cache[e.id] = JSON.parse(e.message); } catch {}
      }
      save('cache', cache);
      online(true);
    } catch { online(false); }
    rebuild();
    pulling = null;
  })();
  return pulling;
}
async function push(obj) {
  obj.ts = Date.now();
  cache['local-' + obj.t + '-' + (obj.slot ?? '') ] = obj; rebuild(); save('cache', cache);
  try {
    const r = await fetch(BASE, { method: 'POST', body: JSON.stringify(obj) });
    if (!r.ok) throw new Error(r.status);
    online(true); return true;
  } catch { online(false); save('pending', obj.t === 'p' ? true : load('pending', false)); return false; }
}
let syncT;
function online(ok) {
  clearTimeout(syncT);
  $sync.textContent = ok ? 'Synced ✓' : 'Offline — will retry';
  $sync.classList.add('on');
  syncT = setTimeout(() => $sync.classList.remove('on'), ok ? 1500 : 6000);
}

/* ---------- player ---------- */
let me = load('me', null);   // {slot, mission, name, g:{slot:text}}
function myMsg() { return { t: 'p', slot: me.slot, name: me.name, g: me.g || {} }; }
async function resyncMine() {
  // if the server lost or never got my latest, send it again
  if (!me || !me.name) return;
  const srv = state.players[me.slot];
  const same = srv && srv.name === me.name && JSON.stringify(srv.g || {}) === JSON.stringify(me.g || {});
  if (!same || load('pending', false)) { save('pending', false); await push(myMsg()); }
}

function viewLogin(err = '') {
  document.body.classList.remove('wide');
  $app.innerHTML = `
    <span class="stamp">TOP SECRET</span>
    <h1>Your <em>mission</em>,<br>should you accept it.</h1>
    <p class="sub">Thanksgiving Division. Enter the password on your name tag.</p>
    <div class="card">
      <form id="f">
        <label for="pw">Password</label>
        <input id="pw" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="e.g. GRAVY 12">
        <button>Open my mission</button>
        <div class="err" id="err">${esc(err)}</div>
      </form>
    </div>
    <div class="foot"><span>Trust no one. Pass the gravy.</span><a href="#host">Host</a></div>`;
  const f = document.getElementById('f');
  f.onsubmit = async e => {
    e.preventDefault();
    const pw = document.getElementById('pw').value;
    if (!norm(pw)) return;
    const btn = f.querySelector('button'); btn.disabled = true; btn.textContent = 'Decrypting…';
    let found = null;
    for (const box of G.locks) { found = await unlock(pw, box); if (found) break; }
    if (!found) { btn.disabled = false; btn.textContent = 'Open my mission'; document.getElementById('err').textContent = "That's not a password. Check your name tag."; return; }
    await pull();
    const srv = state.players[found.slot];
    me = { slot: found.slot, mission: found.mission, name: srv?.name || '', g: srv?.g || {}, fresh: true };
    save('me', me);
    me.name ? viewHome() : viewName();
  };
}

function viewName() {
  $app.innerHTML = `
    <span class="stamp">${agentNo(me.slot)}</span>
    <h1>Identify<br><em>yourself.</em></h1>
    <p class="sub">So everyone can accuse you properly.</p>
    <div class="card"><form id="f">
      <label for="nm">Your name</label>
      <input id="nm" autocomplete="off" maxlength="24" value="${esc(me.name)}" placeholder="e.g. Grandpa">
      <button>That's me</button></form></div>`;
  document.getElementById('f').onsubmit = async e => {
    e.preventDefault();
    const n = document.getElementById('nm').value.trim();
    if (!n) return;
    me.name = n; save('me', me);
    viewHome();
    await push(myMsg());
  };
}

let hidden = true;
function viewHome() {
  document.body.classList.remove('wide');
  if (me.fresh) { hidden = false; me.fresh = false; save('me', me); }
  const others = Object.values(state.players).filter(p => p.slot !== me.slot && p.name).sort((a, b) => a.name.localeCompare(b.name));
  const nameOf = s => state.players[s]?.name || agentNo(s);
  const gs = Object.entries(me.g || {}).filter(([, v]) => v);
  const locked = state.reveal;
  $app.innerHTML = `
    <div class="row" style="justify-content:space-between"><span class="stamp">${agentNo(me.slot)}</span><span style="flex:none" class="pill">${esc(me.name)}</span></div>
    <div class="card teal" id="mc">
      <div class="tiny">Your secret mission ${hidden ? '· tap to peek' : '· tap to hide'}</div>
      <div class="mission ${hidden ? 'peek' : ''}">${esc(me.mission)}</div>
      <div class="tiny" style="opacity:.7;margin-top:8px">Do it all dinner. Don't get caught.</div>
    </div>
    ${locked ? `<div class="card mustard"><div class="mission" style="font-size:22px">Guessing is closed.</div>Eyes on the host — the big reveal is happening. Get ready to confess your mission out loud.</div>` : `
    <h2>Log a suspicion</h2>
    <div class="card"><form id="gf">
      <label for="who">Who's up to something?</label>
      <select id="who">${others.length ? '<option value="">Pick a suspect…</option>' + others.map(p => `<option value="${p.slot}">${esc(p.name)}</option>`).join('') : '<option value="">Nobody else has logged in yet</option>'}</select>
      <label for="gt">What do you think their mission is?</label>
      <textarea id="gt" maxlength="160" placeholder="They keep saying 'fascinating'…"></textarea>
      <button class="mustard">Save guess</button>
      <div class="err" id="gerr"></div>
    </form></div>`}
    <h2>Your guesses <span class="pill ${gs.length ? '' : 'off'}">${gs.length}</span></h2>
    <div class="card">${gs.length ? gs.map(([s, v]) => `
      <div class="guess"><div class="who">${esc(nameOf(s))}</div><div class="what">${esc(v)}</div>
      ${locked ? '' : `<button class="small ghost" data-edit="${s}">Edit</button>`}</div>`).join('')
      : '<span style="color:var(--mute)">None yet. Watch closely. Someone is humming.</span>'}</div>
    <details class="card pink"><summary style="font-weight:900;cursor:pointer">How scoring works</summary>
      <p>Everyone has a secret mission. Do yours all dinner without getting caught, and watch everyone else.</p>
      <p><b>+1</b> for every mission you guess right.<br><b>+1</b> if you pull off your mission and nobody guesses it.</p>
      <p>You can change a guess any time until the host closes guessing.</p></details>
    <div class="foot"><a href="#" id="out">Not you? Log out</a><a href="#" id="ref">Refresh</a></div>`;
  document.getElementById('mc').onclick = () => { hidden = !hidden; viewHome(); };
  document.getElementById('out').onclick = e => { e.preventDefault(); if (confirm('Log out of this phone?')) { me = null; save('me', null); viewLogin(); } };
  document.getElementById('ref').onclick = async e => { e.preventDefault(); await pull(); await resyncMine(); viewHome(); };
  $app.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => {
    const s = b.dataset.edit; const sel = document.getElementById('who');
    if (![...sel.options].some(o => o.value === s)) sel.add(new Option(nameOf(s), s));
    sel.value = s; document.getElementById('gt').value = me.g[s] || ''; document.getElementById('gt').focus();
  });
  const gf = document.getElementById('gf');
  if (gf) {
    const who = document.getElementById('who');
    who.onchange = () => { document.getElementById('gt').value = me.g[who.value] || ''; };
    gf.onsubmit = async e => {
      e.preventDefault();
      const s = who.value, t = document.getElementById('gt').value.trim();
      if (!s) { document.getElementById('gerr').textContent = 'Pick a suspect first.'; return; }
      me.g = { ...(me.g || {}), [s]: t }; if (!t) delete me.g[s];
      save('me', me); hidden = true; viewHome();
      await push(myMsg());
    };
  }
}

/* ---------- host ---------- */
let host = null;  // {players:[{slot,mission}]}
let rv = { i: 0, shown: false };
function viewHostLogin(err = '') {
  $app.innerHTML = `
    <span class="stamp">HOST ONLY</span>
    <h1>Mission<br><em>control.</em></h1>
    <div class="card"><form id="f">
      <label for="pw">Host password</label>
      <input id="pw" autocomplete="off" spellcheck="false">
      <button class="teal">Enter</button><div class="err">${esc(err)}</div></form></div>
    <div class="foot"><a href="#">← Back to agents</a><span></span></div>`;
  document.getElementById('f').onsubmit = async e => {
    e.preventDefault();
    const pw = document.getElementById('pw').value;
    const d = await unlock(pw, G.admin);
    if (!d) return viewHostLogin('Nope.');
    host = d; sessionStorage.setItem(LS('host'), JSON.stringify(d));
    await pull(); viewLobby();
  };
}
const missionOf = s => host.players.find(p => p.slot == s)?.mission;
const hName = s => state.players[s]?.name || agentNo(s);
function guessesAbout(s) {
  return Object.values(state.players).filter(p => p.slot != s && p.g && p.g[s]).map(p => ({ from: p.slot, name: p.name, text: p.g[s] }));
}
function viewLobby() {
  document.body.classList.add('wide');
  const rows = host.players.map(p => {
    const sp = state.players[p.slot];
    const made = sp ? Object.values(sp.g || {}).filter(Boolean).length : 0;
    const about = guessesAbout(p.slot).length;
    return `<tr><td>${agentNo(p.slot)}</td><td><b>${esc(sp?.name || '—')}</b></td><td>${sp ? '<span class="pill">in</span>' : '<span class="pill off">not yet</span>'}</td><td>${made}</td><td>${about}</td></tr>`;
  }).join('');
  $app.innerHTML = `
    <span class="stamp">HOST ONLY</span>
    <h1>Mission <em>control.</em></h1>
    <p class="sub">Guessing is <b>${state.reveal ? 'closed' : 'open'}</b>. Guesses stay hidden until the reveal.</p>
    <div class="card"><table><tr><th>Tag</th><th>Name</th><th>Logged in</th><th>Guesses made</th><th>Suspected by</th></tr>${rows}</table></div>
    <button class="ghost" id="ref">Refresh</button>
    <button id="go">${state.reveal ? 'Continue the reveal →' : 'Close guessing & start the reveal'}</button>
    ${state.reveal ? '<button class="ghost" id="reopen">Reopen guessing</button>' : ''}
    <details class="card"><summary style="font-weight:900;cursor:pointer">All missions (spoilers)</summary>
      ${host.players.map(p => `<div class="guess"><div class="who">${agentNo(p.slot)}</div><div class="what">${esc(p.mission)}</div></div>`).join('')}</details>
    <div class="foot"><a href="#" id="bye">Leave host mode</a><span></span></div>`;
  document.getElementById('ref').onclick = async () => { await pull(); viewLobby(); };
  document.getElementById('go').onclick = async () => {
    if (!state.reveal) { if (!confirm('Close guessing for everyone and start the reveal?')) return; await push({ t: 'reveal', on: true }); }
    rv = { i: 0, shown: false }; await pull(); viewReveal();
  };
  const ro = document.getElementById('reopen');
  if (ro) ro.onclick = async () => { await push({ t: 'reveal', on: false }); viewLobby(); };
  document.getElementById('bye').onclick = e => { e.preventDefault(); sessionStorage.removeItem(LS('host')); host = null; location.hash = ''; };
}
function order() {
  const inGame = host.players.filter(p => state.players[p.slot]).map(p => p.slot);
  return inGame.length ? inGame : host.players.map(p => p.slot);
}
let markT;
function saveMarks() { clearTimeout(markT); markT = setTimeout(() => push({ t: 'marks', m: state.marks.m, d: state.marks.d }), 800); }
function viewReveal() {
  document.body.classList.add('wide');
  const ord = order();
  if (rv.i >= ord.length) return viewScores();
  const s = ord[rv.i];
  const gs = guessesAbout(s);
  const m = state.marks.m || {}, d = state.marks.d || {};
  $app.innerHTML = `
    <div class="row" style="justify-content:space-between"><span class="stamp">THE REVEAL · ${rv.i + 1} of ${ord.length}</span><a href="#" id="lob" style="flex:none;color:var(--mute)">Mission control</a></div>
    <div class="big">${esc(hName(s))}</div>
    <div class="tiny">What everyone suspected</div>
    ${gs.length ? gs.map(g => `<div class="rv-guess ${m[g.from + '>' + s] ? 'ok' : ''}" data-k="${g.from}>${s}"><b>${esc(g.name)}</b><span>${esc(g.text)}</span><span class="tick">${m[g.from + '>' + s] ? '✓' : ''}</span></div>`).join('')
      : '<div class="card" style="font-size:20px">Nobody had a clue. Suspiciously smooth.</div>'}
    ${rv.shown ? `
      <div class="card teal"><div class="tiny">The real mission</div><div class="mission" style="font-size:30px">${esc(missionOf(s))}</div></div>
      <p class="sub">${gs.length ? 'Tap the guesses that got it right.' : ''}</p>
      <div class="rv-guess ${d[s] ? 'ok' : ''}" id="done"><span>${esc(hName(s))} pulled it off and nobody caught them</span><span class="tick">${d[s] ? '✓' : ''}</span></div>`
    : `<div class="say">${esc(hName(s))}, stand up and confess your mission.</div>
       <button class="teal" id="show">Show the real mission</button>`}
    <div class="nav"><button class="ghost" id="prev" ${rv.i === 0 ? 'disabled' : ''}>← Back</button><button id="next">${rv.i === ord.length - 1 ? 'Final scores →' : 'Next agent →'}</button></div>`;
  document.getElementById('lob').onclick = e => { e.preventDefault(); viewLobby(); };
  const show = document.getElementById('show'); if (show) show.onclick = () => { rv.shown = true; viewReveal(); };
  document.getElementById('prev').onclick = () => { rv.i--; rv.shown = true; viewReveal(); };
  document.getElementById('next').onclick = () => { rv.i++; rv.shown = false; window.scrollTo(0, 0); viewReveal(); };
  if (rv.shown) {
    $app.querySelectorAll('[data-k]').forEach(el => el.onclick = () => { const k = el.dataset.k; state.marks.m = { ...m, [k]: !m[k] }; if (!state.marks.m[k]) delete state.marks.m[k]; saveMarks(); viewReveal(); });
    document.getElementById('done').onclick = () => { state.marks.d = { ...d, [s]: !d[s] }; if (!state.marks.d[s]) delete state.marks.d[s]; saveMarks(); viewReveal(); };
  }
}
function viewScores() {
  const m = state.marks.m || {}, d = state.marks.d || {};
  const pts = {};
  for (const s of order()) pts[s] = (d[s] ? 1 : 0);
  for (const k of Object.keys(m)) { const from = k.split('>')[0]; pts[from] = (pts[from] || 0) + 1; }
  const rows = Object.entries(pts).sort((a, b) => b[1] - a[1]);
  const top = rows.length ? rows[0][1] : 0;
  $app.innerHTML = `
    <span class="stamp">FINAL DEBRIEF</span>
    <div class="big">Top agent${rows.filter(r => r[1] === top).length > 1 ? 's' : ''}:<br><span style="color:var(--red)">${rows.filter(r => r[1] === top && top > 0).map(r => esc(hName(r[0]))).join(' & ') || 'nobody, somehow'}</span></div>
    <div class="card"><table class="score">${rows.map(([s, p]) => `<tr><td><b>${esc(hName(s))}</b><br><span style="color:var(--mute);font-size:14px">${esc(missionOf(s))}</span></td><td>${p}</td></tr>`).join('')}</table></div>
    <div class="nav"><button class="ghost" id="back">← Back</button><button class="teal" id="lob">Mission control</button></div>`;
  document.getElementById('back').onclick = () => { rv.i = order().length - 1; rv.shown = true; viewReveal(); };
  document.getElementById('lob').onclick = () => viewLobby();
  confetti();
}
function confetti() {
  const c = document.createElement('canvas'); c.className = 'confetti'; document.body.appendChild(c);
  const x = c.getContext('2d'); c.width = innerWidth; c.height = innerHeight;
  const cols = ['#e4572e', '#f2b134', '#2b7a78', '#f3a5a0', '#2d2a32'];
  const ps = Array.from({ length: 140 }, () => ({ x: Math.random() * c.width, y: -Math.random() * c.height, r: 4 + Math.random() * 6, v: 2 + Math.random() * 3, a: Math.random() * 6, c: cols[Math.random() * 5 | 0] }));
  let f = 0; (function tick() { x.clearRect(0, 0, c.width, c.height); ps.forEach(p => { p.y += p.v; p.a += .1; x.fillStyle = p.c; x.save(); x.translate(p.x + Math.sin(p.a) * 8, p.y); x.rotate(p.a); x.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * .6); x.restore(); }); if (++f < 260) requestAnimationFrame(tick); else c.remove(); })();
}

/* ---------- routing ---------- */
async function route() {
  rebuild();
  if (location.hash === '#host') {
    try { host = JSON.parse(sessionStorage.getItem(LS('host'))); } catch {}
    if (host) { await pull(); viewLobby(); } else viewHostLogin();
    return;
  }
  document.body.classList.remove('wide');
  if (!me) return viewLogin();
  if (!me.name) return viewName();
  viewHome();
  await pull(); await resyncMine();
  if (location.hash !== '#host' && document.activeElement?.tagName !== 'TEXTAREA' && document.activeElement?.tagName !== 'SELECT') viewHome();
}
window.addEventListener('hashchange', route);
// players: gentle background refresh (keeps request count low — whole family shares one Wi-Fi)
setInterval(async () => {
  if (document.hidden || location.hash === '#host' || !me || !me.name) return;
  const was = state.reveal, n = Object.keys(state.players).length;
  await pull(); await resyncMine();
  const busy = ['TEXTAREA', 'SELECT', 'INPUT'].includes(document.activeElement?.tagName);
  if (!busy && (was !== state.reveal || n !== Object.keys(state.players).length)) viewHome();
}, 75000);
document.addEventListener('visibilitychange', () => { if (!document.hidden && me && me.name && location.hash !== '#host') route(); });
route();
})();
