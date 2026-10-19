/* THEME: Christmas Magic Hunt
   One file = one complete theme. The web app AND the printables both read from this file,
   so riddles, codes and secret letters can never get out of sync.
   To add a theme: copy this file, rename it, change the content, and register it (see ADDING-A-THEME.md). */
(function () {
  // ---- Palette (inspired by flat, gouache-style folk illustration: cream, vermilion, pine, navy night)
  const P = {
    paper: "#f4ede0", card: "#fbf7ef", ink: "#2c2b36", inkSoft: "#6c665e",
    navy: "#46528a", navyDeep: "#323c6b",
    red: "#d9532f", redDeep: "#a83a1f",
    pine: "#24452f", sage: "#78a586", tan: "#b59a66", roof: "#a8784b", roofLine: "#6d4527",
    pink: "#f0b4a4", mint: "#bcdccb", sky: "#a9c0d6", butter: "#ecd9a6", lilac: "#a9a9bc",
    mustard: "#e7b544", window: "#3b4573",
    cream: "#f6f0e4", snow: "#f6f0e4", snowBack: "#ebe3d3",
  };

  function star5(cx, cy, R, r) {
    const p = [];
    for (let i = 0; i < 10; i++) { const a = (i * Math.PI) / 5 - Math.PI / 2, rr = i % 2 ? r : R; p.push((cx + rr * Math.cos(a)).toFixed(1) + "," + (cy + rr * Math.sin(a)).toFixed(1)); }
    return p.join(" ");
  }
  const heart = (tx, ty, s, fill) => `<path transform="translate(${tx} ${ty}) scale(${s}) translate(-50 -50)" d="M50 88 C20 66 8 50 8 34 C8 20 19 11 31 11 C40 11 47 17 50 24 C53 17 60 11 69 11 C81 11 92 20 92 34 C92 50 80 66 50 88Z" fill="${fill}"/>`;
  const treeSvg = () => `<rect x="45" y="80" width="10" height="14" fill="${P.roof}"/>
      <path d="M50 6 L66 34 Q58 31 50 35 Q42 31 34 34Z" fill="${P.pine}"/>
      <path d="M50 22 L74 58 Q62 54 50 59 Q38 54 26 58Z" fill="${P.pine}"/>
      <path d="M50 40 L82 82 Q66 77 50 83 Q34 77 18 82Z" fill="${P.pine}"/>
      <circle cx="44" cy="30" r="3.2" fill="${P.red}"/><circle cx="58" cy="48" r="3.2" fill="${P.red}"/><circle cx="38" cy="54" r="3.2" fill="${P.red}"/>
      <circle cx="62" cy="70" r="3.2" fill="${P.red}"/><circle cx="34" cy="74" r="3.2" fill="${P.red}"/><circle cx="50" cy="66" r="3.2" fill="${P.mustard}"/>`;
  const stockingSvg = () => `<path d="M34 22 H66 V56 L80 70 C88 78 82 92 70 90 L44 86 C34 84 32 76 34 68Z" fill="${P.red}"/>
      <rect x="30" y="10" width="40" height="16" rx="3" fill="${P.cream}"/>
      <path d="M34 46 H66" stroke="${P.pine}" stroke-width="4"/><path d="M68 74 C74 78 78 84 74 88" stroke="${P.cream}" stroke-width="4" fill="none"/>
      ${heart(50, 62, 0.16, P.cream)}`;
  const giftSvg = () => `<rect x="16" y="40" width="68" height="50" rx="3" fill="${P.tan}"/>
      <path d="M28 46 V84 M40 46 V84 M60 46 V84 M72 46 V84" stroke="${P.roof}" stroke-width="2.4" opacity=".7"/>
      <rect x="46" y="40" width="8" height="50" fill="${P.red}"/><rect x="12" y="32" width="76" height="12" rx="2" fill="${P.red}"/>
      <path d="M50 32 C38 14 22 18 26 28 C28 33 40 33 50 32Z M50 32 C62 14 78 18 74 28 C72 33 60 33 50 32Z" fill="${P.red}"/>`;

  // ---- 8 keypad symbols. Distinct by SHAPE and COLOUR so 3-year-olds can match them.
  const symbols = [
    { id: "tree", name: "Tree", svg: treeSvg },
    { id: "star", name: "Star", svg: () => `<polygon points="${star5(50, 52, 44, 19)}" fill="${P.mustard}"/><circle cx="50" cy="54" r="6" fill="${P.cream}"/>` },
    { id: "stocking", name: "Stocking", svg: stockingSvg },
    { id: "gift", name: "Present", svg: giftSvg },
    { id: "bell", name: "Bell", svg: () => `<path d="M50 20 C34 22 26 36 26 52 V64 L16 76 H84 L74 64 V52 C74 36 66 22 50 20Z" fill="${P.tan}"/>
      <path d="M28 62 H72" stroke="${P.roof}" stroke-width="3" opacity=".7"/><circle cx="50" cy="82" r="8" fill="${P.roof}"/>
      <path d="M50 18 C40 6 30 10 34 16 C36 20 44 20 50 18Z M50 18 C60 6 70 10 66 16 C64 20 56 20 50 18Z" fill="${P.red}"/><circle cx="50" cy="18" r="4" fill="${P.redDeep}"/>` },
    { id: "mitten", name: "Mitten", svg: () => `<path d="M28 74 V40 C28 22 37 10 52 10 C67 10 74 22 74 38 V48 L81 41 C87 35 96 41 91 49 L74 70 V74Z" fill="${P.sage}"/>
      <rect x="24" y="72" width="54" height="18" rx="3" fill="${P.cream}"/>${heart(50, 40, 0.3, P.red)}
      <path d="M30 81 h44" stroke="${P.sage}" stroke-width="2" stroke-dasharray="3 3"/>` },
    { id: "house", name: "House", svg: () => `<rect x="66" y="10" width="10" height="22" fill="${P.roof}"/>
      <rect x="22" y="44" width="56" height="48" fill="${P.pink}"/><path d="M14 46 L50 12 L86 46Z" fill="${P.roof}"/>
      <rect x="30" y="54" width="12" height="12" fill="${P.window}"/><rect x="58" y="54" width="12" height="12" fill="${P.window}"/>
      <path d="M44 92 V78 Q50 70 56 78 V92Z" fill="${P.roof}"/>` },
    { id: "holly", name: "Holly", svg: () => `<path d="M50 52 C40 30 22 24 8 30 C14 34 12 40 18 42 C14 46 20 52 24 50 C26 58 36 58 50 52Z" fill="${P.pine}"/>
      <path d="M50 52 C60 30 78 24 92 30 C86 34 88 40 82 42 C86 46 80 52 76 50 C74 58 64 58 50 52Z" fill="${P.sage}"/>
      <circle cx="42" cy="62" r="9" fill="${P.red}"/><circle cx="58" cy="62" r="9" fill="${P.red}"/><circle cx="50" cy="76" r="9" fill="${P.red}"/>
      <circle cx="39" cy="59" r="2.4" fill="${P.cream}" opacity=".7"/><circle cx="55" cy="59" r="2.4" fill="${P.cream}" opacity=".7"/><circle cx="47" cy="73" r="2.4" fill="${P.cream}" opacity=".7"/>` },
  ];

  // ---- Pictures of each hiding spot (shown in Little Helpers mode so non-readers know where to look next)
  const spots = {
    door: { name: "the front door", svg: () => `<rect x="24" y="8" width="52" height="88" rx="4" fill="${P.red}"/><rect x="30" y="16" width="40" height="30" rx="2" fill="${P.redDeep}" opacity=".5"/><rect x="30" y="54" width="40" height="34" rx="2" fill="${P.redDeep}" opacity=".5"/>
        <circle cx="50" cy="36" r="15" fill="none" stroke="${P.pine}" stroke-width="7"/><circle cx="42" cy="26" r="2.5" fill="${P.red}"/><circle cx="60" cy="32" r="2.5" fill="${P.red}"/><circle cx="46" cy="49" r="2.5" fill="${P.red}"/>
        <path d="M44 50 l6 -6 6 6" fill="${P.red}"/><circle cx="66" cy="62" r="3.5" fill="${P.mustard}"/>` },
    tree: { hint: "I'm sparkly and green, with a star on top!", name: "the Christmas tree", svg: treeSvg },
    stockings: { hint: "We hang up high, and Santa fills us with treats!", name: "the stockings", svg: stockingSvg },
    kitchen: { hint: "I'm full of cookies. Yum!", name: "where we keep the cookies", svg: () => `<rect x="22" y="30" width="56" height="62" rx="12" fill="${P.sky}"/><rect x="30" y="16" width="40" height="14" rx="4" fill="${P.tan}"/><circle cx="50" cy="13" r="6" fill="${P.tan}"/>
        <circle cx="50" cy="60" r="16" fill="${P.tan}"/><circle cx="44" cy="55" r="2.5" fill="${P.roofLine}"/><circle cx="55" cy="58" r="2.5" fill="${P.roofLine}"/><circle cx="48" cy="67" r="2.5" fill="${P.roofLine}"/>` },
    fridge: { hint: "I keep your food nice and cold.", name: "the fridge door", svg: () => `<rect x="24" y="6" width="52" height="88" rx="7" fill="${P.sky}"/><path d="M24 36 H76" stroke="${P.navy}" stroke-width="2.5"/>
        <rect x="66" y="14" width="4" height="14" rx="2" fill="${P.navy}"/><rect x="66" y="44" width="4" height="20" rx="2" fill="${P.navy}"/>
        <rect x="32" y="46" width="22" height="18" fill="${P.cream}" transform="rotate(-6 43 55)"/><circle cx="43" cy="44" r="3" fill="${P.red}"/>
        <path d="M36 60 l4 -6 4 4 5 -7" fill="none" stroke="${P.sage}" stroke-width="2"/><rect x="34" y="72" width="16" height="12" fill="${P.butter}" transform="rotate(5 42 78)"/><circle cx="42" cy="71" r="2.6" fill="${P.pine}"/>` },
    table: { hint: "This is where we eat our dinner.", name: "the dinner table", svg: () => `<rect x="10" y="40" width="80" height="8" rx="2" fill="${P.roof}"/><rect x="16" y="48" width="6" height="40" fill="${P.roof}"/><rect x="78" y="48" width="6" height="40" fill="${P.roof}"/>
        <path d="M14 40 H86 L82 54 H18Z" fill="${P.red}" opacity=".9"/><path d="M22 54 l4 6 4 -6 4 6 4 -6 4 6 4 -6 4 6 4 -6 4 6 4 -6 4 6 4 -6 4 6 4 -6" fill="none" stroke="${P.red}" stroke-width="2"/>
        <ellipse cx="50" cy="36" rx="18" ry="5" fill="${P.cream}"/><path d="M38 34 C38 22 62 22 62 34Z" fill="${P.tan}"/><circle cx="50" cy="22" r="3" fill="${P.red}"/>
        <rect x="22" y="28" width="4" height="10" fill="${P.cream}"/><path d="M24 28 c-3 -4 0 -7 0 -9 c0 2 3 5 0 9Z" fill="${P.mustard}"/><rect x="74" y="28" width="4" height="10" fill="${P.cream}"/><path d="M76 28 c-3 -4 0 -7 0 -9 c0 2 3 5 0 9Z" fill="${P.mustard}"/>` },
    couch: { hint: "Snuggle on me for movies and cuddles.", name: "the couch cushions", svg: () => `<rect x="12" y="40" width="76" height="34" rx="10" fill="${P.sage}"/><rect x="20" y="28" width="60" height="26" rx="8" fill="${P.sage}"/>
        <rect x="26" y="44" width="22" height="16" rx="5" fill="${P.pink}"/><rect x="52" y="44" width="22" height="16" rx="5" fill="${P.butter}"/><rect x="18" y="74" width="6" height="12" fill="${P.roof}"/><rect x="76" y="74" width="6" height="12" fill="${P.roof}"/>` },
    books: { hint: "I'm full of books, just take a look!", name: "the bookshelf", svg: () => `<rect x="14" y="86" width="72" height="6" fill="${P.roof}"/><rect x="18" y="30" width="14" height="56" fill="${P.red}"/><rect x="34" y="20" width="12" height="66" fill="${P.navy}"/>
        <rect x="48" y="36" width="16" height="50" fill="${P.pine}"/><rect x="66" y="26" width="12" height="60" transform="rotate(10 72 86)" fill="${P.mustard}"/><path d="M20 40 h10 M36 32 h8 M50 46 h12" stroke="${P.cream}" stroke-width="2"/>` },
    window: { hint: "Look through me to see outside.", name: "the window", svg: () => `<rect x="18" y="12" width="64" height="76" rx="3" fill="${P.navy}"/><rect x="18" y="12" width="64" height="76" rx="3" fill="none" stroke="${P.cream}" stroke-width="5"/><path d="M50 12 V88 M18 50 H82" stroke="${P.cream}" stroke-width="4"/>
        <circle cx="66" cy="28" r="7" fill="${P.cream}"/><circle cx="69" cy="26" r="6" fill="${P.navy}"/><circle cx="30" cy="26" r="1.6" fill="${P.cream}"/><circle cx="38" cy="38" r="1.2" fill="${P.cream}"/><circle cx="64" cy="66" r="1.5" fill="${P.cream}"/><rect x="12" y="86" width="76" height="8" fill="${P.tan}"/>` },
    boots: { hint: "Pull us on before you play in the snow.", name: "the coats and boots", svg: () => `<path d="M16 30 H38 V72 H52 C58 72 60 88 54 88 H16Z" fill="${P.roof}"/><path d="M50 26 H72 V68 H86 C92 68 94 84 88 84 H50Z" fill="${P.red}"/>
        <rect x="14" y="24" width="26" height="10" rx="3" fill="${P.cream}"/><rect x="48" y="20" width="26" height="10" rx="3" fill="${P.cream}"/>` },
    bath: { hint: "Splish splash! I'm where you get clean.", name: "the bathtub", svg: () => `<path d="M10 48 H90 V58 C90 76 76 84 60 84 H40 C24 84 10 76 10 58Z" fill="${P.lilac}"/><rect x="6" y="44" width="88" height="8" rx="4" fill="${P.sky}"/>
        <path d="M20 84 l-4 10 M80 84 l4 10" stroke="${P.tan}" stroke-width="5" stroke-linecap="round"/><circle cx="34" cy="38" r="7" fill="${P.cream}"/><circle cx="46" cy="32" r="5" fill="${P.cream}"/>
        <circle cx="66" cy="34" r="9" fill="${P.mustard}"/><path d="M58 40 C58 50 80 50 80 40Z" fill="${P.mustard}"/><path d="M74 33 l7 2 -7 2Z" fill="${P.red}"/>` },
    bed: { hint: "You sleep in me every night.", name: "your bed", svg: () => `<rect x="10" y="30" width="10" height="60" fill="${P.roof}"/><rect x="80" y="50" width="10" height="40" fill="${P.roof}"/><rect x="18" y="52" width="66" height="22" fill="${P.pink}"/>
        <rect x="22" y="40" width="24" height="14" rx="6" fill="${P.cream}"/><path d="M40 52 H84 V74 H40Z" fill="${P.red}"/><path d="M48 52 V74 M60 52 V74 M72 52 V74" stroke="${P.cream}" stroke-width="2" stroke-dasharray="3 3"/>` },
    treasure: { name: "the treasure", svg: giftSvg },
  };

  window.HUNT_THEMES = window.HUNT_THEMES || {};
  window.HUNT_THEMES.christmas = {
    id: "christmas",
    title: "Christmas Magic Hunt",
    eyebrow: "A treasure hunt in ten clues",
    character: { name: "Santa", title: "North Pole" },
    machineName: "the Magic Finder",
    palette: P,
    symbols,
    spots,

    // Set to true once recordings are uploaded to site/audio/christmas/ (see VOICE-SCRIPT.md).
    voiceFiles: false,
    sounds: { tap: "bell", correct: "sleighbells", wrong: "thud", finale: "carillon" },

    // Two ways to play. The printed cards are the same; the app adapts.
    modes: {
      little: { label: "Little Helpers", ages: "Ages 3–5", blurb: "Match the pictures in any order. The app shows where to look next and reads the riddle out loud." },
      big: { label: "Big Detectives", ages: "Ages 6–10", blurb: "Enter codes in order, solve the riddles yourself and collect the secret letters." },
    },

    // ---- Start of the hunt: a grown-up knocks (or rings the bell) and leaves Santa's letter at the front door.
    // The back of the letter hides the password in white crayon. It unlocks the app, which then gives the first riddle.
    password: "MAGIC",
    passwordDecoys: ["S", "N", "O"], // extra letter tiles on the lock screen, so it isn't too easy
    lock: {
      heading: "The Magic Finder is locked",
      body: "Santa's letter has a secret password on the back. Paint it to make the letters appear, then tap them in here.",
      wrong: "That's not the magic word. Paint a little more and look again!",
      unlocked: "Unlocked! The magic is awake.",
    },
    namesStep: {
      heading: "Who are the Magic Finders?",
      body: "Type each finder's name so Santa knows who to cheer for. (Grown-ups can help!)",
      placeholder: "Name",
      add: "Add another finder",
      button: "Start the hunt",
      skip: "Skip names",
    },
    firstRiddle: { kicker: "Your first riddle", go: "I know where to look!" },
    prompt: { little: "Tap the pictures on your clue", big: "Enter the code from your clue" },
    turn: "{name}'s turn to tap",
    wrong: { little: ["Not quite! Look at your clue and try again.", "Almost! Check the pictures again."], big: ["The magic didn't sparkle. Check the order and try again.", "Not quite. Look closely at your clue and try again."] },
    already: "You already found that one!",
    cheers: ["Brilliant, {name}!", "Well spotted, {name}!", "Super sleuthing, {name}!", "Ho ho ho, {name}!"],

    // ---- Riddles describe a PLACE. The first riddle (shown in the app after unlocking) leads to Clue 1;
    // each clue's riddle leads to the next clue; Clue 10's riddle leads to the tree.
    finalWord: "SNOWFLAKES",
    finalSpot: "Under the Christmas tree",
    firstSpot: "stockings",
    riddles: {
      stockings: ["We hang in a row, and we each have a name.", "We're empty today, but we won't stay the same!", "We look like big socks, but you won't wear us, it's true.", "Reach right inside for your very first clue!"],
      books: ["I'm packed full of stories, from short ones to long,", "with dragons and princesses, giggles and song.", "I stand very still with my shelves in a row.", "Your next clue is hiding where all the books go!"],
      fridge: ["I hum all day long and I'm chilly inside,", "where the milk and the cheese and the leftovers hide.", "On Christmas Eve, Santa's milk waits in me.", "Your clue's on my door. Take a look and you'll see!"],
      table: ["On Christmas Day I'm the star of the feast,", "with gravy and pudding (and seconds, at least!).", "Pull out the chairs where the family eats.", "Your next clue is hiding under the seats!"],
      couch: ["I'm squishy and comfy with cushions galore,", "for Christmas films, cuddles (and maybe a snore).", "I've seats for the family, a blanket or two.", "Dig under my cushions to find your next clue!"],
      window: ["I'm made out of glass and I let in the light.", "On Christmas Eve, peek through me late at night.", "You might spot a sleigh flying high in the sky!", "Your next clue is near me, so give it a try."],
      boots: ["We're boots, hats and coats, and we wait by the door", "for snowball fights, sledging and snowmen galore.", "Before you go out, you pull us on tight.", "Search where we hang, to the left or the right!"],
      bath: ["Splish, splash, splosh! I'm all bubbles and foam.", "The rubber ducks say I'm their favourite home.", "I'm empty right now, so come over and see:", "your next clue is waiting, quite dry, inside me!"],
      bed: ["I'm cosy and soft, with a pillow or two.", "I'm where you curl up when the day is all through.", "Close your eyes tight and get plenty of sleep.", "Your next clue is tucked where your blankets are deep."],
      kitchen: ["Pots and pans clatter, the oven gets hot.", "We bake Santa's cookies here (and eat quite a lot!).", "With sprinkles and icing and gingerbread too,", "check where we keep cookies to find your last clue!"],
      tree: ["You've followed the magic all over the house!", "Now tiptoe along, as quiet as a mouse,", "to the one with the star and the twinkling light.", "Look under its branches: your surprise is in sight!"],
    },
    clues: [
      { n: 1, at: "stockings", hideAt: "Inside a stocking", next: "books", code: ["star", "bell", "tree", "gift"], letter: "S",
        unlock: "Ho ho ho! Not filled yet... but they're full of magic now." },
      { n: 2, at: "books", hideAt: "On the bookshelf", next: "fridge", code: ["mitten", "house", "holly", "star"], letter: "N",
        unlock: "Every good story needs a clever detective. I think that might be you!" },
      { n: 3, at: "fridge", hideAt: "On the fridge door", next: "table", code: ["gift", "stocking", "bell", "mitten"], letter: "O",
        unlock: "Brrr! That clue was chilly. Good thing you're quick." },
      { n: 4, at: "table", hideAt: "Under a dinner table chair", next: "couch", code: ["tree", "holly", "house", "stocking"], letter: "W",
        unlock: "Save me a seat at Christmas dinner!" },
      { n: 5, at: "couch", hideAt: "Under a couch cushion", next: "window", code: ["bell", "mitten", "star", "holly"], letter: "F",
        unlock: "Cushion magic! You're getting very good at this." },
      { n: 6, at: "window", hideAt: "By a window", next: "boots", code: ["stocking", "tree", "gift", "house"], letter: "L",
        unlock: "Was that a reindeer outside? Keep going!" },
      { n: 7, at: "boots", hideAt: "With the coats and boots", next: "bath", code: ["holly", "star", "stocking", "bell"], letter: "A",
        unlock: "Let's stay warm. The magic is getting stronger." },
      { n: 8, at: "bath", hideAt: "Inside the (dry!) bathtub", next: "bed", code: ["house", "gift", "mitten", "tree"], letter: "K",
        unlock: "Splish splash! The magic loves a bubble bath." },
      { n: 9, at: "bed", hideAt: "Under the blanket on a bed", next: "kitchen", code: ["star", "stocking", "house", "mitten"], letter: "E",
        unlock: "No napping yet! Only one more clue to go." },
      { n: 10, at: "kitchen", hideAt: "In the kitchen, by the cookies", next: "tree", code: ["gift", "holly", "tree", "bell"], letter: "S",
        unlock: "That's all ten! The magic is gathering under the Christmas tree..." },
    ].map(function (c) { c.riddle = null; return c; }),

    finale: {
      big: { heading: "You found the magic, {names}!", headingNoName: "You found the magic!", body: "You cracked every code and spelled the magic word. Now tap the present to open your surprise!" },
      little: { heading: "You found all the magic, {names}!", headingNoName: "You found all the magic!", body: "Ten magic snowflakes! Now tap the present to open your surprise!" },
      earned: "You've earned",
      tapGift: "Tap the present to open it",
      defaultSurprise: "a Christmas surprise",
      signoff: "Merry Christmas, love",
    },
    surprise: {
      label: "What surprise have they earned?",
      help: "They'll see it at the very end, under the tree.",
      ideas: ["Hot chocolate", "An early present", "A big hug", "A Christmas movie night", "Cookie decorating"],
    },

    // ---- Printables copy
    letter: {
      greeting: "Dear Magic Finder,",
      paragraphs: [
        "Every Christmas, a little magic sparkles off my sleigh as I fly over the rooftops. This year, some of it landed in YOUR house! It's hiding in ten secret places, and I need a clever helper to find it all.",
        "First, you'll need the Magic Finder on your grown-up's phone. It's locked, and only a secret password will open it. Turn this letter over, dip your brush in paint and paint the back. The password will appear, just like frost on a window.",
        "Once it's open, the Magic Finder will give you your first riddle. Every clue you find has a picture code. Tap it in and the magic will sparkle. Find all ten and the magic will lead you to a surprise.",
        "Good luck. The reindeer and I are cheering for you!",
      ],
      signoff: "With love and a twinkle,",
      postscript: "P.S. Stuck? Grown-ups know a little bit of magic too.",
    },
    board: {
      heading: "Magic Collector",
      instructions: "Each time you find the magic, colour in that ornament. Big Detectives: write your secret letter inside it too.",
      wordLabel: "The magic word is",
      treasureLabel: "My surprise was",
      nameLabel: "Official Magic Finder(s)",
    },
    treasureSign: { heading: "You found the magic!", body: "Merry Christmas" }, // put this under the tree with the surprise

    guide: {
      levelUp: [
        ["Make the knock count", "Knock loudly or ring the bell, then hide! Leave the letter on the doormat with a jingle bell or a sprinkle of paper snowflakes."],
        ["Candy-cane rewards", "Tuck a candy cane beside each clue as a tiny prize for every find."],
        ["Lights-out hunt", "Play after dark with a torch on Christmas Eve. Fairy lights near each hiding spot add extra glow."],
        ["Cocoa finale", "Make the surprise a hot-cocoa station under the tree: mugs, marshmallows and a note from Santa."],
        ["Siblings of different ages", "Pair a Big Detective with a Little Helper: the little one taps the pictures, the big one reads the riddles."],
      ],
      playlist: [
        ["Linus and Lucy", "Vince Guaraldi Trio"],
        ["Sleigh Ride", "Leroy Anderson"],
        ["Dance of the Sugar Plum Fairy", "Tchaikovsky"],
        ["Christmas Time Is Here (Instrumental)", "Vince Guaraldi Trio"],
        ["Troika", "Prokofiev"],
        ["Carol of the Bells", "Leontovych (instrumental)"],
      ],
    },
  };
  const T = window.HUNT_THEMES.christmas;
  T.clues.forEach((c) => (c.riddle = T.riddles[c.next]));
})();
