/* Interactive scavenger hunt — one app, many themes, two age modes.
   Theme chosen by URL: index.html?theme=christmas  (defaults to the first theme below).
   100% client-side: progress lives in the player's own browser (localStorage). No server, no accounts.

   Flow: grown-up setup → app locked → kids paint Santa's letter to reveal the password → unlock
         → enter finders' names → first riddle → 10 clues → celebration under the tree. */
(function () {
  "use strict";

  // Add each new theme's file name (without .js) here.
  const THEME_IDS = ["christmas", "halloween"];

  const $app = document.getElementById("app");
  const params = new URLSearchParams(location.search);
  const requested = (params.get("theme") || THEME_IDS[0]).toLowerCase();
  const themeId = THEME_IDS.includes(requested) ? requested : null;
  if (!themeId) { $app.innerHTML = '<p class="loading">That hunt doesn\'t exist. Check the link on your printed guide.</p>'; return; }

  if (window.HUNT_THEMES && window.HUNT_THEMES[themeId]) start(window.HUNT_THEMES[themeId]);
  else {
    const s = document.createElement("script");
    s.src = "themes/" + themeId + ".js?v=" + (document.querySelector('script[src*="app.js"]') || { src: "" }).src.split("v=")[1];
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
    const fill = (str, o) => String(str).replace(/\{(\w+)\}/g, (_, k) => (o[k] != null ? o[k] : ""));
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Theme wording the engine uses (Christmas defaults, so older theme files keep working).
    const U = Object.assign({
      letterName: "Santa's letter", secretLabel: "letter",
      placeSurprise: "Put the surprise under the Christmas tree.",
      leaveLetter: "Then leave Santa's letter at the front door, knock loudly (or ring the bell) and hide!",
      lockButton: "Lock the Magic Finder", atFinale: "We're at the tree!", seeFinale: "See the magic!",
      surpriseHeading: "The surprise under the tree", testLine: "Ho ho ho! Merry Christmas. The magic is ready.",
      collectorNote: "Colour in ornament {n} on your Magic Collector.",
      writeNote: "Write <b>{word}</b> in ornament <b>{n}</b> on your Magic Collector.",
    }, T.ui || {});
    const wordMode = U.secretLabel === "word";
    const critter = Object.assign({ kind: "mouse", label: "A little mouse! Tap him.", sound: "Squeak!" }, T.critter || {});

    // ---------- Saved progress (per theme). Storage can be unavailable (private mode): the game still works.
    const KEY = "hunt:" + T.id + ":v3";
    let state = { mode: null, paint: true, surprise: "", setupDone: false, unlocked: false, namesDone: false, firstSeen: false,
      names: [], turn: 0, solved: [], muted: false, mice: 0 };
    try { const raw = localStorage.getItem(KEY); if (raw) state = Object.assign(state, JSON.parse(raw)); } catch (e) {}
    const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} };
    const little = () => state.mode === "little";
    const isSolved = (n) => state.solved.includes(n);
    const namesText = (list = state.names) => list.length <= 1 ? (list[0] || "") : list.slice(0, -1).join(", ") + " and " + list[list.length - 1];
    const currentName = () => (state.names.length ? state.names[state.turn % state.names.length] : "");

    // ---------- Sound: synthesised with Web Audio, so there are no audio files to host or license.
    // Phones only allow sound after a tap, so the first tap anywhere "unlocks" audio and speech (see unlockAudio).
    let ctx = null;
    const audio = () => {
      if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
      if (ctx.state !== "running") { try { ctx.resume(); } catch (e) {} }
      return ctx;
    };
    document.addEventListener("visibilitychange", () => { if (!document.hidden && ctx) { try { ctx.resume(); } catch (e) {} } });
    function tone(freq, t0, dur, type = "sine", gain = 0.2, toFreq) {
      const c = audio(); if (!c) return;
      const o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t0);
      if (toFreq) o.frequency.exponentialRampToValueAtTime(toFreq, t0 + dur * 0.6);
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(gain, t0 + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g).connect(c.destination); o.start(t0); o.stop(t0 + dur + 0.05);
    }
    function noise(t0, dur, freq, gain) {
      const c = audio(); if (!c) return;
      const len = Math.max(1, Math.floor(c.sampleRate * dur)), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
      src.buffer = buf; f.type = "bandpass"; f.frequency.value = freq; f.Q.value = 3; g.gain.value = gain;
      src.connect(f).connect(g).connect(c.destination); src.start(t0);
    }
    const bell = (f, t, v = 0.16) => { tone(f, t, 1.4, "sine", v); tone(f * 2.76, t, 0.6, "sine", v * 0.35); tone(f * 5.4, t, 0.25, "sine", v * 0.15); };
    // Preset library — future themes can add presets (e.g. "creak", "waves", "chimes") here.
    const PRESETS = {
      bell: (t) => bell(1318, t, 0.14),
      sleighbells: (t) => { for (let i = 0; i < 16; i++) { const tt = t + i * 0.055 + Math.random() * 0.02; noise(tt, 0.05, 6500 + Math.random() * 2500, 0.6); tone(2400 + Math.random() * 1600, tt, 0.12, "sine", 0.04); } bell(1046, t + 0.05, 0.16); bell(1568, t + 0.25, 0.14); },
      thud: (t) => { tone(220, t, 0.22, "triangle", 0.22); tone(165, t + 0.16, 0.32, "triangle", 0.22); },
      carillon: (t) => { [1046, 1318, 1568, 2093, 1568, 2093].forEach((f, i) => bell(f, t + i * 0.16, 0.17)); PRESETS.sleighbells(t + 1); },
      // A cat's meow: a buzzy tone that rises then falls, through a sweeping filter (sounds like "mee-ow").
      // A cat's "mee-ow": a voice-like buzz shaped by two moving formants (mouth closed "m", open "ee", round "ow"),
      // with a gentle pitch rise and fall and a little vibrato. Soft attack so it never sounds like a beep.
      meow: (t) => {
        const c = audio(); if (!c) return;
        const D = 0.78, src = c.createOscillator(), vib = c.createOscillator(), vibG = c.createGain();
        src.type = "sawtooth";
        src.frequency.setValueAtTime(470, t); src.frequency.linearRampToValueAtTime(690, t + 0.24); src.frequency.linearRampToValueAtTime(640, t + 0.42); src.frequency.exponentialRampToValueAtTime(360, t + D);
        vib.frequency.value = 6; vibG.gain.value = 9; vib.connect(vibG).connect(src.frequency);
        const out = c.createGain(), lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 3200;
        const formant = (pts, q, level) => {
          const f = c.createBiquadFilter(), g = c.createGain(); f.type = "bandpass"; f.Q.value = q; g.gain.value = level;
          f.frequency.setValueAtTime(pts[0], t); f.frequency.linearRampToValueAtTime(pts[1], t + 0.22); f.frequency.exponentialRampToValueAtTime(pts[2], t + D);
          src.connect(f).connect(g).connect(lp);
        };
        formant([420, 900, 560], 5, 1.0);   // F1
        formant([1100, 2300, 950], 9, 0.7); // F2
        lp.connect(out).connect(c.destination);
        out.gain.setValueAtTime(0.0001, t); out.gain.exponentialRampToValueAtTime(0.5, t + 0.1); out.gain.linearRampToValueAtTime(0.42, t + 0.45); out.gain.exponentialRampToValueAtTime(0.0001, t + D);
        src.start(t); vib.start(t); src.stop(t + D + 0.05); vib.stop(t + D + 0.05);
      },
      squeak: (t) => { tone(2300, t, 0.09, "sine", 0.16, 3700); tone(2500, t + 0.13, 0.12, "sine", 0.15, 3900); tone(3100, t + 0.13, 0.08, "triangle", 0.04); },
      unlock: (t) => { tone(600, t, 0.08, "square", 0.06); tone(900, t + 0.09, 0.1, "square", 0.06); PRESETS.carillon(t + 0.2); },
      // Spooky set (Halloween): minor-key chimes, a ghostly "whoo" glide and a creaky door.
      plink: (t) => { bell(880, t, 0.1); tone(1320, t + 0.02, 0.3, "triangle", 0.03); },
      whoo: (t) => { tone(330, t, 1.1, "sine", 0.06, 620); tone(336, t + 0.05, 1.1, "sine", 0.04, 610); },
      spooky: (t) => { [440, 523, 659, 880].forEach((f, i) => bell(f, t + i * 0.09, 0.13)); PRESETS.whoo(t + 0.25); },
      creak: (t) => { for (let i = 0; i < 9; i++) { noise(t + i * 0.045, 0.06, 500 + i * 40, 0.5); tone(110 + i * 12, t + i * 0.045, 0.07, "sawtooth", 0.02); } },
      spookyFinale: (t) => { [440, 523, 659, 880, 659, 880, 1046].forEach((f, i) => bell(f, t + i * 0.15, 0.15)); PRESETS.whoo(t + 1.1); },
      spookyUnlock: (t) => { PRESETS.creak(t); PRESETS.spookyFinale(t + 0.5); },
    };
    const play = (name) => {
      if (state.muted) return;
      const c = audio(); if (!c) return;
      const p = PRESETS[(T.sounds && T.sounds[name]) || name]; if (p) p(c.currentTime + 0.02);
      if (navigator.vibrate && name === "wrong") navigator.vibrate(60);
    };

    // ---------- Narration.
    // 1) Recorded voice: if the theme sets voiceFiles: true, the app plays audio/<theme>/<key>.mp3
    //    (see VOICE-SCRIPT.md). Missing files fall back to 2).
    // 2) The phone's built-in voice (best: Serena Premium on iPhone; Google UK English on Android).
    const canSpeak = "speechSynthesis" in window;
    let voices = [];
    const loadVoices = () => { try { voices = speechSynthesis.getVoices() || []; } catch (e) {} };
    if (canSpeak) { loadVoices(); try { speechSynthesis.addEventListener("voiceschanged", loadVoices); } catch (e) {} }
    function pickVoice() {
      const en = voices.filter((v) => /^en/i.test(v.lang));
      const gb = (v) => /en[-_]GB/i.test(v.lang);
      const hq = (v) => /(premium|enhanced|natural|neural)/i.test(v.name);
      return en.find((v) => /serena/i.test(v.name) && hq(v)) || en.find((v) => gb(v) && hq(v)) || en.find(hq) ||
        en.find((v) => /google uk english female/i.test(v.name)) || en.find((v) => /serena/i.test(v.name)) ||
        en.find((v) => /google uk english/i.test(v.name)) || en.find(gb) || en[0] || null;
    }
    let speakTimer = null;
    function speak(text) {
      if (!canSpeak || state.muted || !text) return;
      try {
        speechSynthesis.cancel(); clearTimeout(speakTimer);
        // Small gap after cancel(): some browsers drop an utterance spoken straight after cancelling.
        speakTimer = setTimeout(() => {
          const u = new SpeechSynthesisUtterance(String(text).replace(/[“”]/g, ""));
          const v = pickVoice();
          if (v) { u.voice = v; u.lang = v.lang; } else u.lang = "en-GB";
          u.rate = 0.95; u.pitch = 1;
          speechSynthesis.speak(u);
        }, 120);
      } catch (e) {}
    }
    const player = new Audio(); player.preload = "auto";
    let queue = [];
    function playNext() {
      const part = queue.shift(); if (!part) return;
      if (!part.key) return playNext(); // names and other dynamic bits are skipped in recorded mode
      player.onended = playNext;
      // Missing optional clips (Santa's "found it" lines) are skipped quietly; anything else falls back to the phone voice.
      const fail = () => { if (part.optional) return playNext(); queue = []; speak(part.text); };
      player.onerror = fail;
      player.src = `audio/${T.id}/${part.key}.mp3?v=${T.audioVersion || 1}`;
      const pr = player.play(); if (pr && pr.catch) pr.catch((e) => { if (e && e.name === "NotAllowedError") { queue = []; speak(part.text); } else fail(); });
    }
    // say([{key, text}, ...]) — key = recording name, text = what the built-in voice says instead.
    function say(parts) {
      if (state.muted) return;
      parts = parts.filter((p) => p && (p.text || p.key));
      if (T.voiceFiles) { stopSpeaking(); queue = parts.slice(); playNext(); }
      else speak(parts.map((p) => p.text).filter(Boolean).join(" "));
    }
    const stopSpeaking = () => { try { canSpeak && speechSynthesis.cancel(); clearTimeout(speakTimer); } catch (e) {} try { queue = []; player.pause(); } catch (e) {} };

    function silentWav() {
      const n = 800, buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf);
      const w = (o, str) => { for (let i = 0; i < str.length; i++) v.setUint8(o + i, str.charCodeAt(i)); };
      w(0, "RIFF"); v.setUint32(4, 36 + n * 2, true); w(8, "WAVE"); w(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
      v.setUint32(24, 8000, true); v.setUint32(28, 16000, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, "data"); v.setUint32(40, n * 2, true);
      let bin = ""; new Uint8Array(buf).forEach((x) => (bin += String.fromCharCode(x)));
      return "data:audio/wav;base64," + btoa(bin);
    }
    // First tap anywhere: wake up Web Audio, the recorded-voice player and speech (iPhone/iPad need this).
    let audioUnlocked = false;
    function unlockAudio() {
      if (audioUnlocked) return; audioUnlocked = true;
      const c = audio();
      if (c) { try { const b = c.createBuffer(1, 1, 22050), src = c.createBufferSource(); src.buffer = b; src.connect(c.destination); src.start(0); } catch (e) {} }
      try { player.muted = true; player.src = silentWav();
        const pr = player.play(); const done = () => { try { player.pause(); player.muted = false; } catch (e) {} };
        if (pr && pr.then) pr.then(done, done); else done(); } catch (e) {}
      if (canSpeak) { try { const u = new SpeechSynthesisUtterance(" "); u.volume = 0; speechSynthesis.speak(u); } catch (e) {} }
    }
    ["pointerdown", "touchend", "click", "keydown"].forEach((ev) => document.addEventListener(ev, unlockAudio, { capture: true, passive: true }));
    const riddleText = (lines) => lines.join(" ");

    // ---------- Shared page chrome
    function frame(inner, { eyebrow, title, sub, heroH = 150 } = {}) {
      $app.innerHTML = `
        <div class="hero" style="height:${heroH}px">${M.village(P, { w: 560, h: 220, seed: 4, houses: 6, trees: 11 })}</div>
        <header class="top">
          ${eyebrow ? `<p class="eyebrow">${esc(eyebrow)}</p>` : ""}
          <h1>${esc(title || T.title)}</h1>
          ${sub || ""}
        </header>
        ${inner}
        <footer>
          <button class="tiny" id="mute">${state.muted ? iconMute() : iconSound()}<span>${state.muted ? "Sound off" : "Sound on"}</span></button>
          <span class="mice-count" id="miceCount" ${state.mice ? "" : "hidden"}>${mouseSvg(true)}<span>${state.mice}</span></span>
          <button class="tiny" id="grownups" aria-label="Grown-ups: press and hold">${iconKey()}<span>Grown-ups (hold)</span><i class="hold-ring"></i></button>
        </footer>
        <div class="foot-art">${M.pineRow(P, { w: 900, h: 60 })}</div>`;
      document.getElementById("mute").onclick = () => { state.muted = !state.muted; save(); if (state.muted) stopSpeaking(); render(); if (!state.muted) play("tap"); };
      holdToOpen(document.getElementById("grownups"), openParent);
    }

    function render() {
      if (!state.setupDone) return renderSetup();
      if (!state.unlocked) return renderLock();
      if (!state.namesDone) return renderNames();
      renderHunt();
    }

    // ---------- 1. Grown-up setup
    function renderSetup() {
      frame(`
        <section class="panel setup-panel">
          <h3><span class="n">1</span>Who's playing?</h3>
          ${modeButtons(state.mode)}
          <h3><span class="n">2</span>What surprise have they earned?</h3>
          ${surpriseField()}
          <h3><span class="n">3</span>Which letter did you print?</h3>
          <div class="seg" id="paintSeg"><button class="${state.paint ? "on" : ""}" data-paint="1">With painting</button><button class="${state.paint ? "" : "on"}" data-paint="0">No painting</button></div>
          <h3><span class="n">4</span>Before you lock it</h3>
          <ol class="checklist">
            <li id="pwStep">${pwStep()}</li>
            <li>Hide the ${total} clue cards. Each card says where it goes.</li>
            <li>${esc(U.placeSurprise)}</li>
          </ol>
          ${voiceBlock()}
          <button class="btn wide" id="lockIt" ${state.mode ? "" : "disabled"}>${esc(U.lockButton)}</button>
          <p class="note center">${esc(U.leaveLetter)}</p>
        </section>`, { eyebrow: "Grown-ups only", title: "Set up the magic", sub: `<p class="lede">Two minutes before the knock on the door.</p>`, heroH: 120 });
      document.querySelectorAll("[data-mode]").forEach((b) => (b.onclick = () => {
        state.mode = b.dataset.mode; save();
        document.querySelectorAll("[data-mode]").forEach((x) => x.classList.toggle("on", x === b));
        document.getElementById("lockIt").disabled = false;
      }));
      bindSurprise($app); bindVoice($app);
      document.querySelectorAll("[data-paint]").forEach((b) => (b.onclick = () => {
        state.paint = b.dataset.paint === "1"; save();
        document.querySelectorAll("[data-paint]").forEach((x) => x.classList.toggle("on", x === b));
        document.getElementById("pwStep").innerHTML = pwStep();
      }));
      document.getElementById("lockIt").onclick = () => { state.setupDone = true; save(); play("tap"); render(); };
    }

    const pwStep = () => state.paint
      ? `Write <b>${esc(T.password)}</b> in big letters on the back of ${esc(U.letterName)} with a white crayon. Press hard.`
      : `Print ${esc(U.letterName)} double-sided. The password is already printed on the back.`;
    const lockBody = () => (state.paint ? T.lock.body : T.lock.bodyNoPaint);
    const lockWrong = () => (state.paint ? T.lock.wrong : T.lock.wrongNoPaint);
    // ---------- 2. Lock screen: the password from the back of Santa's letter
    let pw = [];
    function renderLock() {
      const letters = [...T.password.split(""), ...(T.passwordDecoys || [])];
      const rnd = M.rand(7); const order = letters.map((l) => [rnd(), l]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
      frame(`
        <section class="panel lock-panel">
          <div class="padlock" id="padlock">${padlockSvg()}</div>
          <p class="say">${esc(lockBody())}</p>
          ${canSpeak ? `<button class="ghost small" id="hearLock">${iconSound()} Hear the message</button>` : ""}
          <div class="pw-slots" id="pwSlots">${T.password.split("").map(() => '<div class="pw-slot"></div>').join("")}</div>
          <div class="letters">${order.map((l) => `<button class="lt" data-l="${l}">${l}</button>`).join("")}</div>
          <div class="pad-actions"><button class="ghost" id="pwUndo" disabled>Undo</button></div>
          <p class="msg" id="msg"></p>
        </section>`, { eyebrow: T.title, title: T.lock.heading });
      pw = [];
      const draw = () => {
        document.querySelectorAll(".pw-slot").forEach((el, i) => { el.textContent = pw[i] || ""; el.classList.toggle("filled", !!pw[i]); });
        document.getElementById("pwUndo").disabled = !pw.length;
      };
      const h = document.getElementById("hearLock"); if (h) h.onclick = () => say([{ key: state.paint ? "lock" : "lock-nopaint", text: T.lock.heading + ". " + lockBody() }]);
      document.getElementById("pwUndo").onclick = () => { pw.pop(); draw(); };
      document.querySelectorAll(".lt").forEach((b) => (b.onclick = () => {
        if (pw.length >= T.password.length) return;
        b.classList.add("pressed"); setTimeout(() => b.classList.remove("pressed"), 140);
        pw.push(b.dataset.l); play("tap"); draw(); setMsg("");
        if (pw.length === T.password.length) setTimeout(checkPw, 350);
      }));
      draw();
    }
    function checkPw() {
      if (pw.join("") === T.password) return doUnlock();
      play("wrong");
      const s = document.getElementById("pwSlots"); s.classList.remove("shake"); void s.offsetWidth; s.classList.add("shake");
      setMsg(lockWrong()); say([{ key: state.paint ? "lock-wrong" : "lock-wrong-nopaint", text: lockWrong() }]);
      setTimeout(() => { pw = []; document.querySelectorAll(".pw-slot").forEach((el) => { el.textContent = ""; el.classList.remove("filled"); }); document.getElementById("pwUndo").disabled = true; }, 700);
    }
    function doUnlock() {
      const pl = document.getElementById("padlock"); if (pl) pl.classList.add("open");
      document.querySelectorAll(".pw-slot").forEach((el) => el.classList.add("glow"));
      play("unlock"); snowBurst(); setMsg(T.lock.unlocked); setTimeout(() => say([{ key: "unlocked", text: T.lock.unlocked }]), 900);
      setTimeout(() => { state.unlocked = true; save(); render(); }, 1600);
    }

    // ---------- 3. Finders' names
    function renderNames() {
      const list = state.names.length ? state.names : [""];
      frame(`
        <section class="panel names-panel">
          <p class="say">${esc(T.namesStep.body)}</p>
          <div class="name-list" id="nameList">${list.map((n, i) => nameRow(n, i)).join("")}</div>
          <button class="ghost small" id="addName" ${list.length >= 4 ? "hidden" : ""}>+ ${esc(T.namesStep.add)}</button>
          <button class="btn wide" id="namesGo">${esc(T.namesStep.button)}</button>
          <button class="link" id="namesSkip">${esc(T.namesStep.skip)}</button>
        </section>`, { eyebrow: T.lock.unlocked, title: T.namesStep.heading, heroH: 120 });
      const listEl = document.getElementById("nameList");
      const read = () => [...listEl.querySelectorAll("input")].map((i) => i.value.trim().replace(/\s+/g, " ").slice(0, 20)).filter(Boolean);
      const addBtn = document.getElementById("addName");
      const renumber = () => {
        listEl.querySelectorAll(".name-row").forEach((row, i) => { row.querySelector("span").textContent = i + 1; row.querySelector("input").id = "name" + i; });
        addBtn.hidden = listEl.querySelectorAll(".name-row").length >= 4;
      };
      addBtn.onclick = () => {
        const n = listEl.querySelectorAll("input").length; if (n >= 4) return;
        listEl.insertAdjacentHTML("beforeend", nameRow("", n)); listEl.querySelectorAll("input")[n].focus(); renumber();
      };
      listEl.addEventListener("click", (e) => {
        const x = e.target.closest(".name-x"); if (!x) return;
        e.preventDefault();
        const rows = listEl.querySelectorAll(".name-row");
        if (rows.length === 1) rows[0].querySelector("input").value = ""; else x.closest(".name-row").remove();
        renumber();
      });
      const go = (names) => { state.names = names; state.namesDone = true; state.turn = 0; save(); play("tap"); render(); showFirstRiddle(); };
      document.getElementById("namesGo").onclick = () => go(read());
      document.getElementById("namesSkip").onclick = () => go([]);
    }
    const nameRow = (v, i) => `<div class="name-row"><span>${i + 1}</span><input id="name${i}" type="text" maxlength="20" autocomplete="off" autocapitalize="words" aria-label="Finder ${i + 1}" placeholder="${esc(T.namesStep.placeholder)}" value="${esc(v)}"><button type="button" class="name-x" aria-label="Remove this name">×</button></div>`;

    // ---------- 4. First riddle (leads to Clue 1)
    function showFirstRiddle() {
      const lines = T.riddles[T.firstSpot], spot = T.spots[T.firstSpot];
      const who = namesText();
      const el = sheet(`
        <div class="inner">
          <p class="kicker">${esc(T.firstRiddle.kicker)}</p>
          <h2>${who ? "Ready, " + esc(who) + "?" : "Ready, Magic Finders?"}</h2>
          ${little() ? pictureClue(spot) : riddleBox(lines)}
          <div class="row">${canSpeak ? `<button class="ghost" data-speak>Read it aloud</button>` : ""}
            <button class="btn" data-close>${esc(T.firstRiddle.go)}</button></div>
        </div>`, () => { stopSpeaking(); state.firstSeen = true; save(); });
      const part = little() ? { key: "hint-" + T.firstSpot, text: spot.hint } : { key: "first-riddle", text: riddleText(lines) };
      const b = el.querySelector("[data-speak]"); if (b) b.onclick = () => say([part]);
      setTimeout(() => say([{ text: who ? "Ready, " + who + "?" : "" }, little() ? part : { key: "first-riddle", text: "Here's your first riddle. " + riddleText(lines) }]), 700);
    }

    // ---------- 5. The hunt
    let entry = [];
    function renderHunt() {
      const done = state.solved.length, complete = done >= total;
      const hang = (i) => 6 + Math.round(Math.sin((i / (total - 1)) * Math.PI) * 20);
      const m = T.modes[state.mode || "big"];
      const multi = state.names.length > 1;
      frame(`
        <section class="garland" aria-label="Progress: ${done} of ${total} found">
          <svg class="string" viewBox="0 0 400 40" preserveAspectRatio="none"><path d="M0 4 Q200 58 400 4" fill="none" stroke="var(--tan)" stroke-width="1.6"/></svg>
          <div class="ornaments" style="grid-template-columns:repeat(${total},1fr)">
            ${T.clues.map((c, i) => `<div class="orn ${isSolved(c.n) ? "done" : ""}">
              <div class="hang" style="height:${hang(i)}px"></div>${ornament(c.n, isSolved(c.n))}
              <div class="ltr">${isSolved(c.n) ? (little() ? "★" : wordMode ? "" : esc(c.letter)) : c.n}</div></div>`).join("")}
          </div>
        </section>
        ${wordMode && !little() ? `<p class="spell-strip" aria-label="The spell so far">${T.clues.map((c) => isSolved(c.n) ? `<b>${esc(c.letter)}</b>` : `<i>__</i>`).join(" ")}</p>` : ""}
        <section class="panel">
          ${complete
            ? `<p class="prompt">All ten found! Last stop…</p>
               ${little() ? pictureClue(T.spots[T.clues[total - 1].next], "Go to") : riddleBox(T.clues[total - 1].riddle)}
               <div class="row"><button class="btn" id="openFinale">${esc(little() ? U.seeFinale : U.atFinale)}</button></div>`
            : `${multi ? `<p class="turn-pill">${esc(fill(T.turn, { name: currentName() }))}</p>` : ""}
               ${done ? (little() ? lookBy() : `<div class="row" style="margin:0 0 12px"><button class="ghost small" id="seeRiddle">See your last riddle</button></div>`) : ""}
               <p class="prompt">${esc(T.prompt[state.mode || "big"])}</p>
               <div class="slots" id="slots">${[0, 1, 2, 3].map(() => '<div class="slot"></div>').join("")}</div>
               <div class="keypad">${T.symbols.map((s) => `<button class="key" data-sym="${s.id}" aria-label="${esc(s.name)}"><span class="tile">${icon(s.svg())}</span><span class="nm">${esc(s.name)}</span></button>`).join("")}</div>
               <div class="pad-actions"><button class="ghost" id="undo" disabled>Undo</button></div>
               <p class="msg" id="msg"></p>`}
        </section>`, {
        eyebrow: T.eyebrow,
        sub: `<button class="mode-pill" id="modePill">${state.names.length ? esc(namesText()) + " · " : ""}${esc(m.label)}</button>`,
      });
      const lastClue = () => T.clues.find((k) => k.n === state.solved[state.solved.length - 1]);
      const hr = document.getElementById("hearAgain"); if (hr) hr.onclick = () => { const sp = T.spots[lastClue().next]; say([{ key: "hint-" + lastClue().next, text: sp.hint }]); };
      const sr = document.getElementById("seeRiddle"); if (sr) sr.onclick = () => {
        const c = lastClue();
        const el = sheet(`<div class="inner"><p class="kicker">The riddle from clue ${c.n}</p><h2>Where to next?</h2>${riddleBox(c.riddle)}
          <div class="row">${canSpeak || T.voiceFiles ? `<button class="ghost" data-speak>Read it aloud</button>` : ""}<button class="btn" data-close>Got it!</button></div></div>`, stopSpeaking);
        const b = el.querySelector("[data-speak]"); if (b) b.onclick = () => say([{ key: "riddle-" + c.n, text: riddleText(c.riddle) }]);
      };
      document.getElementById("modePill").onclick = () => setMsg("Grown-ups can change this: hold the Grown-ups button.");
      if (complete) { document.getElementById("openFinale").onclick = showFinale; return; }
      document.querySelectorAll(".key").forEach((k) => k.addEventListener("click", () => press(k.dataset.sym, k)));
      document.getElementById("undo").onclick = () => { entry.pop(); drawSlots(); };
      drawSlots();
    }
    const riddleBox = (lines) => `<div class="riddle-box">${lines.map((l) => `<p>${esc(l)}</p>`).join("")}</div>`;
    // Little Helpers get a picture of the next place plus one simple sentence (no reading needed).
    const pictureClue = (spot, kicker = "Where next?") => `<div class="next-spot"><p class="kicker">${esc(kicker)}</p>
      <div class="spot-pic">${icon(spot.svg())}</div><p class="spot-hint">${esc(spot.hint)}</p></div>`;
    // Little Helpers: keep a picture of where to look next on the main screen, so they don't forget.
    function lookBy() {
      const c = T.clues.find((k) => k.n === state.solved[state.solved.length - 1]); if (!c) return "";
      const spot = T.spots[c.next];
      return `<div class="look-by"><span class="lb-pic">${icon(spot.svg())}</span><span class="lb-txt"><small>Where next?</small><b>${esc(spot.hint)}</b></span>
        ${canSpeak || T.voiceFiles ? `<button class="ghost small" id="hearAgain" aria-label="Hear the riddle again">${iconSound()}</button>` : ""}</div>`;
    }
    function ornament(n, done) {
      if (T.progressIcon) return T.progressIcon(n, done);
      const c = [P.red, P.pine, P.mustard, P.navy, P.sage][n % 5];
      return done
        ? `<svg viewBox="0 0 30 34"><rect x="11" y="0" width="8" height="5" rx="1" fill="${P.tan}"/><circle cx="15" cy="19" r="13" fill="${c}"/><path d="M3 19 h24" stroke="${P.cream}" stroke-width="2" stroke-dasharray="3 2"/><circle cx="10" cy="13" r="2.6" fill="#fff" opacity=".4"/></svg>`
        : `<svg viewBox="0 0 30 34"><rect x="11" y="0" width="8" height="5" rx="1" fill="none" stroke="${P.tan}"/><circle cx="15" cy="19" r="12.5" fill="${P.card}" stroke="${P.tan}" stroke-dasharray="2.5 2.5"/></svg>`;
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
      if (isSolved(clue.n)) { drawSlots(); setMsg(little() ? T.already : `${T.already} Clue ${clue.n}'s ${U.secretLabel} is ${clue.letter}.`); play("tap"); return; }
      solve(clue);
    }

    function solve(clue) {
      const who = currentName();
      const cheer = who ? fill(T.cheers[state.solved.length % T.cheers.length], { name: who }) : "";
      state.solved.push(clue.n);
      if (state.names.length) state.turn++;
      save(); play("correct");
      render();
      const last = state.solved.length >= total;
      const spot = T.spots[clue.next];
      const next = state.names.length > 1 && !last ? currentName() : "";
      const nextNote = next ? `<p class="note turn-next">Next turn: <b>${esc(next)}</b></p>` : "";
      const lit = little();
      // Little Helpers: the last find goes straight to the celebration, which tells them to run to the tree.
      if (last && lit) { setTimeout(showFinale, 500); return; }
      const el = sheet(lit
        ? `<div class="inner">
            <p class="kicker">Magic ${state.solved.length} of ${total} found!</p>
            <h2>${esc(cheer || "You found the magic!")}</h2>
            <p class="say">“${esc(clue.unlock)}”</p>
            ${pictureClue(spot, last ? "Now for the surprise!" : "Where next?")}
            <div class="row">${canSpeak || T.voiceFiles ? `<button class="ghost" data-speak>Hear it again</button>` : ""}
              <button class="btn" data-close>Off I go!</button></div>
            ${nextNote}
            <p class="note">${esc(fill(U.collectorNote, { n: clue.n }))}</p>
          </div>`
        : `<div class="inner">
            ${cheer ? `<p class="cheer">${esc(cheer)}</p>` : ""}
            <p class="kicker">Clue ${clue.n} of ${total} cracked</p>
            <h2>${wordMode ? "Your spell word is" : "Your secret letter is"}</h2>
            <div class="secret${wordMode ? " is-word" : ""}">${esc(clue.letter)}</div>
            <p class="say">“${esc(clue.unlock)}”</p>
            <p class="note">${fill(U.writeNote, { word: esc(clue.letter), n: clue.n })}</p>
            <p class="kicker" style="margin-top:4px">${last ? "Your last riddle" : "Your next riddle"}</p>
            ${riddleBox(clue.riddle)}
            ${nextNote}
            <div class="row">${canSpeak ? `<button class="ghost" data-speak>Read the riddle aloud</button>` : ""}
              <button class="btn" data-close>Off I go!</button></div>
          </div>`,
        stopSpeaking);
      const hintPart = { key: "hint-" + clue.next, text: spot.hint };
      const b = el.querySelector("[data-speak]"); if (b) b.onclick = () => say([lit ? hintPart : { key: "riddle-" + clue.n, text: riddleText(clue.riddle) }]);
      if (lit) setTimeout(() => say([{ text: cheer }, { key: "found-" + clue.n, text: clue.unlock, optional: true }, hintPart]), 900);
      else setTimeout(() => say([{ text: cheer }, { key: "found-" + clue.n, text: clue.unlock, optional: true }]), 700);
    }

    // ---------- 6. Finale under the tree
    function showFinale() {
      play("finale");
      const f = T.finale[state.mode || "big"], lit = little();
      const who = namesText();
      const heading = who ? fill(f.heading, { names: who }) : f.headingNoName;
      const prize = state.surprise || T.finale.defaultSurprise;
      const el = document.createElement("div");
      el.className = "finale"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true");
      el.innerHTML = `
        <div class="scene">${celebrationScene()}</div>
        <canvas class="fx" aria-hidden="true"></canvas>
        <div class="fcard">
          <p class="kicker">${esc(T.title)}</p>
          <h2>${esc(heading)}</h2>
          ${lit
            ? `<div class="flakes">${T.clues.map((c, i) => `<span style="animation-delay:${0.2 + i * 0.1}s">${T.progressIcon ? T.progressIcon(c.n, true) : icon(flake())}</span>`).join("")}</div>`
            : wordMode
              ? `<div class="word spell">${T.spell.split(" ").map((l, i) => `<span style="animation-delay:${0.2 + i * 0.12}s">${esc(l)}</span>`).join("")}</div>`
              : `<div class="word">${T.finalWord.split("").map((l, i) => `<span style="animation-delay:${0.2 + i * 0.1}s">${esc(l)}</span>`).join("")}</div>`}
          <p class="say">${esc(f.body)}</p>
          <button class="gift" id="gift" aria-label="${esc(T.finale.tapGift)}">
            ${T.giftSvg ? T.giftSvg() : `<svg viewBox="0 0 120 110" aria-hidden="true"><g class="box"><rect x="18" y="46" width="84" height="60" rx="4" fill="${P.red}"/><rect x="54" y="46" width="12" height="60" fill="${P.mustard}"/></g>
              <g class="lid"><rect x="12" y="34" width="96" height="16" rx="3" fill="${P.red}"/><rect x="54" y="34" width="12" height="16" fill="${P.mustard}"/>
              <path d="M60 34 C44 10 24 16 30 28 C33 34 48 34 60 34Z M60 34 C76 10 96 16 90 28 C87 34 72 34 60 34Z" fill="${P.mustard}"/></g></svg>`}
            <span>${esc(T.finale.tapGift)}</span>
          </button>
          <div class="reveal" id="reveal" hidden><p class="kicker">${esc(T.finale.earned)}</p><p class="prize">${esc(prize)}</p></div>
          <button class="ghost light" data-close>Close</button>
        </div>`;
      document.body.appendChild(el);
      const fx = startFx(el.querySelector(".fx"));
      el.querySelector("#gift").onclick = () => {
        const g = el.querySelector("#gift"); if (g.classList.contains("open")) return;
        g.classList.add("open"); play("correct"); fx.burst();
        setTimeout(() => { const rv = el.querySelector("#reveal"); rv.hidden = false; g.querySelector("span").textContent = ""; try { rv.scrollIntoView({ behavior: still ? "auto" : "smooth", block: "center" }); } catch (e) {} }, 450);
        say([{ key: "earned", text: T.finale.earnedSay || T.finale.earned + " " + prize + "!" }]);
      };
      el.querySelector("[data-close]").onclick = () => { fx.stop(); stopSpeaking(); el.remove(); };
      fx.burst();
      setTimeout(() => say([{ text: who ? heading : "" }, { key: "finale-" + (state.mode || "big"), text: (who ? "" : heading + " ") + f.body }]), 1400);
    }

    // Night-time celebration: glowing tree, twinkling lights, lit-up houses, presents.
    function celebrationScene() {
      if (T.celebrationScene) return T.celebrationScene(M);
      const W = 420, H = 380, rnd = M.rand(17), warm = Object.assign({}, P, { window: P.mustard });
      let s = `<rect width="${W}" height="${H}" fill="${P.navy}"/>`;
      for (let i = 0; i < 70; i++) s += `<circle class="tw" style="animation-delay:${(rnd() * 2).toFixed(2)}s" cx="${(rnd() * W).toFixed(0)}" cy="${(rnd() * H * 0.6).toFixed(0)}" r="${(0.8 + rnd() * 1.6).toFixed(1)}" fill="${P.cream}"/>`;
      s += `<circle cx="352" cy="58" r="20" fill="${P.cream}"/><circle cx="361" cy="53" r="18" fill="${P.navy}"/>`;
      s += `<path d="M0 ${H} L0 270 Q110 240 210 262 T420 250 L420 ${H}Z" fill="${P.snowBack}"/>`;
      s += M.house(18, 268, 46, P.pink, warm, rnd) + M.house(78, 262, 38, P.mint, warm, rnd) + M.house(318, 262, 40, P.sky, warm, rnd) + M.house(368, 258, 44, P.butter, warm, rnd);
      s += M.pine(132, 270, 70, P.pine, P.roof) + M.pine(296, 266, 62, P.sage, P.roof);
      s += `<path d="M0 ${H} L0 318 Q140 296 220 314 T420 306 L420 ${H}Z" fill="${P.snow}"/>`;
      s += `<defs><radialGradient id="treeGlow"><stop offset="0" stop-color="${P.mustard}" stop-opacity=".55"/><stop offset="1" stop-color="${P.mustard}" stop-opacity="0"/></radialGradient></defs><circle class="glow" cx="210" cy="200" r="150" fill="url(#treeGlow)"/>`;
      const cx = 210, base = 318;
      s += `<rect x="${cx - 9}" y="${base - 26}" width="18" height="26" fill="${P.roof}"/>`;
      [[96, 168, 54], [146, 228, 80], [204, 298, 108]].forEach(([top, bot, half]) => {
        s += `<path d="M${cx} ${top - 30} L${cx + half} ${bot} Q${cx + half * 0.4} ${bot - 12} ${cx} ${bot + 4} Q${cx - half * 0.4} ${bot - 12} ${cx - half} ${bot}Z" fill="${P.pine}"/>`;
      });
      s += `<path d="M${cx - 40} 150 Q${cx} 166 ${cx + 42} 146 M${cx - 66} 214 Q${cx} 234 ${cx + 68} 208 M${cx - 92} 280 Q${cx} 302 ${cx + 94} 274" fill="none" stroke="${P.mustard}" stroke-width="2.4" stroke-dasharray="1 7" stroke-linecap="round"/>`;
      const lights = [[-24, 132], [20, 128], [-6, 112], [-48, 186], [0, 194], [44, 180], [-26, 170], [24, 160], [-78, 254], [-34, 262], [14, 258], [60, 248], [86, 268], [-56, 232], [36, 226], [-10, 236]];
      const cols = [P.red, P.mustard, P.cream, P.mint, P.pink];
      lights.forEach(([dx, y], i) => (s += `<circle class="bulb" style="animation-delay:${(i * 0.17) % 1.4}s" cx="${cx + dx}" cy="${y}" r="5" fill="${cols[i % cols.length]}"/>`));
      s += `<g class="rays" style="transform-origin:${cx}px 62px">${[0, 1, 2, 3, 4, 5, 6, 7].map((k) => `<path d="M${cx} 62 L${cx - 3} 22 L${cx + 3} 22Z" fill="${P.mustard}" opacity=".55" transform="rotate(${k * 45} ${cx} 62)"/>`).join("")}</g>`;
      const pts = []; for (let i = 0; i < 10; i++) { const a = (i * Math.PI) / 5 - Math.PI / 2, r = i % 2 ? 8 : 19; pts.push((cx + r * Math.cos(a)).toFixed(1) + "," + (62 + r * Math.sin(a)).toFixed(1)); }
      s += `<polygon class="star" points="${pts.join(" ")}" fill="${P.mustard}" style="transform-origin:${cx}px 62px"/>`;
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
      const snow = () => ({ k: "s", x: Math.random() * W(), y: -10 - Math.random() * H(), r: 1.2 + Math.random() * 2.8, vy: 0.6 + Math.random() * 1.2, w: Math.random() * 6, rot: Math.random() * 6, star: Math.random() < 0.35 });
      for (let i = 0; i < (leaves ? 40 : 110); i++) { const p = snow(); p.y = Math.random() * H(); parts.push(p); }
      const conf = [P.red, P.mustard, P.mint, P.pink, P.cream];
      const burst = () => { if (still) return; for (let i = 0; i < 140; i++) parts.push({ k: "c", x: W() / 2, y: H() * 0.32, vx: (Math.random() - 0.5) * 9, vy: -3 - Math.random() * 7, r: 3 + Math.random() * 4, a: Math.random() * 6, va: (Math.random() - 0.5) * 0.3, c: conf[i % conf.length], life: 220 }); };
      (function loop() {
        if (!run) return;
        g.clearRect(0, 0, W(), H());
        parts = parts.filter((p) => {
          if (p.k === "s") {
            p.y += still ? 0 : p.vy; p.w += 0.02; p.x += Math.sin(p.w) * 0.4; p.rot += 0.01;
            if (p.y > H() + 5) Object.assign(p, snow(), { y: -5 });
            g.globalAlpha = 0.9;
            if (leaves) drawLeaf(g, p.x, p.y, p.r * 2.4, p.rot, leafCols[Math.floor(p.w * 10) % leafCols.length]);
            else if (p.star) drawFlake(g, p.x, p.y, p.r * 2.2, p.rot, "#fff"); else { g.fillStyle = "#fff"; g.beginPath(); g.arc(p.x, p.y, p.r, 0, 6.28); g.fill(); }
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
          <span class="mode-ic">${icon((k === "little" ? sym("star") || T.symbols[0] : sym("house") || T.symbols[1]).svg())}</span>
          <span><b>${esc(m.label)}</b><small>${esc(m.ages)}</small><em>${esc(m.blurb)}</em></span>
        </button>`).join("")}</div>`;
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
    const voiceBlock = () => `<h3>Sound &amp; voice</h3><button class="ghost small" id="testVoice">Test sound and voice</button>
      <p class="note" style="margin:8px 0 0" id="voiceNote"></p>
      <p class="note" style="margin:6px 0 0">No sound? On iPhone or iPad, turn off Silent mode (the switch on the side, or the bell in Control Centre) and turn the volume up.</p>`;
    function bindVoice(el) {
      const vn = el.querySelector("#voiceNote"); if (!vn) return;
      const set = () => {
        const v = canSpeak ? pickVoice() : null;
        vn.textContent = T.voiceFiles ? "Using the recorded narrator." : !canSpeak ? "This device can't read aloud, so the riddles appear on screen only." :
          v && /(premium|enhanced|natural|neural)/i.test(v.name) ? "Voice: " + v.name + ". Lovely." :
          "Voice: " + (v ? v.name : "default") + ". For a nicer voice on iPhone/iPad: Settings → Accessibility → Spoken Content → Voices → English → English (UK) → Serena (Premium). On Android: Settings → Text-to-speech → Google, English (UK).";
      };
      set(); setTimeout(set, 800);
      const tv = el.querySelector("#testVoice"); if (tv) tv.onclick = () => { play("correct"); setTimeout(() => say([{ key: "test", text: U.testLine }]), 600); };
    }

    function openParent() {
      const rows = T.clues.map((c) => `<li>
          <span class="num">${c.n}</span>
          <span class="where">${esc(c.hideAt)}<small>${isSolved(c.n) ? "Found · " + U.secretLabel + " " + esc(c.letter) : "Not found yet"}</small></span>
          <span class="mini-code">${c.code.map((s) => icon(sym(s).svg())).join("")}</span>
          ${isSolved(c.n) || !state.namesDone ? "" : `<button class="ghost" data-skip="${c.n}">Skip</button>`}
        </li>`).join("");
      const el = sheet(`
        <div class="inner parent">
          <p class="kicker">Grown-ups only</p>
          <h2>Hunt controls</h2>
          ${!state.unlocked && state.setupDone ? `<div class="row"><button class="btn green" id="forceUnlock">Unlock without the password</button></div>` : ""}
          <h3>Who's playing?</h3>
          ${modeButtons(state.mode)}
          <h3>${esc(U.letterName.charAt(0).toUpperCase() + U.letterName.slice(1))}</h3>
          <div class="seg"><button class="${state.paint ? "on" : ""}" data-paint="1">With painting</button><button class="${state.paint ? "" : "on"}" data-paint="0">No painting</button></div>
          <h3>Finders' names</h3>
          <input id="namesEdit" class="text-in" type="text" maxlength="80" placeholder="e.g. Isla, Hela" value="${esc(state.names.join(", "))}">
          <p class="note" style="margin:4px 0 0">Separate names with commas.</p>
          <h3>${esc(U.surpriseHeading)}</h3>
          ${surpriseField()}
          ${voiceBlock()}
          <h3>Clues &amp; codes</h3>
          <p class="note" style="margin:0 0 4px">Lost a card? Every code is below. Skip unlocks a clue without its code.</p>
          <ul class="plist">${rows}</ul>
          <div class="row">
            ${state.namesDone ? `<button class="ghost" id="replayFirst">Replay the first riddle</button>` : ""}
            <button class="ghost danger" id="reset">Reset the hunt</button>
            <button class="btn green" data-close>Done</button>
          </div>
        </div>`, () => render());
      el.querySelectorAll("[data-mode]").forEach((b) => (b.onclick = () => {
        state.mode = b.dataset.mode; save();
        el.querySelectorAll("[data-mode]").forEach((x) => x.classList.toggle("on", x === b));
      }));
      el.querySelectorAll("[data-paint]").forEach((b) => (b.onclick = () => {
        state.paint = b.dataset.paint === "1"; save();
        el.querySelectorAll("[data-paint]").forEach((x) => x.classList.toggle("on", x === b));
      }));
      el.querySelector("#namesEdit").addEventListener("input", (e) => {
        state.names = e.target.value.split(",").map((s) => s.trim().slice(0, 20)).filter(Boolean).slice(0, 4); save();
      });
      bindSurprise(el); bindVoice(el);
      const fu = el.querySelector("#forceUnlock"); if (fu) fu.onclick = () => { el.remove(); state.unlocked = true; save(); render(); };
      const rf = el.querySelector("#replayFirst"); if (rf) rf.onclick = () => { el.remove(); render(); showFirstRiddle(); };
      el.querySelectorAll("[data-skip]").forEach((b) => (b.onclick = () => { el.remove(); solve(T.clues.find((c) => c.n === +b.dataset.skip)); }));
      const r = el.querySelector("#reset");
      let armed = false;
      r.onclick = () => {
        if (!armed) { armed = true; r.textContent = "Tap again to start over"; return; }
        Object.assign(state, { solved: [], unlocked: false, namesDone: false, firstSeen: false, turn: 0 }); save(); el.remove(); render();
      };
    }

    // ---------- Background snowfall: little flakes and dots drifting over the page
    const cv = document.getElementById("snow"), g = cv.getContext("2d");
    let flakes = [];
    const leaves = T.particles === "leaves", leafCols = [P.pumpkin || P.red, P.mustard, P.redDeep, P.tan, P.sage];
    // An autumn leaf: pointed oval with a centre vein.
    function drawLeaf(c, x, y, r, rot, color) {
      c.save(); c.translate(x, y); c.rotate(rot); c.fillStyle = color;
      c.beginPath(); c.moveTo(0, -r); c.quadraticCurveTo(r * 0.75, -r * 0.2, 0, r); c.quadraticCurveTo(-r * 0.75, -r * 0.2, 0, -r); c.fill();
      c.strokeStyle = "rgba(0,0,0,.18)"; c.lineWidth = Math.max(0.6, r * 0.08); c.beginPath(); c.moveTo(0, -r * 0.8); c.lineTo(0, r * 1.25); c.stroke(); c.restore();
    }
    function drawFlake(c, x, y, r, rot, color) {
      c.save(); c.translate(x, y); c.rotate(rot); c.strokeStyle = color; c.lineWidth = Math.max(1, r * 0.18); c.lineCap = "round";
      c.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3, ca = Math.cos(a), sa = Math.sin(a);
        c.moveTo(0, 0); c.lineTo(ca * r, sa * r);
        const bx = ca * r * 0.55, by = sa * r * 0.55, b = r * 0.28;
        c.moveTo(bx, by); c.lineTo(bx + Math.cos(a + 0.7) * b, by + Math.sin(a + 0.7) * b);
        c.moveTo(bx, by); c.lineTo(bx + Math.cos(a - 0.7) * b, by + Math.sin(a - 0.7) * b);
      }
      c.stroke(); c.restore();
    }
    const resize = () => { const r = devicePixelRatio || 1; cv.width = innerWidth * r; cv.height = innerHeight * r; g.setTransform(r, 0, 0, r, 0, 0); };
    const mk = (y) => {
      const star = Math.random() < 0.45;
      return { x: Math.random() * innerWidth, y: y != null ? y : Math.random() * innerHeight, r: star ? 4 + Math.random() * 4 : 1 + Math.random() * 2, star,
        s: 0.25 + Math.random() * 0.5, w: Math.random() * 6.28, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.02, ci: Math.floor(Math.random() * 5) };
    };
    function snowBurst() { if (still) return; for (let i = 0; i < 34; i++) flakes.push(Object.assign(mk(-Math.random() * 240), { s: 2.4 + Math.random() * 2, burst: true, star: true, r: 5 + Math.random() * 4 })); }
    if (!still) {
      resize(); addEventListener("resize", resize);
      for (let i = 0; i < 22; i++) flakes.push(mk());
      (function loop() {
        g.clearRect(0, 0, innerWidth, innerHeight);
        flakes = flakes.filter((f) => {
          f.y += f.s; f.w += 0.02; f.x += Math.sin(f.w) * 0.3; f.rot += f.vr;
          if (f.y > innerHeight + 10) { if (f.burst) return false; Object.assign(f, mk(-10)); }
          const col = f.burst ? P.mustard : "rgba(140,152,190,.6)";
          if (leaves && (f.star || f.burst)) { g.globalAlpha = f.burst ? 1 : 0.55; drawLeaf(g, f.x, f.y, f.r * 1.1, f.rot * 3, f.burst ? leafCols[f.ci % leafCols.length] : leafCols[f.ci % leafCols.length]); g.globalAlpha = 1; }
          else if (leaves) { g.beginPath(); g.arc(f.x, f.y, f.r * 0.8, 0, 6.28); g.fillStyle = "rgba(181,154,102,.35)"; g.fill(); }
          else if (f.star) drawFlake(g, f.x, f.y, f.r, f.rot, col);
          else { g.beginPath(); g.arc(f.x, f.y, f.r, 0, 6.28); g.fillStyle = col; g.fill(); }
          return true;
        });
        requestAnimationFrame(loop);
      })();
    }

    // ---------- The hidden mouse. Every so often he scampers along the bottom or peeks in from the side.
    // Tap him and he squeaks. Kids who keep looking spot him more.
    function mouseSvg(mini) {
      if (critter.kind === "cat") return `<svg viewBox="0 0 70 44" aria-hidden="true" class="${mini ? "mini" : ""}">
        <path class="tail" d="M12 28 C3 26 2 14 7 8 C9 6 12 8 10 11 C8 15 9 20 13 22" fill="none" stroke="${P.ink}" stroke-width="3.8" stroke-linecap="round"/>
        <g class="legs"><ellipse cx="19" cy="39" rx="3.4" ry="4" fill="${P.ink}"/><ellipse cx="27" cy="39" rx="3.4" ry="4" fill="${P.ink}"/><ellipse cx="36" cy="39" rx="3.4" ry="4" fill="${P.ink}"/><ellipse cx="44" cy="39" rx="3.4" ry="4" fill="${P.ink}"/></g>
        <ellipse cx="30" cy="30" rx="17" ry="9" fill="${P.ink}"/>
        <path d="M44 12 L44 2 C45 1 50 5 52 8Z M64 12 L64 2 C63 1 58 5 56 8Z" fill="${P.ink}"/><path d="M45.5 9 L45.6 4.5 L49 7.5Z M62.5 9 L62.4 4.5 L59 7.5Z" fill="${P.pink}"/>
        <ellipse cx="54" cy="18" rx="12.5" ry="11" fill="${P.ink}"/>
        <ellipse cx="49" cy="18" rx="3.4" ry="3.8" fill="${P.mustard}"/><ellipse cx="59" cy="18" rx="3.4" ry="3.8" fill="${P.mustard}"/>
        <ellipse cx="49.2" cy="18.4" rx="2.3" ry="2.9" fill="${P.roofLine}"/><ellipse cx="58.8" cy="18.4" rx="2.3" ry="2.9" fill="${P.roofLine}"/>
        <circle cx="50.2" cy="16.8" r="1.1" fill="#fff"/><circle cx="59.8" cy="16.8" r="1.1" fill="#fff"/>
        <ellipse cx="45" cy="23" rx="2.2" ry="1.3" fill="${P.pink}" opacity=".9"/><ellipse cx="63" cy="23" rx="2.2" ry="1.3" fill="${P.pink}" opacity=".9"/>
        <path d="M51.5 23.5 Q52.7 25 54 23.5 Q55.3 25 56.5 23.5" stroke="${P.cream}" stroke-width=".9" fill="none" stroke-linecap="round"/>
        <path d="M20 25 Q30 29 40 25" stroke="${P.red}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      </svg>`;
      if (critter.kind === "bat") return `<svg viewBox="0 0 70 44" aria-hidden="true" class="${mini ? "mini" : ""}">
        <g class="legs wings"><path d="M35 22 C28 10 16 6 4 12 C10 14 12 18 12 22 C17 18 22 19 25 24 C28 21 32 21 35 24Z" fill="${P.navyDeep}"/>
        <path d="M35 22 C42 10 54 6 66 12 C60 14 58 18 58 22 C53 18 48 19 45 24 C42 21 38 21 35 24Z" fill="${P.navyDeep}"/></g>
        <ellipse cx="35" cy="24" rx="8" ry="9" fill="${P.navyDeep}"/><path d="M29 17 l1 -7 4 5Z M41 17 l-1 -7 -4 5Z" fill="${P.navyDeep}"/>
        <circle cx="32" cy="22" r="2.2" fill="${P.mustard}"/><circle cx="38" cy="22" r="2.2" fill="${P.mustard}"/><path d="M33 28 l1 2 1 -2 1 2 1 -2" stroke="${P.cream}" stroke-width=".9" fill="none"/>
      </svg>`;
      const body = "#a1958c", dark = "#6f655e";
      return `<svg viewBox="0 0 70 44" aria-hidden="true" class="${mini ? "mini" : ""}">
        <path class="tail" d="M12 30 C2 30 0 20 6 16 C9 14 10 18 7 20" fill="none" stroke="${P.tan}" stroke-width="2.6" stroke-linecap="round"/>
        <g class="legs"><ellipse cx="22" cy="38" rx="4" ry="2.6" fill="${dark}"/><ellipse cx="38" cy="38" rx="4" ry="2.6" fill="${dark}"/></g>
        <ellipse cx="30" cy="28" rx="19" ry="11.5" fill="${body}"/>
        <path d="M44 20 C52 16 60 20 66 25 C60 29 52 32 44 30Z" fill="${body}"/>
        <circle cx="66" cy="25" r="2.6" fill="${P.red}"/>
        <circle cx="45" cy="13" r="7" fill="${body}"/><circle cx="45" cy="13" r="4.2" fill="${P.pink}"/>
        <circle cx="54" cy="21" r="1.9" fill="${P.ink}"/><circle cx="54.6" cy="20.4" r=".6" fill="#fff"/>
        <path d="M62 26 L70 24 M62 27 L70 29" stroke="${dark}" stroke-width=".8" stroke-linecap="round"/>
        <path d="M34 19 C38 24 44 25 48 22" fill="none" stroke="${P.red}" stroke-width="3.4" stroke-linecap="round"/>
        <path d="M37 22 L34 30" stroke="${P.red}" stroke-width="3" stroke-linecap="round"/>
      </svg>`;
    }
    (function mouse() {
      // He lives in the scenery (the snowy hill at the top, the pine trees at the bottom), so he never covers buttons.
      const lane = document.createElement("div"); lane.className = "mouse-lane"; lane.hidden = true;
      const m = document.createElement("button");
      m.className = "mouse"; m.type = "button"; m.setAttribute("aria-label", critter.label);
      if (critter.kind === "bat") m.classList.add("bat");
      m.innerHTML = `<span class="body">${mouseSvg()}</span><span class="squeak">${esc(critter.sound)}</span>`;
      lane.appendChild(m); document.body.appendChild(lane);
      let anim = null, busy = false, dir = 1, W = 0, peeking = false;
      const blocked = () => document.hidden || document.querySelector(".sheet, .finale");
      function schedule(ms) { setTimeout(appear, ms != null ? ms : 14000 + Math.random() * 16000); }
      function done() { busy = false; lane.hidden = true; m.classList.remove("running", "caught"); schedule(); }
      function spot() {
        const els = [...document.querySelectorAll(".hero, .foot-art")].map((e) => ({ e, r: e.getBoundingClientRect() }))
          .filter(({ r }) => r.height > 20 && r.bottom > 50 && r.top < innerHeight - 30);
        return els.length ? els[Math.floor(Math.random() * els.length)] : null;
      }
      function appear() {
        if (blocked()) return schedule(5000);
        const s = spot(); if (!s) return schedule(6000);
        const r = s.r, hero = s.e.classList.contains("hero");
        W = r.width;
        Object.assign(lane.style, { left: r.left + scrollX + "px", top: r.bottom + scrollY - (hero ? 104 : 96) + "px", width: W + "px" });
        busy = true; lane.hidden = false;
        peeking = still || (hero && Math.random() < 0.4);
        dir = Math.random() < 0.5 ? 1 : -1;
        m.style.setProperty("--dir", dir);
        m.style.transform = "";
        if (peeking) {
          // peek in from the edge of the scene, have a look around, then retreat
          const fromLeft = dir === 1, start = fromLeft ? -70 : W, out = fromLeft ? 46 : -46;
          m.style.left = start + "px";
          anim = still
            ? m.animate([{ opacity: 0, transform: `translateX(${out}px) scaleX(${dir})` }, { opacity: 1, offset: 0.15 }, { opacity: 1, offset: 0.85 }, { opacity: 0, transform: `translateX(${out}px) scaleX(${dir})` }], { duration: 3200, fill: "both" })
            : m.animate([
                { transform: `translateX(0) scaleX(${dir})` },
                { transform: `translateX(${out}px) scaleX(${dir})`, offset: 0.18 },
                { transform: `translateX(${out}px) scaleX(${dir})`, offset: 0.82 },
                { transform: `translateX(0) scaleX(${dir})` }], { duration: 3000, easing: "ease-in-out", fill: "both" });
        } else {
          // scamper across, stop for a sniff in the middle, then dash off
          m.style.left = (dir === 1 ? -80 : W + 10) + "px";
          const dist = (W + 90) * dir, dur = Math.max(3200, Math.min(6000, W * 12));
          m.classList.add("running");
          anim = m.animate([
            { transform: `translateX(0) scaleX(${dir})` },
            { transform: `translateX(${dist * 0.45}px) scaleX(${dir})`, offset: 0.38 },
            { transform: `translateX(${dist * 0.47}px) scaleX(${dir})`, offset: 0.62 },
            { transform: `translateX(${dist}px) scaleX(${dir})` }], { duration: dur, easing: "linear", fill: "both" });
          setTimeout(() => busy && m.classList.remove("running"), dur * 0.38);
          setTimeout(() => busy && m.classList.add("running"), dur * 0.62);
        }
        anim.onfinish = done;
      }
      m.addEventListener("click", () => {
        if (!busy || m.classList.contains("caught")) return;
        if (critter.file && !state.muted) { const a = new Audio(`audio/${T.id}/${critter.file}?v=${T.audioVersion || 1}`); a.play().catch(() => play(critter.preset || "squeak")); }
        else play(critter.preset || "squeak");
        if (navigator.vibrate) navigator.vibrate(20);
        m.classList.add("caught");
        state.mice = (state.mice || 0) + 1; save();
        const mc = document.getElementById("miceCount"); if (mc) { mc.hidden = false; mc.querySelector("span").textContent = state.mice; }
        const cur = new DOMMatrix(getComputedStyle(m).transform).m41;
        anim.onfinish = null; anim.cancel();
        m.style.transform = `translateX(${cur}px) scaleX(${dir})`;
        // hop, then dash off
        setTimeout(() => {
          m.classList.add("running");
          const fd = peeking ? -dir : dir;
          const away = peeking ? cur - dir * 160 : cur + dir * (W + 160);
          anim = m.animate([{ transform: `translateX(${cur}px) scaleX(${fd})` }, { transform: `translateX(${away}px) scaleX(${fd})` }], { duration: 700, easing: "ease-in", fill: "both" });
          anim.onfinish = done;
        }, 650);
      });
      schedule(7000);
    })();

    function flake() {
      let a = "";
      for (let i = 0; i < 6; i++) a += `<g transform="rotate(${i * 60} 50 50)"><path d="M50 50 V10 M50 26 L40 18 M50 26 L60 18" stroke="${P.navy}" stroke-width="7" stroke-linecap="round" fill="none"/></g>`;
      return a + `<circle cx="50" cy="50" r="8" fill="${P.red}"/>`;
    }
    function padlockSvg() {
      return `<svg viewBox="0 0 120 130" aria-hidden="true">
        <path class="shackle" d="M34 62 V40 C34 20 48 10 60 10 C72 10 86 20 86 40 V62" fill="none" stroke="${P.tan}" stroke-width="11" stroke-linecap="round"/>
        <rect x="18" y="56" width="84" height="66" rx="12" fill="${P.red}"/>
        <rect x="18" y="56" width="84" height="12" rx="6" fill="${P.redDeep}" opacity=".35"/>
        <path d="M28 98 l6 -6 6 6 6 -6 6 6 6 -6 6 6 6 -6 6 6 6 -6 6 6 6 -6" fill="none" stroke="${P.cream}" stroke-width="2.4" opacity=".7"/>
        <circle cx="60" cy="82" r="8" fill="${P.navyDeep}"/><rect x="56.5" y="84" width="7" height="14" rx="3" fill="${P.navyDeep}"/>
        <circle cx="30" cy="68" r="3" fill="${P.cream}" opacity=".5"/>
      </svg>`;
    }
    function iconSound() { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"/></svg>'; }
    function iconMute() { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>'; }
    function iconKey() { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="8" cy="12" r="4"/><path d="M12 12h9M18 12v3M21 12v2"/></svg>'; }

    render();
    if (state.unlocked && state.namesDone && !state.firstSeen) showFirstRiddle();
  }
})();
