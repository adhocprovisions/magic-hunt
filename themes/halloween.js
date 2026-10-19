/* THEME: Halloween Magic Hunt
   One file = one complete theme. The web app AND the printables both read from this file.
   Story: Hazel, a good witch from the spooky village of Hollowmoor, needs help. A grumpy old ghost has cursed
   the village, and the pumpkins won't glow. The ten words of her spell have blown into your house. */
(function () {
  // ---- Palette: moonlit folk art. Deep purple night, pumpkin orange, olive, parchment.
  const P = {
    sceneKind: "spooky", // tells the shared drawing helpers to draw crooked houses, bare trees, pumpkins and bats
    paper: "#f3ebdc", card: "#fbf6ec", ink: "#2b2433", inkSoft: "#6b6170",
    navy: "#241b3b", navyDeep: "#17112a",
    red: "#e0702b", redDeep: "#a94a17",
    pine: "#3b3a33", sage: "#8f9e72", tan: "#b59a66", roof: "#5a4757", roofLine: "#3a2d3b",
    pink: "#e3a9a0", mint: "#c3cfa6", sky: "#aba5cc", butter: "#ead7a2", lilac: "#a99bc0",
    mustard: "#f2b23a", window: "#f2b23a",
    cream: "#f7f0e2", snow: "#f3ebdc", snowBack: "#e5d9c2",
    pumpkin: "#e8772d", purple: "#6c5394", green: "#7f9a4c", slime: "#a9c95a", ghost: "#fdfaf3",
  };
  const M = () => window.Motifs;

  const ghostSvg = (stroke) => `<path d="M24 92 V46 C24 24 36 10 50 10 C64 10 76 24 76 46 V92 L67 84 L58 92 L50 84 L42 92 L33 84Z" fill="${P.ghost}" stroke="${stroke}" stroke-width="3.5" stroke-linejoin="round"/>
      <ellipse cx="41" cy="44" rx="5" ry="7" fill="${P.ink}"/><ellipse cx="59" cy="44" rx="5" ry="7" fill="${P.ink}"/><ellipse cx="50" cy="62" rx="6" ry="7.5" fill="${P.ink}"/>`;
  const cauldronSvg = (inside) => `<path d="M28 88 l-6 8 M72 88 l6 8" stroke="${P.ink}" stroke-width="6" stroke-linecap="round"/>
      <path d="M14 46 H86 C88 74 72 92 50 92 C28 92 12 74 14 46Z" fill="${P.ink}"/>
      <rect x="8" y="40" width="84" height="12" rx="6" fill="${P.roof}"/>
      ${inside || `<circle cx="38" cy="36" r="8" fill="${P.slime}"/><circle cx="56" cy="30" r="10" fill="${P.slime}"/><circle cx="70" cy="38" r="6" fill="${P.slime}"/><circle cx="46" cy="20" r="4" fill="${P.slime}" opacity=".8"/>`}
      <path d="M26 64 Q30 78 42 84" stroke="${P.cream}" stroke-width="3" fill="none" opacity=".25" stroke-linecap="round"/>`;
  const candyInside = () => `<rect x="24" y="22" width="18" height="12" rx="5" fill="${P.pink}" transform="rotate(-18 33 28)"/><circle cx="54" cy="24" r="9" fill="${P.slime}"/><path d="M48 24 h12" stroke="${P.cream}" stroke-width="2"/>
      <path d="M64 36 L72 18 L80 36Z" fill="${P.mustard}"/><path d="M66 31 h12" stroke="${P.pumpkin}" stroke-width="4"/><circle cx="40" cy="36" r="7" fill="${P.purple}"/><rect x="58" y="30" width="16" height="10" rx="4" fill="${P.red}"/>`;
  const eyes = (x, y, s = 1) => `<ellipse cx="${x}" cy="${y}" rx="${4 * s}" ry="${3 * s}" fill="${P.mustard}"/><ellipse cx="${x + 12 * s}" cy="${y}" rx="${4 * s}" ry="${3 * s}" fill="${P.mustard}"/><circle cx="${x + 1 * s}" cy="${y}" r="${1.4 * s}" fill="${P.ink}"/><circle cx="${x + 13 * s}" cy="${y}" r="${1.4 * s}" fill="${P.ink}"/>`;

  // ---- 8 keypad symbols. Different SHAPE and COLOUR so 3-year-olds can match them.
  const symbols = [
    { id: "pumpkin", name: "Pumpkin", svg: () => M().pumpkin(50, 92, 82, P, false) },
    { id: "bat", name: "Bat", svg: () => M().bat(50, 54, 82, P.purple) + `<circle cx="46" cy="50" r="2.4" fill="${P.mustard}"/><circle cx="54" cy="50" r="2.4" fill="${P.mustard}"/>` },
    { id: "ghost", name: "Ghost", svg: () => ghostSvg(P.ink) },
    { id: "cat", name: "Cat", svg: () => `<path d="M30 92 C24 70 28 54 38 46 L34 22 L46 34 H54 L66 22 L62 46 C72 54 76 70 70 92Z" fill="${P.ink}"/>
      <path d="M70 90 C86 88 92 76 86 66" stroke="${P.ink}" stroke-width="7" fill="none" stroke-linecap="round"/>${eyes(38, 50, 1.1)}<path d="M47 60 l3 3 3 -3" fill="${P.pink}"/>` },
    { id: "moon", name: "Moon", svg: () => `<path d="M62 10 C36 12 20 34 22 56 C24 78 44 94 66 90 C48 84 38 68 38 50 C38 32 48 18 62 10Z" fill="${P.mustard}"/>
      <path d="M74 30 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3Z" fill="${P.mustard}"/><circle cx="34" cy="44" r="4" fill="${P.tan}" opacity=".5"/><circle cx="36" cy="66" r="3" fill="${P.tan}" opacity=".5"/>` },
    { id: "hat", name: "Witch's hat", svg: () => `<path d="M50 8 C56 30 62 50 70 72 H30 C40 52 46 30 50 8Z" fill="${P.green}"/><path d="M50 8 C44 12 40 14 34 12" stroke="${P.green}" stroke-width="6" fill="none" stroke-linecap="round"/>
      <ellipse cx="50" cy="76" rx="44" ry="10" fill="${P.green}"/><path d="M32 64 H68 L71 72 H29Z" fill="${P.purple}"/><rect x="45" y="63" width="10" height="10" fill="none" stroke="${P.mustard}" stroke-width="3"/>` },
    { id: "candy", name: "Candy", svg: () => `<path d="M30 50 L10 34 V66Z M70 50 L90 34 V66Z" fill="${P.pink}"/><ellipse cx="50" cy="50" rx="24" ry="18" fill="${P.red}"/>
      <path d="M36 36 Q42 50 36 64 M50 32 Q56 50 50 68 M64 36 Q70 50 64 64" stroke="${P.cream}" stroke-width="5" fill="none"/>` },
    { id: "owl", name: "Owl", svg: () => `<path d="M24 30 L32 12 L42 24 H58 L68 12 L76 30 C82 54 78 82 50 92 C22 82 18 54 24 30Z" fill="${P.tan}"/>
      <path d="M36 64 Q50 56 64 64 Q50 70 36 64Z M38 74 Q50 66 62 74 Q50 80 38 74Z" fill="${P.roof}" opacity=".35"/>
      <circle cx="38" cy="40" r="11" fill="${P.cream}"/><circle cx="62" cy="40" r="11" fill="${P.cream}"/><circle cx="38" cy="40" r="6" fill="${P.mustard}"/><circle cx="62" cy="40" r="6" fill="${P.mustard}"/>
      <circle cx="38" cy="40" r="2.6" fill="${P.ink}"/><circle cx="62" cy="40" r="2.6" fill="${P.ink}"/><path d="M46 50 L54 50 L50 58Z" fill="${P.pumpkin}"/>` },
  ];

  // ---- Pictures of each hiding spot (shown in Little Helpers mode so non-readers know where to look next)
  const spots = {
    door: { name: "the front door", svg: () => `<path d="M24 96 V30 C24 14 36 6 50 6 C64 6 76 14 76 30 V96Z" fill="${P.purple}"/><path d="M50 8 V96" stroke="${P.navyDeep}" stroke-width="2" opacity=".5"/>
        <circle cx="62" cy="58" r="3.5" fill="${P.mustard}"/>${M().pumpkin(50, 48, 22, P, true)}<rect x="18" y="92" width="64" height="6" fill="${P.roof}"/>` },
    broom: { hint: "A witch flies on me, and I sweep the floor too!", name: "the broom", svg: () => `<path d="M70 6 L44 62" stroke="${P.tan}" stroke-width="7" stroke-linecap="round"/>
        <path d="M40 58 L52 64 C56 76 54 88 48 96 C38 94 22 90 14 82 C22 78 32 68 40 58Z" fill="${P.mustard}"/><path d="M38 62 L50 68" stroke="${P.red}" stroke-width="6"/>
        <path d="M44 72 L30 88 M48 74 L40 94 M40 70 L22 84" stroke="${P.tan}" stroke-width="2" opacity=".7"/>` },
    books: { hint: "I'm full of books, just take a look!", name: "the bookshelf", svg: () => `<rect x="14" y="86" width="72" height="6" fill="${P.roof}"/><rect x="18" y="30" width="14" height="56" fill="${P.pumpkin}"/><rect x="34" y="20" width="12" height="66" fill="${P.purple}"/>
        <rect x="48" y="36" width="16" height="50" fill="${P.green}"/><rect x="66" y="26" width="12" height="60" transform="rotate(10 72 86)" fill="${P.mustard}"/><path d="M20 40 h10 M36 32 h8 M50 46 h12" stroke="${P.cream}" stroke-width="2"/>
        <path d="M86 8 L60 8 M86 8 L86 34 M86 8 L66 28 M74 8 Q76 18 86 20 M64 8 Q70 26 86 28" stroke="${P.inkSoft}" stroke-width="1.4" fill="none"/>` },
    pumpkin: { hint: "I'm round and orange, with a funny face!", name: "the pumpkin by the front door", svg: () => M().pumpkin(50, 94, 86, P, true) },
    mailbox: { hint: "The mail carrier puts letters in me.", name: "the mailbox", svg: () => `<rect x="44" y="52" width="10" height="44" fill="${P.roof}"/>
        <path d="M18 56 V32 C18 20 26 14 38 14 H70 C78 14 84 20 84 30 V56Z" fill="${P.navy}"/><path d="M18 34 C18 22 28 16 38 16 C48 16 56 22 56 34 V56 H18Z" fill="${P.navyDeep}"/>
        <rect x="66" y="18" width="5" height="26" fill="${P.red}"/><rect x="66" y="18" width="14" height="9" fill="${P.red}"/>
        <rect x="24" y="36" width="26" height="16" fill="${P.cream}" transform="rotate(-8 37 44)"/><path d="M26 37 L37 45 L48 34" stroke="${P.tan}" stroke-width="2" fill="none" transform="rotate(-8 37 44)"/>` },
    doormat: { hint: "Wipe your feet on me before you come in!", name: "under the doormat", svg: () => `<path d="M8 46 L92 46 L86 80 L14 80Z" fill="${P.tan}"/>
        <path d="M14 52 H86 M12 74 H88" stroke="${P.roof}" stroke-width="3" opacity=".5"/>${M().bat(50, 63, 46, P.ink)}
        <path d="M14 80 v6 M24 80 v6 M34 80 v6 M44 80 v6 M54 80 v6 M64 80 v6 M74 80 v6 M84 80 v6" stroke="${P.tan}" stroke-width="2.4"/>` },
    boots: { hint: "Coats and boots, waiting by the door.", name: "the coats and boots", svg: () => `<rect x="10" y="10" width="80" height="6" rx="3" fill="${P.roof}"/>
        <path d="M34 16 L20 28 V62 H48 V28Z" fill="${P.purple}"/><path d="M66 16 L52 28 V58 H80 V28Z" fill="${P.green}"/>
        <path d="M16 70 H30 V88 H40 C44 88 46 96 42 96 H16Z" fill="${P.ink}"/><path d="M56 70 H70 V88 H80 C84 88 86 96 82 96 H56Z" fill="${P.pumpkin}"/>` },
    couch: { hint: "Snuggle on me for movies and cuddles.", name: "the couch cushions", svg: () => `<rect x="12" y="34" width="76" height="34" rx="10" fill="${P.sage}"/><rect x="20" y="22" width="60" height="26" rx="8" fill="${P.sage}"/>
        <rect x="26" y="38" width="22" height="16" rx="5" fill="${P.purple}"/><rect x="52" y="38" width="22" height="16" rx="5" fill="${P.mustard}"/><rect x="18" y="68" width="6" height="22" fill="${P.roof}"/><rect x="76" y="68" width="6" height="22" fill="${P.roof}"/>
        <rect x="24" y="68" width="52" height="22" fill="${P.ink}" opacity=".85"/>${eyes(43, 79, 0.9)}` },
    window: { hint: "Look through me to see the moon.", name: "the window", svg: () => `<rect x="18" y="12" width="64" height="76" rx="3" fill="${P.navy}"/><circle cx="62" cy="32" r="12" fill="${P.mustard}"/>
        ${M().bat(36, 34, 22, P.ink)}${M().bat(58, 60, 16, P.ink)}<rect x="18" y="12" width="64" height="76" rx="3" fill="none" stroke="${P.cream}" stroke-width="5"/><path d="M50 12 V88 M18 50 H82" stroke="${P.cream}" stroke-width="4"/><rect x="12" y="86" width="76" height="8" fill="${P.tan}"/>` },
    bed: { hint: "Peek under the bed you sleep in.", name: "under the bed", svg: () => `<rect x="10" y="26" width="10" height="64" fill="${P.roof}"/><rect x="80" y="46" width="10" height="44" fill="${P.roof}"/><rect x="18" y="48" width="66" height="20" fill="${P.lilac}"/>
        <rect x="22" y="36" width="24" height="14" rx="6" fill="${P.cream}"/><path d="M40 48 H84 V68 H40Z" fill="${P.purple}"/><rect x="20" y="68" width="60" height="22" fill="${P.ink}" opacity=".85"/>${eyes(40, 79, 1)}` },
    mirror: { hint: "Look at me and you'll see yourself!", name: "the mirror", svg: () => `<ellipse cx="50" cy="50" rx="32" ry="42" fill="${P.tan}"/><ellipse cx="50" cy="50" rx="25" ry="35" fill="${P.sky}"/>
        <path d="M36 30 L44 22 M34 42 L50 26" stroke="${P.cream}" stroke-width="4" stroke-linecap="round" opacity=".8"/><circle cx="50" cy="8" r="5" fill="${P.mustard}"/><circle cx="50" cy="92" r="5" fill="${P.mustard}"/>` },
    pot: { hint: "I'm the biggest pot in the kitchen. Bubble, bubble!", name: "the biggest pot in the kitchen", svg: () => cauldronSvg() },
    treasure: { name: "the cauldron", svg: () => cauldronSvg(candyInside()) },
  };

  window.HUNT_THEMES = window.HUNT_THEMES || {};
  const T = (window.HUNT_THEMES.halloween = {
    id: "halloween",
    title: "Halloween Magic Hunt",
    eyebrow: "A spooky hunt in ten clues",
    character: { name: "Hazel the Witch", title: "Hollowmoor" },
    machineName: "the Spell Finder",
    palette: P,
    symbols,
    spots,

    voiceFiles: true,
    audioVersion: 1,
    sounds: { tap: "plink", correct: "spooky", wrong: "thud", finale: "spookyFinale", unlock: "spookyUnlock", critter: "squeak" },
    particles: "leaves", // falling autumn leaves instead of snow
    critter: { kind: "cat", label: "A little black cat! Tap her.", sound: "Meow!", preset: "meow" },

    // Words for things the engine says
    ui: {
      letterName: "Hazel's letter",
      secretLabel: "word", // each clue gives a WORD of the spell (Christmas gives a letter)
      placeSurprise: "Put the candy in the biggest pot in your kitchen (the cauldron).",
      leaveLetter: "Then leave Hazel's letter at the front door, knock loudly (or ring the bell) and hide!",
      lockButton: "Lock the Spell Finder",
      atFinale: "We're at the cauldron!",
      seeFinale: "Break the curse!",
      surpriseHeading: "The prize in the cauldron",
      testLine: "Happy Halloween, my little pumpkins. The magic is ready.",
      collectorNote: "Colour in pumpkin {n} on your Spell Collector.",
      writeNote: "Write <b>{word}</b> under pumpkin <b>{n}</b> on your Spell Collector.",
      giftLabel: "Tap the cauldron",
    },

    modes: {
      little: { label: "Little Helpers", ages: "Ages 3–5", blurb: "Match the pictures in any order. The app shows where to look next and reads it out loud." },
      big: { label: "Big Detectives", ages: "Ages 6–10", blurb: "Enter codes in order, solve the creepy riddles and collect the ten words of the spell." },
    },

    password: "GHOST",
    passwordDecoys: ["B", "A", "M"],
    lock: {
      heading: "The Spell Finder is locked",
      body: "My letter has a secret password on the back. Paint it to make the letters appear, then tap them in here.",
      wrong: "That's not the secret word. Paint a little more and look again!",
      bodyNoPaint: "My letter has a secret password on the back. Turn it over, then tap the letters in here.",
      wrongNoPaint: "That's not the secret word. Check the back of the letter and try again!",
      unlocked: "Unlocked! The spell book is awake.",
    },
    namesStep: {
      heading: "Who's helping Hazel?",
      body: "Type each name so the spell knows who to cheer for. (Grown-ups can help!)",
      placeholder: "Name", add: "Add another helper", button: "Start the hunt", skip: "Skip names",
    },
    firstRiddle: { kicker: "Your first riddle", go: "I know where to look!" },
    prompt: { little: "Tap the pictures on your clue", big: "Enter the code from your clue" },
    turn: "{name}'s turn to tap",
    wrong: { little: ["Not quite! Look at your clue and try again.", "Almost! Check the pictures again."], big: ["The spell fizzled. Check the order and try again.", "Not quite. Look closely at your clue and try again."] },
    already: "You already found that one!",
    cheers: ["Spooktacular, {name}!", "Well spotted, {name}!", "Brave work, {name}!", "Bewitching, {name}!"],

    // ---- The spell: one word per clue, in order.
    finalWord: "Bubble bubble pumpkins glow break the curse away you go",
    spell: "Bubble, bubble, pumpkins glow, break the curse, away you go!",
    finalSpot: "In the biggest pot in the kitchen",
    firstSpot: "broom",
    riddles: {
      broom: ["A witch rides me high when the moon's round and bright,", "but here I just sweep up the crumbs out of sight.", "I lean in a corner, all bristles and stick.", "Your first clue is waiting beside me. Be quick!"],
      books: ["Some say that at midnight my stories creep out,", "to tiptoe through rooms when there's no one about.", "I stand very still with my shelves in a row.", "Your next clue is hiding where all the books go!"],
      pumpkin: ["I'm round and I'm orange, with a face carved to grin.", "I sit by the front door with a light glowing within.", "Take a grown-up and a flashlight, and step into the night.", "Your next clue is hiding beside me, just out of sight!"],
      mailbox: ["I wait by the path with my mouth open wide,", "for letters and parcels to drop right inside.", "But tonight, a ghost posted something for you.", "Open me up for your next spooky clue!"],
      doormat: ["I lie by the front door, all bristly and flat.", "Muddy boots wipe on me, and so would a black cat!", "But tonight there's a secret tucked under, out of sight.", "Lift up my corner and peek... careful the clue doesn't blow away in the night..."],
      boots: ["We hang in a row like a line of tall ghosts,", "with long empty sleeves (we're just coats, at the most!).", "Our boots wait below, side by side on the floor.", "Search where we hang, by the hooks or the door!"],
      couch: ["I'm squishy and comfy, but who's that below?", "A creature that lurks where the cushions won't show!", "It's only a clue, so be brave, never fear.", "Dig under my cushions: your next one is here!"],
      window: ["I'm made out of glass, and the moon peeks right in.", "Was that a bat flapping by with a grin?", "Press your nose close to the shadows outside.", "Your next clue is near me, where spooky things hide."],
      bed: ["There's something that lurks in the dark under me.", "Is it a monster? Come closer and see!", "Don't worry, it's only a clue, out of sight,", "under the bed where you sleep every night."],
      mirror: ["Look into me and a face will look back.", "It copies your waves and your wiggles and quacks.", "Pull your best scary face, but don't run off in fright!", "Your last clue is near me, so look left and right."],
      pot: ["You've found every word, and the spell is complete!", "But a witch needs a cauldron to brew something sweet.", "Creep into the kitchen, as quiet as a bat.", "Look in the biggest pot... what's hiding in that?"],
    },
    clues: [
      { n: 1, at: "broom", hideAt: "Next to a broom", next: "books", code: ["pumpkin", "bat", "ghost", "moon"], letter: "Bubble",
        unlock: "Eek! Did that broom just twitch? I think it likes you." },
      { n: 2, at: "books", hideAt: "On the bookshelf", next: "pumpkin", code: ["cat", "hat", "candy", "owl"], letter: "bubble",
        unlock: "Shh... I think one of those books just whispered." },
      { n: 3, at: "pumpkin", hideAt: "Next to the pumpkin by the front door (outside)", next: "mailbox", code: ["ghost", "candy", "pumpkin", "hat"], letter: "pumpkins",
        unlock: "Look! The pumpkin's starting to glow again. The spell is working!" },
      { n: 4, at: "mailbox", hideAt: "In the mailbox (outside)", next: "doormat", code: ["moon", "owl", "bat", "cat"], letter: "glow",
        unlock: "A letter from a ghost! Spooky... but friendly." },
      { n: 5, at: "doormat", hideAt: "Under the doormat (outside)", next: "boots", code: ["hat", "pumpkin", "owl", "ghost"], letter: "break",
        unlock: "Now hurry back inside. It's getting dark out there." },
      { n: 6, at: "boots", hideAt: "With the coats and boots", next: "couch", code: ["bat", "candy", "moon", "pumpkin"], letter: "the",
        unlock: "Those sleeves looked like they were reaching for you! The spell is getting stronger." },
      { n: 7, at: "couch", hideAt: "Under a couch cushion", next: "window", code: ["owl", "ghost", "cat", "candy"], letter: "curse",
        unlock: "Phew! No creatures under there. Just magic." },
      { n: 8, at: "window", hideAt: "By a window", next: "bed", code: ["candy", "moon", "hat", "bat"], letter: "away",
        unlock: "Did you see that? Something just flew past the window! Almost there!" },
      { n: 9, at: "bed", hideAt: "Under a bed (near the edge)", next: "mirror", code: ["cat", "pumpkin", "moon", "owl"], letter: "you",
        unlock: "No monsters! Just a very brave detective. One more clue to go." },
      { n: 10, at: "mirror", hideAt: "By a mirror", next: "pot", code: ["ghost", "hat", "bat", "cat"], letter: "go",
        unlock: "That's all ten words of the spell!! Solve one last riddle, and the curse will reverse!" },
    ].map(function (c) { c.riddle = null; return c; }),

    finale: {
      big: { heading: "You found the spell, {names}!", headingNoName: "You found the spell!", body: "You found every word of the spell! Now stand by the cauldron and say it out loud, all together, to break the curse. Then tap the cauldron!" },
      little: { heading: "You found all the magic, {names}!", headingNoName: "You found all the magic!", body: "Ten glowing pumpkins! Now run to the kitchen and find the biggest pot. Say the spell after me: Bubble, bubble, pumpkins glow, break the curse, away you go! Then tap the cauldron!" },
      earned: "You broke the curse!",
      earnedSay: "You broke the curse! Happy Halloween, my little pumpkins!",
      tapGift: "Tap the cauldron",
      defaultSurprise: "A cauldron full of candy",
      signoff: "Happy Halloween,",
    },
    surprise: {
      label: "What's in the cauldron?",
      help: "They'll see it at the very end, when the curse breaks. Hide the real thing in your biggest pot.",
      ideas: ["Candy", "A treat bag", "A Halloween movie night", "Glow sticks", "Pumpkin cookies"],
    },

    // ---- Printables copy
    letter: {
      greeting: "Dear my mortal friend,",
      paragraphs: [
        "I'm Hazel, a good witch from the spooky village of Hollowmoor, and I need your help. A grumpy old ghost has put a curse on our village, and now the pumpkins won't glow!",
        "I wrote a spell to break it, but a gust of wind blew its ten words away, and they landed in YOUR house. First, open the Spell Finder on your grown-up's phone. It's locked, and only a secret password will open it. Turn this letter over and paint the back. The password will appear, like a ghost out of the mist.",
        "Every clue you find has a picture code. Tap it in, and the Spell Finder will give you a word of the spell. Find all ten, say the spell over my cauldron, and the curse will break.",
        "Be brave. The bats and I are cheering for you!",
      ],
      paragraphsNoPaint: [
        "I'm Hazel, a good witch from the spooky village of Hollowmoor, and I need your help. A grumpy old ghost has put a curse on our village, and now the pumpkins won't glow!",
        "I wrote a spell to break it, but a gust of wind blew its ten words away, and they landed in YOUR house. First, open the Spell Finder on your grown-up's phone. It's locked, and only a secret password will open it. Turn this letter over to find the password, then tap it in.",
        "Every clue you find has a picture code. Tap it in, and the Spell Finder will give you a word of the spell. Find all ten, say the spell over my cauldron, and the curse will break.",
        "Be brave. The bats and I are cheering for you!",
      ],
      signoff: "Love from",
      postscript: "P.S. Stuck? Grown-ups know a little bit of magic too.",
    },
    board: {
      heading: "Spell Collector",
      instructions: "Each time you find a clue, colour in that pumpkin. Big Detectives: write your spell word underneath.",
      wordLabel: "The spell is",
      treasureLabel: "In the cauldron, I found",
      nameLabel: "Hazel's official helper(s)",
    },
    treasureSign: { heading: "You broke the curse!", body: "Happy Halloween" }, // goes in the pot with the candy

    guide: {
      levelUp: [
        ["Flashlight hunt", "Play after dark with a flashlight. The outside clues are extra spooky (always with a grown-up)."],
        ["Candy at every clue", "Tuck a tiny treat beside each clue card as a prize for every find."],
        ["Costume on", "Hunt in costume! Spells work best in capes and witch hats."],
        ["Siblings of different ages", "Pair a Big Detective with a Little Helper: the little one taps the pictures, the big one reads the riddles."],
      ],
      playlist: [],
      copy: {
        letterName: "Hazel's letter",
        intro: "Ten clues, a ten-word spell and a cauldron of candy at the end. Setup takes about 15 minutes.",
        signItem: "\"You broke the curse!\" sign for the cauldron", boardItem: "Spell Collector board",
        fileLetter: "2-Hazels-Letter-Painting.pdf", fileNoPaint: "3-Hazels-Letter-No-Painting.pdf",
        paint: "Dark watercolour (purple, blue or black) will: the wax resists the paint and the letters appear, like a ghost out of the mist.",
        leaveLetter: "Leave Hazel's letter at the front door (with paint, a brush and a cup of water for the painting letter). Not on the doormat: a clue hides under it! Then knock loudly or ring the bell, and hide!",
        critter: "A little black cat sometimes creeps across the screen. Tap her and she meows. Who can spot her the most?",
        swapLead: "Three clues are outside (the pumpkin, mailbox and doormat). Go with the kids and take a flashlight, or move them inside:",
        surprise: "The last riddle leads to the biggest pot in your kitchen: that's Hazel's cauldron. Put the candy inside with the \"You broke the curse!\" sign. Type what's in it at setup. It's revealed on the final screen when they say the spell and tap the cauldron.",
        finalNote: "(put the candy in it!)",
        musicHeading: "Spooky music",
      },
    },

    // Progress icons: ten pumpkins that light up as clues are found.
    progressIcon(n, done) {
      return done
        ? `<svg viewBox="0 0 30 34"><rect x="13" y="0" width="4" height="6" fill="${P.tan}"/>${M().pumpkin(15, 32, 27, P, true)}</svg>`
        : `<svg viewBox="0 0 30 34"><rect x="13" y="0" width="4" height="6" fill="none" stroke="${P.tan}"/><ellipse cx="15" cy="20" rx="13" ry="11" fill="${P.card}" stroke="${P.tan}" stroke-dasharray="2.5 2.5"/></svg>`;
    },
    // Printables: the password on the back of the no-paint letter, as glowing pumpkins.
    printBadge(l, i) {
      return `<div class="pw-pump"><svg viewBox="0 0 100 100">${M().pumpkin(50, 98, 96, P, false)}<text x="50" y="74" text-anchor="middle" font-family="Figtree" font-weight="900" font-size="46" fill="${P.cream}">${l}</text></svg></div>`;
    },
    // Printables: an outline pumpkin to colour in on the Spell Collector (light on ink).
    boardIcon(n, ink) {
      return `<svg viewBox="0 0 100 100"><path d="M50 22 q3 -12 12 -16" stroke="${ink}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <ellipse cx="30" cy="58" rx="24" ry="34" fill="#fff" stroke="${ink}" stroke-width="2.2"/><ellipse cx="70" cy="58" rx="24" ry="34" fill="#fff" stroke="${ink}" stroke-width="2.2"/>
        <ellipse cx="50" cy="58" rx="22" ry="36" fill="#fff" stroke="${ink}" stroke-width="2.2"/>
        <path d="M38 50 l6 -10 6 10Z M56 50 l6 -10 6 10Z" fill="none" stroke="${ink}" stroke-width="1.6"/>
        <text x="50" y="78" text-anchor="middle" font-family="Figtree" font-weight="900" font-size="20" fill="${ink}">${n}</text></svg>`;
    },
    // The finale's tap-to-open prize: a cauldron whose lid pops off (.box and .lid are animated by the app).
    giftSvg() {
      return `<svg viewBox="0 0 120 110" aria-hidden="true"><g class="box"><path d="M36 100 l-6 8 M84 100 l6 8" stroke="${P.ink}" stroke-width="6" stroke-linecap="round"/>
        <path d="M14 50 H106 C108 84 88 106 60 106 C32 106 12 84 14 50Z" fill="${P.ink}"/><rect x="8" y="44" width="104" height="12" rx="6" fill="${P.roof}"/>
        <path d="M30 70 Q34 88 48 96" stroke="${P.cream}" stroke-width="3" fill="none" opacity=".25" stroke-linecap="round"/></g>
        <g class="lid"><path d="M14 44 C20 22 100 22 106 44Z" fill="${P.navyDeep}"/><rect x="52" y="16" width="16" height="10" rx="5" fill="${P.mustard}"/>
        <circle cx="34" cy="38" r="5" fill="${P.slime}" opacity=".7"/><circle cx="88" cy="36" r="4" fill="${P.slime}" opacity=".7"/></g></svg>`;
    },
    // Night-time celebration: moon, bats, crooked glowing houses, a bubbling cauldron and glowing pumpkins.
    celebrationScene(Mo) {
      const W = 420, H = 380, rnd = Mo.rand(23);
      let s = `<rect width="${W}" height="${H}" fill="${P.navy}"/>`;
      for (let i = 0; i < 60; i++) s += `<circle class="tw" style="animation-delay:${(rnd() * 2).toFixed(2)}s" cx="${(rnd() * W).toFixed(0)}" cy="${(rnd() * H * 0.55).toFixed(0)}" r="${(0.8 + rnd() * 1.5).toFixed(1)}" fill="${P.cream}"/>`;
      s += `<circle cx="300" cy="86" r="80" fill="${P.mustard}" opacity=".12"/><circle cx="300" cy="86" r="56" fill="${P.butter}"/><circle cx="286" cy="74" r="8" fill="${P.tan}" opacity=".35"/><circle cx="316" cy="104" r="6" fill="${P.tan}" opacity=".35"/>`;
      [[260, 76, 34], [336, 58, 26], [96, 70, 30], [150, 118, 22], [206, 50, 18]].forEach(([x, y, z], i) => (s += `<g class="tw" style="animation-delay:${i * 0.3}s">${Mo.bat(x, y, z, P.navyDeep)}</g>`));
      s += `<path d="M0 ${H} L0 262 Q110 236 210 256 T420 246 L420 ${H}Z" fill="${P.snowBack}"/>`;
      s += Mo.cat(40, 264, 58, P.ink, P.mustard) + Mo.cat(92, 258, 40, P.ink, P.mustard, true) + Mo.cat(350, 260, 52, P.ink, P.mustard, true) + Mo.cat(392, 256, 36, P.ink, P.mustard);
      s += Mo.bareTree(128, 270, 92, P.pine, rnd) + Mo.bareTree(298, 266, 80, P.pine, rnd);
      s += `<path d="M0 ${H} L0 318 Q140 296 220 314 T420 306 L420 ${H}Z" fill="${P.snow}"/>`;
      s += `<defs><radialGradient id="cauldronGlow"><stop offset="0" stop-color="${P.slime}" stop-opacity=".6"/><stop offset="1" stop-color="${P.slime}" stop-opacity="0"/></radialGradient></defs><circle class="glow" cx="210" cy="250" r="140" fill="url(#cauldronGlow)"/>`;
      // the big cauldron, bubbling
      s += `<path d="M168 330 l-8 12 M252 330 l8 12" stroke="${P.ink}" stroke-width="8" stroke-linecap="round"/>`;
      s += `<path d="M146 250 H274 C278 300 250 336 210 336 C170 336 142 300 146 250Z" fill="${P.ink}"/><rect x="136" y="240" width="148" height="18" rx="9" fill="${P.roof}"/>`;
      [[176, 232, 14], [204, 222, 18], [236, 230, 13], [258, 238, 9], [190, 206, 8], [222, 196, 10], [210, 172, 6], [236, 160, 5]].forEach(([x, y, r], i) => (s += `<circle class="bulb" style="animation-delay:${(i * 0.21) % 1.4}s" cx="${x}" cy="${y}" r="${r}" fill="${P.slime}"/>`));
      s += Mo.pumpkin(110, 344, 46, P, true) + Mo.pumpkin(316, 346, 40, P, true) + Mo.pumpkin(62, 350, 30, P, true) + Mo.pumpkin(366, 352, 28, P, true);
      return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice" aria-hidden="true">${s}</svg>`;
    },
  });
  T.clues.forEach((c) => (c.riddle = T.riddles[c.next]));
})();
