/* Interactive scavenger hunt — one app, many themes, two age modes.
   Theme chosen by URL: index.html?theme=christmas  (defaults to the first theme below).
   100% client-side: progress lives in the player's own browser (localStorage). No server, no accounts. */
(function () {
  "use strict";

  // Add each new theme's file name (without .js) here.
  const THEME_IDS = ["christmas"];

  const $app = document.getElementById("app");
  const params = new URLSearchParams(location.search);
  const requested = (params.get("theme") || THEME_IDS[0]).toLowerCase();
  const themeId = THEME_IDS.includes(requested) ? requested : null;
  if (!themeId) { $app.innerHTML = '<p class="loading">That hunt doesn\'t exist. Check the link on your printed guide.</p>'; return; }

  if (window.HUNT_THEMES && window.HUNT_THEMES[themeId]) start(window.HUNT_THEMES[themeId]);
  else {
    const s = document.createElement("script");
    s.src = "themes/" + themeId + ".js";
    s.onload = () => start(window.HUNT_THEMES[themeId]);
    s.onerror = () => ($app.innerHTML = '<p class="loading">Couldn\'t load the hunt. Check your connection and refresh.</p>');
    document.head.appendChild(s);
  }

  function start(T) {
    const M = window.Motifs, P = T.palette;
    document.title = T.title;
    const css = document.documentElement.style;
    Object.entries(P).forEach(([k, v]) => css.setProperty("--" + k.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase()), v));
    document.querySelector('meta[name="theme-color"]').setAttribute("content", P.navy);

    const total = T.clues.length;
    const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    const sym = (id) => T.symbols.find((s) => s.id === id);
    const icon = (svg) => `<svg viewBox="0 0 100 100" aria-hidden="true">${svg}</svg>`;

    // ---------- Saved progress (per theme). Storage can be unavailable (private mode): the game still works.
    const KEY = "hunt:" + T.id + ":v2";
    let state = { solved: [], welcomed: false, muted: false, mode: null };
    try { const raw = localStorage.getItem(KEY); if (raw) state = Object.assign(state, JSON.parse(raw)); } catch (e) {}
    const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} };
    const little = () => state.mode === "little";
    const isSolved = (n) => state.solved.includes(n);

    // ---------- Sound: synthesised with Web Audio, so there are no audio files to host or license.
    let ctx = null;
    const audio = () => {
      if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
      if (ctx.state === "suspended") ctx.resume();
      return ctx;
    };
    function tone(freq, t0, dur, type = "sine", gain = 0.2) {
      const c = audio(); if (!c) return;
      const o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t0);
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(gain, t0 + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g).connect(c.destination); o.start(t0); o.stop(t0 + dur + 0.05);
    }
    function noise(t0, dur, freq, gain) {
      const c = audio(); if (!c) return;
      const len = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
      src.buffer = buf; f.type = "bandpass"; f.frequency.value = freq; f.Q.value = 3; g.gain.value = gain;
      src.connect(f).connect(g).connect(c.destination); src.start(t0);
    }
    const bell = (f, t, v = 0.16) => { tone(f, t, 1.4, "sine", v); tone(f * 2.76, t, 0.6, "sine", v * 0.35); tone(f * 5.4, t, 0.25, "sine", v * 0.15); };
    // Preset library — future themes can add presets (e.g. "creak", "waves", "chimes") here.
    const PRESETS = {
      bell: (t) => bell(1318, t, 0.1),
      sleighbells: (t) => { for (let i = 0; i < 16; i++) { const tt = t + i * 0.055 + Math.random() * 0.02; noise(tt, 0.05, 6500 + Math.random() * 2500, 0.5); tone(2400 + Math.random() * 1600, tt, 0.12, "sine", 0.03); } bell(1046, t + 0.05, 0.12); bell(1568, t + 0.25, 0.1); },
      thud: (t) => { tone(220, t, 0.22, "triangle", 0.18); tone(165, t + 0.16, 0.32, "triangle", 0.18); },
      carillon: (t) => { [1046, 1318, 1568, 2093, 1568, 2093].forEach((f, i) => bell(f, t + i * 0.16, 0.14)); PRESETS.sleighbells(t + 1); },
    };
    const play = (name) => {
      if (state.muted) return;
      const c = audio(); if (!c) return;
      const p = PRESETS[T.sounds[name]]; if (p) p(c.currentTime + 0.01);
      if (navigator.vibrate && name === "wrong") navigator.vibrate(60);
    };

    // ---------- Read-aloud. Prefers the British "Serena" voice (best: Serena Premium/Enhanced on iPhone),
    // then other British voices, then any English voice. Silently skipped if the phone has no speech.
    const canSpeak = "speechSynthesis" in window;
    let voices = [];
    const loadVoices = () => { try { voices = speechSynthesis.getVoices() || []; } catch (e) {} };
    if (canSpeak) { loadVoices(); try { speechSynthesis.addEventListener("voiceschanged", loadVoices); } catch (e) {} }
    function pickVoice() {
      const en = voices.filter((v) => /^en/i.test(v.lang));
      const byName = [/serena.*(premium|enhanced)/i, /serena/i, /(daniel|kate|martha|arthur|stephanie).*(premium|enhanced)/i, /google uk english female/i, /(libby|sonia|maisie|hazel|kate|daniel)/i];
      for (const r of byName) { const v = en.find((x) => r.test(x.name)); if (v) return v; }
      return en.find((x) => /en[-_]GB/i.test(x.lang)) || en[0] || null;
    }
    function speak(text) {
      if (!canSpeak || state.muted) return;
      try {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        const v = pickVoice();
        if (v) { u.voice = v; u.lang = v.lang; } else u.lang = "en-GB";
        u.rate = 0.9; u.pitch = 1.05;
        speechSynthesis.speak(u);
      } catch (e) {}
    }
    const stopSpeaking = () => { try { canSpeak && speechSynthesis.cancel(); } catch (e) {} };

    // ---------- Main screen
    let entry = [];
    function render() {
      const done = state.solved.length, complete = done >= total;
      const hang = (i) => 6 + Math.round(Math.sin((i / (total - 1)) * Math.PI) * 20);
      $app.innerHTML = `
        <div class="hero">${M.village(P, { w: 560, h: 220, seed: 4, houses: 6, trees: 11 })}</div>
        <header class="top">
          <p class="eyebrow">${esc(T.eyebrow)}</p>
          <h1>${esc(T.title)}</h1>
          <button class="mode-pill" id="modePill">${esc(T.modes[state.mode || "big"].label)} · ${esc(T.modes[state.mode || "big"].ages)}</button>
        </header>
        <section class="garland" aria-label="Progress: ${done} of ${total} found">
          <svg class="string" viewBox="0 0 400 40" preserveAspectRatio="none"><path d="M0 4 Q200 58 400 4" fill="none" stroke="var(--tan)" stroke-width="1.6"/></svg>
          <div class="ornaments" style="grid-template-columns:repeat(${total},1fr)">
            ${T.clues.map((c, i) => `<div class="orn ${isSolved(c.n) ? "done" : ""}">
              <div class="hang" style="height:${hang(i)}px"></div>${ornament(c.n, isSolved(c.n))}
              <div class="ltr">${isSolved(c.n) ? (little() ? "★" : esc(c.letter)) : c.n}</div></div>`).join("")}
          </div>
        </section>
        <section class="panel">
          ${complete
            ? `<p class="prompt">All ten found!</p><div class="row"><button class="btn" id="openFinale">Open the surprise</button></div>`
            : `<p class="prompt">${esc(T.prompt[state.mode || "big"])}</p>
               <div class="slots" id="slots">${[0, 1, 2, 3].map(() => '<div class="slot"></div>').join("")}</div>
               <div class="keypad">${T.symbols.map((s) => `<button class="key" data-sym="${s.id}" aria-label="${esc(s.name)}"><span class="tile">${icon(s.svg())}</span><span class="nm">${esc(s.name)}</span></button>`).join("")}</div>
               <div class="pad-actions"><button class="ghost" id="undo" disabled>Undo</button></div>
               <p class="msg" id="msg"></p>`}
        </section>
        <footer>
          <button class="tiny" id="mute">${state.muted ? iconMute() : iconSound()}<span>${state.muted ? "Sound off" : "Sound on"}</span></button>
          <button class="tiny" id="grownups" aria-label="Grown-ups: press and hold">${iconKey()}<span>Grown-ups (hold)</span><i class="hold-ring"></i></button>
        </footer>
        <div class="foot-art">${M.pineRow(P, { w: 900, h: 60 })}</div>`;
      bind(complete);
    }
    function ornament(n, done) {
      if (T.progressIcon) return T.progressIcon(n, done);
      const c = [P.red, P.pine, P.mustard, P.navy, P.sage][n % 5];
      return done
        ? `<svg viewBox="0 0 30 34"><rect x="11" y="0" width="8" height="5" rx="1" fill="${P.tan}"/><circle cx="15" cy="19" r="13" fill="${c}"/><path d="M3 19 h24" stroke="${P.cream}" stroke-width="2" stroke-dasharray="3 2"/><circle cx="10" cy="13" r="2.6" fill="#fff" opacity=".4"/></svg>`
        : `<svg viewBox="0 0 30 34"><rect x="11" y="0" width="8" height="5" rx="1" fill="none" stroke="${P.tan}"/><circle cx="15" cy="19" r="12.5" fill="${P.card}" stroke="${P.tan}" stroke-dasharray="2.5 2.5"/></svg>`;
    }

    function bind(complete) {
      document.getElementById("mute").onclick = () => { state.muted = !state.muted; save(); if (state.muted) stopSpeaking(); render(); if (!state.muted) play("tap"); };
      document.getElementById("modePill").onclick = () => toast("Grown-ups can switch modes: hold the Grown-ups button.");
      holdToOpen(document.getElementById("grownups"), openParent);
      if (complete) { document.getElementById("openFinale").onclick = showFinale; return; }
      document.querySelectorAll(".key").forEach((k) => k.addEventListener("click", () => press(k.dataset.sym, k)));
      document.getElementById("undo").onclick = () => { entry.pop(); drawSlots(); };
      drawSlots();
    }

    function drawSlots() {
      document.querySelectorAll(".slot").forEach((el, i) => {
        if (entry[i]) { el.classList.add("filled"); el.innerHTML = icon(sym(entry[i]).svg()); }
        else { el.classList.remove("filled"); el.innerHTML = ""; }
      });
      const u = document.getElementById("undo"); if (u) u.disabled = entry.length === 0;
    }

    let checking = false;
    function press(id, el) {
      if (checking || entry.length >= 4) return;
      el.classList.add("pressed"); setTimeout(() => el.classList.remove("pressed"), 140);
      entry.push(id); play("tap"); drawSlots(); setMsg("");
      if (entry.length === 4) { checking = true; setTimeout(check, 380); }
    }
    const setMsg = (t) => { const m = document.getElementById("msg"); if (m) m.textContent = t; };
    function toast(t) { setMsg(t); }

    function check() {
      checking = false;
      // Big Detectives: exact order. Little Helpers: the right four pictures in any order.
      const key = (arr) => (little() ? [...arr].sort() : arr).join(",");
      const clue = T.clues.find((c) => key(c.code) === key(entry));
      if (!clue) {
        play("wrong");
        const s = document.getElementById("slots"); s.classList.remove("shake"); void s.offsetWidth; s.classList.add("shake");
        const w = T.wrong[state.mode || "big"]; setMsg(w[Math.floor(Math.random() * w.length)]);
        setTimeout(() => { entry = []; drawSlots(); }, 700);
        return;
      }
      entry = [];
      if (isSolved(clue.n)) { drawSlots(); setMsg(little() ? T.already : `${T.already} Clue ${clue.n}'s letter is ${clue.letter}.`); play("tap"); return; }
      solve(clue);
    }

    function riddleText(clue) { return clue.riddle.join(" ").replace(/[“”]/g, ""); }

    function solve(clue) {
      state.solved.push(clue.n); save(); play("correct");
      render();
      const last = state.solved.length >= total;
      const spot = T.spots[clue.next];
      const lit = little();
      const el = sheet(lit
        ? `<div class="inner">
            <p class="kicker">Magic ${clue.n} of ${total} found!</p>
            <h2>You found the magic!</h2>
            <p class="say">“${esc(clue.unlock)}”</p>
            <div class="next-spot"><p class="kicker">${last ? "Now for the surprise" : "Next, look by"}</p>
              <div class="spot-pic">${icon(spot.svg())}</div><p class="spot-name">${esc(spot.name)}</p></div>
            <div class="row">${canSpeak ? `<button class="ghost" data-speak>Hear the riddle again</button>` : ""}
              <button class="btn" data-close>${last ? "See the surprise" : "Off I go!"}</button></div>
            <p class="note">Colour in ornament ${clue.n} on your Magic Collector.</p>
          </div>`
        : `<div class="inner">
            <p class="kicker">Clue ${clue.n} of ${total} cracked</p>
            <h2>Your secret letter is</h2>
            <div class="secret">${esc(clue.letter)}</div>
            <p class="say">“${esc(clue.unlock)}”</p>
            <p class="from">${esc(T.character.name)}</p>
            <p class="note">Write <b>${esc(clue.letter)}</b> in ornament <b>${clue.n}</b> on your Magic Collector.${last ? "" : " Then solve the riddle on your clue to find the next one!"}</p>
            <div class="row">${canSpeak ? `<button class="ghost" data-speak>Read the riddle aloud</button>` : ""}
              <button class="btn" data-close>${last ? "See the surprise" : "Off I go!"}</button></div>
          </div>`,
        () => { stopSpeaking(); if (last) setTimeout(showFinale, 150); });
      const b = el.querySelector("[data-speak]"); if (b) b.onclick = () => speak(riddleText(clue));
      if (lit) setTimeout(() => speak(`${clue.unlock} ${last ? "" : "Here's your riddle. "}${riddleText(clue)}`), 900);
    }

    function showFinale() {
      play("finale");
      const f = T.finale[state.mode || "big"], lit = little();
      const prize = state.surprise || T.finale.defaultSurprise;
      const el = document.createElement("div");
      el.className = "finale"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true");
      el.innerHTML = `
        <div class="scene">${celebrationScene()}</div>
        <canvas class="fx" aria-hidden="true"></canvas>
        <div class="fcard">
          <p class="kicker">${esc(T.title)}</p>
          <h2>${esc(f.heading)}</h2>
          ${lit
            ? `<div class="flakes">${T.clues.map((c, i) => `<span style="animation-delay:${0.2 + i * 0.1}s">${icon(flake())}</span>`).join("")}</div>`
            : `<div class="word">${T.finalWord.split("").map((l, i) => `<span style="animation-delay:${0.2 + i * 0.1}s">${esc(l)}</span>`).join("")}</div>`}
          <p class="say">${esc(f.body)}</p>
          <button class="gift" id="gift" aria-label="${esc(T.finale.tapGift)}">
            <svg viewBox="0 0 120 110" aria-hidden="true"><g class="box"><rect x="18" y="46" width="84" height="60" rx="4" fill="${P.red}"/><rect x="54" y="46" width="12" height="60" fill="${P.mustard}"/></g>
              <g class="lid"><rect x="12" y="34" width="96" height="16" rx="3" fill="${P.red}"/><rect x="54" y="34" width="12" height="16" fill="${P.mustard}"/>
              <path d="M60 34 C44 10 24 16 30 28 C33 34 48 34 60 34Z M60 34 C76 10 96 16 90 28 C87 34 72 34 60 34Z" fill="${P.mustard}"/></g></svg>
            <span>${esc(T.finale.tapGift)}</span>
          </button>
          <div class="reveal" id="reveal" hidden><p class="kicker">${esc(T.finale.earned)}</p><p class="prize">${esc(prize)}</p></div>
          <p class="note" style="margin:6px 0 0">${esc(T.finale.signoff)}</p>
          <p class="from">${esc(T.character.name)}</p>
          <button class="ghost light" data-close>Close</button>
        </div>`;
      document.body.appendChild(el);
      const fx = startFx(el.querySelector(".fx"));
      const opened = () => {
        const g = el.querySelector("#gift"); if (g.classList.contains("open")) return;
        g.classList.add("open"); play("correct"); fx.burst();
        setTimeout(() => { el.querySelector("#reveal").hidden = false; g.querySelector("span").textContent = ""; }, 450);
        speak(T.finale.earned + " " + prize + "!");
      };
      el.querySelector("#gift").onclick = opened;
      el.querySelector("[data-close]").onclick = () => { fx.stop(); stopSpeaking(); el.remove(); };
      fx.burst();
      setTimeout(() => speak(f.heading + " " + f.body + " " + T.finale.tapGift + "."), 1400);
    }

    // Night-time celebration: glowing tree, twinkling lights, lit-up houses, presents.
    function celebrationScene() {
      const W = 420, H = 380, rnd = M.rand(17), warm = Object.assign({}, P, { window: P.mustard });
      let s = `<rect width="${W}" height="${H}" fill="${P.navy}"/>`;
      for (let i = 0; i < 70; i++) s += `<circle class="tw" style="animation-delay:${(rnd() * 2).toFixed(2)}s" cx="${(rnd() * W).toFixed(0)}" cy="${(rnd() * H * 0.6).toFixed(0)}" r="${(0.8 + rnd() * 1.6).toFixed(1)}" fill="${P.cream}"/>`;
      s += `<circle cx="352" cy="58" r="20" fill="${P.cream}"/><circle cx="361" cy="53" r="18" fill="${P.navy}"/>`;
      s += `<path d="M0 ${H} L0 270 Q110 240 210 262 T420 250 L420 ${H}Z" fill="${P.snowBack}"/>`;
      s += M.house(18, 268, 46, P.pink, warm, rnd) + M.house(78, 262, 38, P.mint, warm, rnd) + M.house(318, 262, 40, P.sky, warm, rnd) + M.house(368, 258, 44, P.butter, warm, rnd);
      s += M.pine(132, 270, 70, P.pine, P.roof) + M.pine(296, 266, 62, P.sage, P.roof);
      s += `<path d="M0 ${H} L0 318 Q140 296 220 314 T420 306 L420 ${H}Z" fill="${P.snow}"/>`;
      // glow behind the tree
      s += `<defs><radialGradient id="treeGlow"><stop offset="0" stop-color="${P.mustard}" stop-opacity=".55"/><stop offset="1" stop-color="${P.mustard}" stop-opacity="0"/></radialGradient></defs><circle class="glow" cx="210" cy="200" r="150" fill="url(#treeGlow)"/>`;
      // big tree
      const cx = 210, base = 318;
      s += `<rect x="${cx - 9}" y="${base - 26}" width="18" height="26" fill="${P.roof}"/>`;
      [[96, 168, 54], [146, 228, 80], [204, 298, 108]].forEach(([top, bot, half]) => {
        s += `<path d="M${cx} ${top - 30} L${cx + half} ${bot} Q${cx + half * 0.4} ${bot - 12} ${cx} ${bot + 4} Q${cx - half * 0.4} ${bot - 12} ${cx - half} ${bot}Z" fill="${P.pine}"/>`;
      });
      s += `<path d="M${cx - 40} 150 Q${cx} 166 ${cx + 42} 146 M${cx - 66} 214 Q${cx} 234 ${cx + 68} 208 M${cx - 92} 280 Q${cx} 302 ${cx + 94} 274" fill="none" stroke="${P.mustard}" stroke-width="2.4" stroke-dasharray="1 7" stroke-linecap="round"/>`;
      const lights = [[-24, 132], [20, 128], [-6, 112], [-48, 186], [0, 194], [44, 180], [-26, 170], [24, 160], [-78, 254], [-34, 262], [14, 258], [60, 248], [86, 268], [-56, 232], [36, 226], [-10, 236]];
      const cols = [P.red, P.mustard, P.cream, P.mint, P.pink];
      lights.forEach(([dx, y], i) => (s += `<circle class="bulb" style="animation-delay:${(i * 0.17) % 1.4}s" cx="${cx + dx}" cy="${y}" r="5" fill="${cols[i % cols.length]}"/>`));
      // star with rays
      s += `<g class="rays" style="transform-origin:${cx}px 62px">${[0, 1, 2, 3, 4, 5, 6, 7].map((k) => `<path d="M${cx} 62 L${cx - 3} 22 L${cx + 3} 22Z" fill="${P.mustard}" opacity=".55" transform="rotate(${k * 45} ${cx} 62)"/>`).join("")}</g>`;
      const pts = []; for (let i = 0; i < 10; i++) { const a = (i * Math.PI) / 5 - Math.PI / 2, r = i % 2 ? 8 : 19; pts.push((cx + r * Math.cos(a)).toFixed(1) + "," + (62 + r * Math.sin(a)).toFixed(1)); }
      s += `<polygon class="star" points="${pts.join(" ")}" fill="${P.mustard}" style="transform-origin:${cx}px 62px"/>`;
      // presents
      const gift = (x, w, h, c, r) => `<rect x="${x}" y="${base + 6 - h}" width="${w}" height="${h}" rx="2" fill="${c}"/><rect x="${x + w / 2 - 3}" y="${base + 6 - h}" width="6" height="${h}" fill="${r}"/><path d="M${x + w / 2} ${base + 6 - h} c-10 -12 -18 -4 -12 0Z M${x + w / 2} ${base + 6 - h} c10 -12 18 -4 12 0Z" fill="${r}"/>`;
      s += gift(138, 40, 30, P.red, P.mustard) + gift(176, 30, 22, P.sky, P.red) + gift(226, 44, 34, P.sage, P.red) + gift(266, 30, 24, P.pink, P.navy);
      return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice" aria-hidden="true">${s}</svg>`;
    }

    // Snow + confetti for the finale.
    function startFx(cv) {
      const g = cv.getContext("2d"); let run = true, parts = [];
      const fit = () => { const r = devicePixelRatio || 1; cv.width = cv.clientWidth * r; cv.height = cv.clientHeight * r; g.setTransform(r, 0, 0, r, 0, 0); };
      fit(); addEventListener("resize", fit);
      const W = () => cv.clientWidth, H = () => cv.clientHeight;
      const snow = () => ({ k: "s", x: Math.random() * W(), y: -10 - Math.random() * H(), r: 1.2 + Math.random() * 2.8, vy: 0.6 + Math.random() * 1.2, w: Math.random() * 6 });
      for (let i = 0; i < 110; i++) { const p = snow(); p.y = Math.random() * H(); parts.push(p); }
      const conf = [P.red, P.mustard, P.mint, P.pink, P.cream];
      const burst = () => { if (still) return; for (let i = 0; i < 140; i++) parts.push({ k: "c", x: W() / 2, y: H() * 0.32, vx: (Math.random() - 0.5) * 9, vy: -3 - Math.random() * 7, r: 3 + Math.random() * 4, a: Math.random() * 6, va: (Math.random() - 0.5) * 0.3, c: conf[i % conf.length], life: 220 }); };
      (function loop() {
        if (!run) return;
        g.clearRect(0, 0, W(), H());
        parts = parts.filter((p) => {
          if (p.k === "s") {
            p.y += still ? 0 : p.vy; p.w += 0.02; p.x += Math.sin(p.w) * 0.4;
            if (p.y > H() + 5) Object.assign(p, snow(), { y: -5 });
            g.globalAlpha = 0.9; g.fillStyle = "#fff"; g.beginPath(); g.arc(p.x, p.y, p.r, 0, 6.28); g.fill();
            return true;
          }
          p.vy += 0.16; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.a += p.va; p.life--;
          g.save(); g.translate(p.x, p.y); g.rotate(p.a); g.globalAlpha = Math.min(1, p.life / 40); g.fillStyle = p.c; g.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); g.restore();
          return p.life > 0 && p.y < H() + 20;
        });
        requestAnimationFrame(loop);
      })();
      return { burst, stop: () => { run = false; removeEventListener("resize", fit); } };
    }
    function sheet(html, onClose) {
      const el = document.createElement("div");
      el.className = "sheet"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true");
      el.innerHTML = `<div class="card"><div class="sheet-art">${M.village(P, { w: 900, h: 120, seed: 11, houses: 6, trees: 10, moon: false })}</div>${html}</div>`;
      const close = () => { el.remove(); onClose && onClose(); };
      el.addEventListener("click", (e) => { if (e.target === el || e.target.closest("[data-close]")) close(); });
      document.body.appendChild(el);
      const b = el.querySelector("[data-close]"); b && b.focus({ preventScroll: true });
      return el;
    }

    // ---------- Grown-ups: press-and-hold so kids don't wander in.
    function holdToOpen(btn, fn) {
      let t = null;
      const start = (e) => { e.preventDefault(); btn.classList.add("holding"); t = setTimeout(() => { btn.classList.remove("holding"); fn(); }, 1800); };
      const stop = () => { btn.classList.remove("holding"); clearTimeout(t); };
      btn.addEventListener("pointerdown", start);
      ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => btn.addEventListener(ev, stop));
      btn.addEventListener("contextmenu", (e) => e.preventDefault());
      btn.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fn(); } });
    }

    function modeButtons(current) {
      return `<div class="modes">${Object.entries(T.modes).map(([k, m]) => `
        <button class="mode ${current === k ? "on" : ""}" data-mode="${k}">
          <span class="mode-ic">${icon(k === "little" ? sym("star").svg() : sym("house").svg())}</span>
          <span><b>${esc(m.label)}</b><small>${esc(m.ages)}</small><em>${esc(m.blurb)}</em></span>
        </button>`).join("")}</div>`;
    }

    function openParent() {
      const rows = T.clues.map((c) => `<li>
          <span class="num">${c.n}</span>
          <span class="where">${esc(c.hideAt)}<small>${isSolved(c.n) ? "Found · letter " + esc(c.letter) : "Not found yet"}</small></span>
          <span class="mini-code">${c.code.map((s) => icon(sym(s).svg())).join("")}</span>
          ${isSolved(c.n) ? "" : `<button class="ghost" data-skip="${c.n}">Skip</button>`}
        </li>`).join("");
      const el = sheet(`
        <div class="inner parent">
          <p class="kicker">Grown-ups only</p>
          <h2>Hunt controls</h2>
          <h3>Who's playing?</h3>
          ${modeButtons(state.mode)}
          <h3>The surprise under the tree</h3>
          ${surpriseField()}
          <h3>Voice</h3>
          <p class="note" style="margin:0 0 6px" id="voiceNote"></p>
          ${canSpeak ? '<button class="ghost" id="testVoice">Test the voice</button>' : ""}
          <h3>Clues &amp; codes</h3>
          <p class="note" style="margin:0 0 4px">Lost a card? Every code is below. Skip unlocks a clue without its code.</p>
          <ul class="plist">${rows}</ul>
          <div class="row">
            <button class="ghost danger" id="reset">Reset the whole hunt</button>
            <button class="btn green" data-close>Done</button>
          </div>
        </div>`);
      el.querySelectorAll("[data-mode]").forEach((b) => (b.onclick = () => {
        state.mode = b.dataset.mode; save();
        el.querySelectorAll("[data-mode]").forEach((x) => x.classList.toggle("on", x === b));
        render();
      }));
      bindSurprise(el);
      const vn = el.querySelector("#voiceNote"), v = canSpeak ? pickVoice() : null;
      vn.textContent = !canSpeak ? "This phone can't read aloud." : v && /serena/i.test(v.name) ? "Using " + v.name + ". Lovely." :
        "Using " + (v ? v.name : "the default voice") + ". For the best voice on iPhone: Settings → Accessibility → Spoken Content → Voices → English → download Serena (Premium).";
      const tv = el.querySelector("#testVoice"); if (tv) tv.onclick = () => speak(T.welcome.heading);
      el.querySelectorAll("[data-skip]").forEach((b) => (b.onclick = () => { el.remove(); solve(T.clues.find((c) => c.n === +b.dataset.skip)); }));
      const r = el.querySelector("#reset");
      let armed = false;
      r.onclick = () => {
        if (!armed) { armed = true; r.textContent = "Tap again to erase progress"; return; }
        state.solved = []; state.welcomed = false; save(); el.remove(); render(); welcome();
      };
    }

    function surpriseField() {
      const S = T.surprise;
      return `<div class="surprise-field">
          <label for="surprise" class="sr">${esc(S.label)}</label>
          <input id="surprise" type="text" maxlength="60" placeholder="e.g. ${esc(S.ideas[0])}" value="${esc(state.surprise || "")}">
          <div class="chips">${S.ideas.map((i) => `<button type="button" class="chip" data-idea="${esc(i)}">${esc(i)}</button>`).join("")}</div>
          <small>${esc(S.help)}</small></div>`;
    }
    function bindSurprise(el) {
      const inp = el.querySelector("#surprise");
      const set = (v) => { state.surprise = v.trim(); save(); };
      inp.addEventListener("input", () => set(inp.value));
      el.querySelectorAll("[data-idea]").forEach((c) => (c.onclick = () => { inp.value = c.dataset.idea; set(inp.value); }));
    }

    function welcome() {
      if (state.welcomed && state.mode) return;
      const el = sheet(`
        <div class="inner">
          <p class="kicker">A letter from ${esc(T.character.name)}</p>
          <h2>${esc(T.welcome.heading)}</h2>
          <p class="say">${esc(T.welcome.body)}</p>
          <div class="setup">
            <p class="kicker" style="color:var(--navy)">Grown-ups: quick setup</p>
            <h3>Who's playing?</h3>
            ${modeButtons(state.mode)}
            <h3>The surprise under the tree</h3>
            ${surpriseField()}
          </div>
          <p class="note">You can change these any time from Grown-ups.</p>
          <button class="btn" data-close id="go" ${state.mode ? "" : "disabled"}>${esc(T.welcome.button)}</button>
        </div>`, () => { if (!state.mode) state.mode = "big"; state.welcomed = true; save(); render(); play("tap"); if (little()) speak(T.welcome.heading + " " + T.welcome.body); });
      el.querySelectorAll("[data-mode]").forEach((b) => (b.onclick = () => {
        state.mode = b.dataset.mode; save();
        el.querySelectorAll("[data-mode]").forEach((x) => x.classList.toggle("on", x === b));
        el.querySelector("#go").disabled = false;
      }));
      bindSurprise(el);
    }

    // ---------- Gentle snowfall (skipped for reduced motion)
    const cv = document.getElementById("snow"), g = cv.getContext("2d");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let flakes = [];
    const resize = () => { const r = devicePixelRatio || 1; cv.width = innerWidth * r; cv.height = innerHeight * r; g.setTransform(r, 0, 0, r, 0, 0); };
    const mk = (y) => ({ x: Math.random() * innerWidth, y: y != null ? y : Math.random() * innerHeight, r: 1 + Math.random() * 2.2, s: 0.25 + Math.random() * 0.55, w: Math.random() * 6.28 });
    function snowBurst() { for (let i = 0; i < 70; i++) flakes.push(Object.assign(mk(-Math.random() * 300), { s: 1 + Math.random() * 1.5, burst: true })); }
    if (!still) {
      resize(); addEventListener("resize", resize);
      for (let i = 0; i < 26; i++) flakes.push(mk());
      (function loop() {
        g.clearRect(0, 0, innerWidth, innerHeight);
        flakes = flakes.filter((f) => {
          f.y += f.s; f.w += 0.02; f.x += Math.sin(f.w) * 0.3;
          if (f.y > innerHeight + 5) { if (f.burst) return false; Object.assign(f, mk(-5)); }
          g.beginPath(); g.arc(f.x, f.y, f.r, 0, 6.28);
          g.fillStyle = f.burst ? P.red : "rgba(150,150,178,.55)"; g.fill();
          return true;
        });
        requestAnimationFrame(loop);
      })();
    }

    function iconSound() { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"/></svg>'; }
    function iconMute() { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>'; }
    function iconKey() { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="8" cy="12" r="4"/><path d="M12 12h9M18 12v3M21 12v2"/></svg>'; }

    render();
    welcome();
  }
})();
