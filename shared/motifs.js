/* Shared folk-art drawing helpers, used by both the web app and the printables.
   Everything is generated SVG: crisp at any size, no image files, identical in app and print.
   Colours come from the active theme's palette (passed in as P). */
(function () {
  const M = {};

  // Deterministic pseudo-random numbers so the "hand-made" scatter is identical every render.
  M.rand = function (seed) {
    let s = (seed * 9301 + 49297) % 233280;
    return function () { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  };

  // A painted-looking pine: stacked tiers with soft, slightly ragged edges.
  M.pine = function (x, base, h, color, trunk) {
    const w = h * 0.52, tiers = 3;
    let out = `<rect x="${(x - h * 0.03).toFixed(1)}" y="${(base - h * 0.12).toFixed(1)}" width="${(h * 0.06).toFixed(1)}" height="${(h * 0.12).toFixed(1)}" fill="${trunk}"/>`;
    for (let i = 0; i < tiers; i++) {
      const top = base - h + (i * h * 0.26);
      const bot = base - h * 0.1 - (tiers - 1 - i) * h * 0.18;
      const half = (w / 2) * (0.55 + i * 0.22);
      out += `<path d="M${x} ${top.toFixed(1)} L${(x + half).toFixed(1)} ${bot.toFixed(1)} Q${(x + half * 0.4).toFixed(1)} ${(bot - h * 0.04).toFixed(1)} ${x} ${(bot + h * 0.015).toFixed(1)} Q${(x - half * 0.4).toFixed(1)} ${(bot - h * 0.04).toFixed(1)} ${(x - half).toFixed(1)} ${bot.toFixed(1)}Z" fill="${color}"/>`;
    }
    return out;
  };

  // A little folk house: coloured walls, brown roof, navy windows, chimney.
  M.house = function (x, base, s, wall, P, rnd) {
    const w = s, h = s * (0.9 + rnd() * 0.5), roofH = s * 0.42;
    const top = base - h;
    const tall = h > s * 1.15;
    let out = `<rect x="${x + w * 0.62}" y="${top - roofH * 0.75}" width="${w * 0.12}" height="${roofH * 0.6}" fill="${P.roof}"/>`;
    out += `<rect x="${x}" y="${top}" width="${w}" height="${h}" fill="${wall}"/>`;
    out += `<path d="M${x - w * 0.08} ${top + 1} L${x + w / 2} ${top - roofH} L${x + w * 1.08} ${top + 1}Z" fill="${P.roof}"/>`;
    out += `<path d="M${x + w * 0.18} ${top - roofH * 0.3} L${x + w / 2} ${top - roofH * 0.86} M${x + w * 0.82} ${top - roofH * 0.3} L${x + w / 2} ${top - roofH * 0.86}" stroke="${P.roofLine}" stroke-width="${s * 0.03}" opacity=".6"/>`;
    const rows = tall ? 2 : 1, cols = 2;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const wx = x + w * (0.16 + c * 0.48), wy = top + h * (0.14 + r * 0.32);
      out += `<rect x="${wx}" y="${wy}" width="${w * 0.2}" height="${h * 0.16}" fill="${P.window}"/><path d="M${wx + w * 0.1} ${wy} V${wy + h * 0.16}" stroke="${wall}" stroke-width="${s * 0.025}"/>`;
    }
    out += `<path d="M${x + w * 0.4} ${base} V${base - h * 0.26} Q${x + w * 0.5} ${base - h * 0.34} ${x + w * 0.6} ${base - h * 0.26} V${base}Z" fill="${P.roof}"/>`;
    return out;
  };


  // ---- Spooky-village helpers (Halloween and other night themes). Turned on with P.sceneKind = "spooky".
  // A bare, twisty tree: trunk plus forked branches, all strokes so it stays light on ink.
  M.bareTree = function (x, base, h, color, rnd) {
    const sw = Math.max(1.2, h * 0.05);
    let d = `M${x} ${base} C${x - h * 0.03} ${base - h * 0.35} ${x + h * 0.04} ${base - h * 0.6} ${x} ${base - h * 0.78}`;
    const br = (bx, by, len, ang, depth) => {
      const ex = bx + Math.cos(ang) * len, ey = by + Math.sin(ang) * len;
      d += ` M${bx.toFixed(1)} ${by.toFixed(1)} Q${((bx + ex) / 2 + len * 0.15).toFixed(1)} ${((by + ey) / 2).toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`;
      if (depth > 0) { br(ex, ey, len * 0.6, ang - 0.5 - rnd() * 0.3, depth - 1); br(ex, ey, len * 0.55, ang + 0.45 + rnd() * 0.3, depth - 1); }
    };
    br(x, base - h * 0.45, h * 0.32, -2.4 - rnd() * 0.3, 1);
    br(x, base - h * 0.55, h * 0.3, -0.7 + rnd() * 0.3, 1);
    br(x, base - h * 0.78, h * 0.24, -1.9 + rnd() * 0.4, 1);
    br(x, base - h * 0.78, h * 0.22, -1.1 + rnd() * 0.3, 1);
    return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${sw.toFixed(1)}" stroke-linecap="round"/>`;
  };
  // A folk pumpkin. lit = carved face glowing.
  M.pumpkin = function (cx, base, s, P, lit) {
    const r = s / 2, cy = base - r * 0.82, c = P.pumpkin || P.red, dk = P.redDeep;
    let o = `<path d="M${cx} ${cy - r * 0.78} q${r * 0.08} ${-r * 0.32} ${r * 0.3} ${-r * 0.42}" stroke="${P.pine}" stroke-width="${(r * 0.16).toFixed(1)}" fill="none" stroke-linecap="round"/>`;
    o += `<ellipse cx="${cx - r * 0.42}" cy="${cy}" rx="${r * 0.58}" ry="${r * 0.82}" fill="${c}"/><ellipse cx="${cx + r * 0.42}" cy="${cy}" rx="${r * 0.58}" ry="${r * 0.82}" fill="${c}"/>`;
    o += `<ellipse cx="${cx}" cy="${cy}" rx="${r * 0.55}" ry="${r * 0.86}" fill="${c}"/><path d="M${cx - r * 0.3} ${cy - r * 0.7} Q${cx - r * 0.42} ${cy} ${cx - r * 0.3} ${cy + r * 0.72} M${cx + r * 0.3} ${cy - r * 0.7} Q${cx + r * 0.42} ${cy} ${cx + r * 0.3} ${cy + r * 0.72}" stroke="${dk}" stroke-width="${(r * 0.05).toFixed(1)}" fill="none" opacity=".45"/>`;
    if (lit) {
      const f = P.mustard;
      o += `<path d="M${cx - r * 0.5} ${cy - r * 0.12} l${r * 0.17} ${-r * 0.3} ${r * 0.17} ${r * 0.3}Z M${cx + r * 0.16} ${cy - r * 0.12} l${r * 0.17} ${-r * 0.3} ${r * 0.17} ${r * 0.3}Z" fill="${f}"/>`;
      o += `<path d="M${cx - r * 0.55} ${cy + r * 0.18} Q${cx} ${cy + r * 0.7} ${cx + r * 0.55} ${cy + r * 0.18} l${-r * 0.18} ${r * 0.12} ${-r * 0.12} ${-r * 0.1} ${-r * 0.12} ${r * 0.12} ${-r * 0.12} ${-r * 0.1} ${-r * 0.12} ${r * 0.12} ${-r * 0.12} ${-r * 0.1}Z" fill="${f}"/>`;
    }
    return o;
  };
  // A little flying bat (a "w" with ears), centred on x,y.
  M.bat = function (x, y, s, color) {
    return `<path transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${(s / 40).toFixed(3)})" d="M0 -4 l-3 -6 -2 5 C-10 -9 -18 -8 -24 -2 C-19 -2 -17 1 -16 4 C-12 0 -8 1 -6 4 C-4 1 -2 1 0 2 C2 1 4 1 6 4 C8 1 12 0 16 4 C17 1 19 -2 24 -2 C18 -8 10 -9 5 -5 l-2 -5 -3 6Z" fill="${color}"/>`;
  };

  // Night-sky village scene (the hero art). Width/height are viewBox units; the SVG scales to its box.
  // inkSaver: a colour (e.g. "#fff") = print version — no night sky, just a few stars, so it uses far less ink.
  M.village = function (P, { w = 1200, h = 380, seed = 4, houses = 9, trees = 16, moon = true, inkSaver = null, nightLite = false } = {}) {
    const rnd = M.rand(seed);
    const hillBack = (x) => h * 0.64 + Math.sin(x / w * 5.2 + 1.3) * h * 0.04;
    const hillFront = (x) => h * 0.8 + Math.sin(x / w * 3.4 + 0.2) * h * 0.035;
    const path = (fn) => { let d = `M0 ${h} L0 ${fn(0).toFixed(1)}`; for (let x = 0; x <= w; x += 20) d += ` L${x} ${fn(x).toFixed(1)}`; return d + ` L${w} ${h}Z`; };
    const sky = inkSaver || P.navy, starC = inkSaver ? P.tan : P.cream;
    let s = inkSaver ? "" : `<rect width="${w}" height="${h}" fill="${P.navy}"/>`;
    // nightLite = print version WITH a night sky: navy at the top that fades to white paper before the hills (about half the ink).
    if (nightLite) { const gid = `nl${seed}_${w}_${h}`; s = `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.navy}"/><stop offset=".22" stop-color="${P.navy}"/><stop offset=".6" stop-color="${P.navy}" stop-opacity="0"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#${gid})"/>`; }
    for (let i = 0; i < (w * h) / (inkSaver ? 9000 : nightLite ? 4200 : 2600); i++) {
      const x = rnd() * w, y = rnd() * h * (nightLite ? 0.4 : 0.66), r = 0.8 + rnd() * 1.8;
      if (rnd() < 0.12) s += `<path d="M${x} ${y - r * 3} L${x + r * 0.7} ${y - r * 0.7} L${x + r * 3} ${y} L${x + r * 0.7} ${y + r * 0.7} L${x} ${y + r * 3} L${x - r * 0.7} ${y + r * 0.7} L${x - r * 3} ${y} L${x - r * 0.7} ${y - r * 0.7}Z" fill="${starC}" opacity=".9"/>`;
      else s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${starC}" opacity="${(0.45 + rnd() * 0.5).toFixed(2)}"/>`;
    }
    if (moon) { const mx = w * 0.84, my = h * 0.2, mr = h * 0.075; s += `<circle cx="${mx}" cy="${my}" r="${mr}" fill="${inkSaver ? P.mustard : P.cream}"/><circle cx="${mx + mr * 0.45}" cy="${my - mr * 0.18}" r="${mr * 0.92}" fill="${sky}"/>`; }
    s += `<path d="${path(hillBack)}" fill="${P.snowBack}"/>`;
    const spooky = P.sceneKind === "spooky";
    if (spooky && !inkSaver) for (let i = 0; i < Math.max(2, Math.round(w / 260)); i++) s += M.bat(w * (0.1 + rnd() * 0.65), h * (0.1 + rnd() * 0.3), h * (0.07 + rnd() * 0.05), P.navyDeep);
    const walls = spooky ? [P.lilac, P.sage, P.butter, P.pink] : [P.pink, P.mint, P.sky, P.butter];
    const items = [];
    for (let i = 0; i < houses; i++) { const x = (i + 0.2 + rnd() * 0.6) * (w / houses); items.push({ t: "h", x, back: rnd() < 0.55 }); }
    for (let i = 0; i < trees; i++) { const x = rnd() * w; items.push({ t: "p", x, back: rnd() < 0.5 }); }
    items.sort((a, b) => (a.back === b.back ? 0 : a.back ? -1 : 1));
    let front = "";
    items.forEach((it, i) => {
      const fn = it.back ? hillBack : hillFront, k = it.back ? 0.72 : 1;
      if (!it.back && !front) { s += `<path d="${path(hillFront)}" fill="${P.snow}"/>`; front = "1"; }
      if (it.t === "h") {
        const hs = M.house(it.x, fn(it.x) + 4, (40 + rnd() * 14) * k * (h / 300), walls[i % walls.length], P, rnd);
        s += spooky ? `<g transform="rotate(${((rnd() - 0.5) * 7).toFixed(1)} ${it.x.toFixed(0)} ${fn(it.x).toFixed(0)})">${hs}</g>` : hs;
      } else if (spooky) {
        if (rnd() < 0.62) s += M.bareTree(it.x, fn(it.x) + 3, (46 + rnd() * 50) * k * (h / 300), P.pine, rnd);
        else s += M.pumpkin(it.x, fn(it.x) + 3, (12 + rnd() * 8) * k * (h / 300), P, !it.back);
      } else s += M.pine(it.x, fn(it.x) + 3, (52 + rnd() * 56) * k * (h / 300), P.pine, P.roof);
    });
    if (!front) s += `<path d="${path(hillFront)}" fill="${P.snow}"/>`;
    if (!spooky) for (let i = 0; i < 40; i++) { const x = rnd() * w; s += `<circle cx="${x.toFixed(0)}" cy="${(hillFront(x) + 10 + rnd() * (h - hillFront(x) - 12)).toFixed(0)}" r="1.4" fill="${P.lilac}" opacity=".7"/>`; }
    return `<svg class="village" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMax slice" aria-hidden="true">${s}</svg>`;
  };

  // A row of pines on snow — used as a footer band.
  M.pineRow = function (P, { w = 1200, h = 70, seed = 9 } = {}) {
    const rnd = M.rand(seed);
    let s = `<rect width="${w}" height="${h}" fill="${P.snow}"/>`;
    if (P.sceneKind === "spooky") {
      // crooked picket fence with pumpkins and bare shrubs
      s += `<path d="M0 ${h * 0.52} H${w} M0 ${h * 0.78} H${w}" stroke="${P.roofLine}" stroke-width="2.4" opacity=".55"/>`;
      for (let x = 6; x < w; x += 15 + rnd() * 4) { const t = h * (0.32 + rnd() * 0.12), lean = (rnd() - 0.5) * 6; s += `<path d="M${x} ${h - 6} L${x + lean * 0.3} ${t + 5} L${x + 3 + lean * 0.3} ${t} L${x + 6 + lean * 0.3} ${t + 5} L${x + 6} ${h - 6}Z" fill="${P.roofLine}" opacity=".55"/>`; }
      for (let x = 20; x < w; x += 70 + rnd() * 90) s += rnd() < 0.55 ? M.pumpkin(x, h - 4, h * (0.32 + rnd() * 0.16), P, rnd() < 0.6) : M.bareTree(x, h - 4, h * (0.55 + rnd() * 0.3), P.pine, rnd);
      return `<svg class="pines" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMax slice" aria-hidden="true">${s}</svg>`;
    }
    for (let x = 14; x < w; x += 26 + rnd() * 22) s += M.pine(x, h - 6, h * (0.5 + rnd() * 0.42), rnd() < 0.3 ? P.sage : P.pine, P.roof);
    s += `<rect y="${h - 7}" width="${w}" height="7" fill="${P.snow}"/>`;
    return `<svg class="pines" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMax slice" aria-hidden="true">${s}</svg>`;
  };

  // Small sprig divider: two leaves and a berry.
  M.sprig = function (P) {
    if (P.sceneKind === "spooky") return `<svg class="sprig" viewBox="0 0 120 24" aria-hidden="true">
      <path d="M8 12 H40 M80 12 H112" stroke="${P.tan}" stroke-width="1.2"/>${M.bat(60, 13, 30, P.purple || P.navy)}
      <path d="M46 8 l1 2.4 2.4 1 -2.4 1 -1 2.4 -1 -2.4 -2.4 -1 2.4 -1Z M74 8 l1 2.4 2.4 1 -2.4 1 -1 2.4 -1 -2.4 -2.4 -1 2.4 -1Z" fill="${P.mustard}"/></svg>`;
    return `<svg class="sprig" viewBox="0 0 120 24" aria-hidden="true">
      <path d="M8 12 H44 M76 12 H112" stroke="${P.tan}" stroke-width="1.2"/>
      <path d="M60 12 C52 4 44 6 42 12 C44 18 52 20 60 12Z" fill="${P.pine}"/>
      <path d="M60 12 C68 4 76 6 78 12 C76 18 68 20 60 12Z" fill="${P.sage}"/>
      <circle cx="60" cy="12" r="4" fill="${P.red}"/></svg>`;
  };

  window.Motifs = M;
})();
