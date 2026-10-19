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

  // Night-sky village scene (the hero art). Width/height are viewBox units; the SVG scales to its box.
  M.village = function (P, { w = 1200, h = 380, seed = 4, houses = 9, trees = 16, moon = true } = {}) {
    const rnd = M.rand(seed);
    const hillBack = (x) => h * 0.64 + Math.sin(x / w * 5.2 + 1.3) * h * 0.04;
    const hillFront = (x) => h * 0.8 + Math.sin(x / w * 3.4 + 0.2) * h * 0.035;
    const path = (fn) => { let d = `M0 ${h} L0 ${fn(0).toFixed(1)}`; for (let x = 0; x <= w; x += 20) d += ` L${x} ${fn(x).toFixed(1)}`; return d + ` L${w} ${h}Z`; };
    let s = `<rect width="${w}" height="${h}" fill="${P.navy}"/>`;
    for (let i = 0; i < (w * h) / 2600; i++) {
      const x = rnd() * w, y = rnd() * h * 0.66, r = 0.8 + rnd() * 1.8;
      if (rnd() < 0.12) s += `<path d="M${x} ${y - r * 3} L${x + r * 0.7} ${y - r * 0.7} L${x + r * 3} ${y} L${x + r * 0.7} ${y + r * 0.7} L${x} ${y + r * 3} L${x - r * 0.7} ${y + r * 0.7} L${x - r * 3} ${y} L${x - r * 0.7} ${y - r * 0.7}Z" fill="${P.cream}" opacity=".9"/>`;
      else s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${P.cream}" opacity="${(0.45 + rnd() * 0.5).toFixed(2)}"/>`;
    }
    if (moon) { const mx = w * 0.84, my = h * 0.2, mr = h * 0.075; s += `<circle cx="${mx}" cy="${my}" r="${mr}" fill="${P.cream}"/><circle cx="${mx + mr * 0.45}" cy="${my - mr * 0.18}" r="${mr * 0.92}" fill="${P.navy}"/>`; }
    s += `<path d="${path(hillBack)}" fill="${P.snowBack}"/>`;
    const walls = [P.pink, P.mint, P.sky, P.butter];
    const items = [];
    for (let i = 0; i < houses; i++) { const x = (i + 0.2 + rnd() * 0.6) * (w / houses); items.push({ t: "h", x, back: rnd() < 0.55 }); }
    for (let i = 0; i < trees; i++) { const x = rnd() * w; items.push({ t: "p", x, back: rnd() < 0.5 }); }
    items.sort((a, b) => (a.back === b.back ? 0 : a.back ? -1 : 1));
    let front = "";
    items.forEach((it, i) => {
      const fn = it.back ? hillBack : hillFront, k = it.back ? 0.72 : 1;
      if (!it.back && !front) { s += `<path d="${path(hillFront)}" fill="${P.snow}"/>`; front = "1"; }
      if (it.t === "h") s += M.house(it.x, fn(it.x) + 4, (40 + rnd() * 14) * k * (h / 300), walls[i % walls.length], P, rnd);
      else s += M.pine(it.x, fn(it.x) + 3, (52 + rnd() * 56) * k * (h / 300), P.pine, P.roof);
    });
    if (!front) s += `<path d="${path(hillFront)}" fill="${P.snow}"/>`;
    for (let i = 0; i < 40; i++) { const x = rnd() * w; s += `<circle cx="${x.toFixed(0)}" cy="${(hillFront(x) + 10 + rnd() * (h - hillFront(x) - 12)).toFixed(0)}" r="1.4" fill="${P.lilac}" opacity=".7"/>`; }
    return `<svg class="village" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMax slice" aria-hidden="true">${s}</svg>`;
  };

  // A row of pines on snow — used as a footer band.
  M.pineRow = function (P, { w = 1200, h = 70, seed = 9 } = {}) {
    const rnd = M.rand(seed);
    let s = `<rect width="${w}" height="${h}" fill="${P.snow}"/>`;
    for (let x = 14; x < w; x += 26 + rnd() * 22) s += M.pine(x, h - 6, h * (0.5 + rnd() * 0.42), rnd() < 0.3 ? P.sage : P.pine, P.roof);
    s += `<rect y="${h - 7}" width="${w}" height="7" fill="${P.snow}"/>`;
    return `<svg class="pines" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMax slice" aria-hidden="true">${s}</svg>`;
  };

  // Small sprig divider: two leaves and a berry.
  M.sprig = function (P) {
    return `<svg class="sprig" viewBox="0 0 120 24" aria-hidden="true">
      <path d="M8 12 H44 M76 12 H112" stroke="${P.tan}" stroke-width="1.2"/>
      <path d="M60 12 C52 4 44 6 42 12 C44 18 52 20 60 12Z" fill="${P.pine}"/>
      <path d="M60 12 C68 4 76 6 78 12 C76 18 68 20 60 12Z" fill="${P.sage}"/>
      <circle cx="60" cy="12" r="4" fill="${P.red}"/></svg>`;
  };

  window.Motifs = M;
})();
