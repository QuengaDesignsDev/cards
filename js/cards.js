/* ============================================================
   OMNIVERSE TCG — Card Database
   Rarity: c common · u uncommon · r rare · e epic · l legendary · m mythic
   ============================================================ */

const CATEGORIES = {
  animals:   { name: 'Wild Kingdom',  icon: '🦁', hue: 95  },
  machines:  { name: 'Machines',      icon: '🏎️', hue: 8   },
  landmarks: { name: 'Landmarks',     icon: '🗼', hue: 40  },
  nations:   { name: 'Nations',       icon: '🌍', hue: 205 },
  myth:      { name: 'Mythic Beings', icon: '🐉', hue: 275 },
  cosmos:    { name: 'Cosmos',        icon: '🪐', hue: 235 },
  ocean:     { name: 'Deep Ocean',    icon: '🌊', hue: 190 },
  dino:      { name: 'Prehistoric',   icon: '🦖', hue: 130 },
  sports:    { name: 'Sports Arena',  icon: '🏆', hue: 25  },
  screen:    { name: 'Screen & Stage', icon: '🎬', hue: 325 },
  minerals:  { name: 'Rocks & Minerals', icon: '🪨', hue: 265 },
};

const RARITIES = {
  c: { name: 'Common',    sell: 5,   color: '#9aa5b1' },
  u: { name: 'Uncommon',  sell: 12,  color: '#4ade80' },
  r: { name: 'Rare',      sell: 35,  color: '#38bdf8' },
  e: { name: 'Epic',      sell: 90,  color: '#c084fc' },
  l: { name: 'Legendary', sell: 250, color: '#fbbf24' },
  m: { name: 'Mythic',    sell: 700, color: '#fb7185' },
};

let _id = 0;
function _c(cat, rar, emoji, name, pow, lore) {
  return { id: ++_id, cat, rar, emoji, name, pow, lore };
}

const CARDS = [
  // ---------- WILD KINGDOM ----------
  _c('animals', 'c', '🐇', 'Meadow Rabbit', 12, 'Fast ears, faster feet.'),
  _c('animals', 'c', '🦊', 'Red Fox', 24, 'The forest’s cleverest trickster.'),
  _c('animals', 'c', '🐿️', 'Squirrel Scout', 10, 'Has buried treasure it will never find.'),
  _c('animals', 'c', '🦉', 'Barn Owl', 28, 'Sees everything. Says nothing.'),
  _c('animals', 'c', '🐢', 'Old Tortoise', 15, 'Slow is a strategy, not a weakness.'),
  _c('animals', 'c', '🐧', 'Emperor Penguin', 22, 'Marches through blizzards in a tuxedo.'),
  _c('animals', 'u', '🐺', 'Timber Wolf', 55, 'Never hunts alone.'),
  _c('animals', 'u', '🦅', 'Bald Eagle', 68, 'Owns the sky by inheritance.'),
  _c('animals', 'u', '🐆', 'Cheetah', 74, '0 to 100 in three seconds flat.'),
  _c('animals', 'u', '🦍', 'Silverback Gorilla', 78, 'Strength wrapped in patience.'),
  _c('animals', 'u', '🐘', 'African Elephant', 72, 'Remembers everyone who was kind.'),
  _c('animals', 'r', '🐅', 'Bengal Tiger', 118, 'Stripes are a warning, not a decoration.'),
  _c('animals', 'r', '🐻‍❄️', 'Polar Bear', 110, 'The Arctic’s quiet monarch.'),
  _c('animals', 'r', '🦏', 'White Rhino', 105, 'A living tank with a gentle heart.'),
  _c('animals', 'e', '🦁', 'Lion King', 168, 'The savanna answers to one roar.'),
  _c('animals', 'e', '🦚', 'Royal Peacock', 150, 'Beauty as a weapon.'),
  _c('animals', 'l', '🐉', 'Komodo Sovereign', 240, 'The last true dragon walks among us.'),
  _c('animals', 'm', '🦄', 'Alba, First Unicorn', 340, 'Seen once per lifetime, remembered forever.'),

  // ---------- MACHINES ----------
  _c('machines', 'c', '🛴', 'City Scooter', 8, 'Top speed: embarrassing. Fun: maximum.'),
  _c('machines', 'c', '🚲', 'Fixed-Gear Bike', 14, 'No brakes, no fear.'),
  _c('machines', 'c', '🚜', 'Farm Tractor', 20, 'Feeds the world one furrow at a time.'),
  _c('machines', 'c', '🚕', 'Yellow Cab', 18, 'Knows every shortcut and every story.'),
  _c('machines', 'c', '🚌', 'Night Bus', 16, 'Always arrives. Eventually.'),
  _c('machines', 'c', '⛵', 'Harbor Sloop', 22, 'Powered entirely by patience and wind.'),
  _c('machines', 'u', '🏍️', 'Superbike', 62, 'Two wheels, zero compromise.'),
  _c('machines', 'u', '🚂', 'Iron Locomotive', 58, 'A century of thunder on rails.'),
  _c('machines', 'u', '🚁', 'Rescue Helicopter', 66, 'Hope with rotor blades.'),
  _c('machines', 'u', '🛥️', 'Speedboat GT', 60, 'Leaves the ocean in stitches.'),
  _c('machines', 'r', '🏎️', 'Formula Apex', 128, 'Downforce heavier than the car itself.'),
  _c('machines', 'r', '✈️', 'Supersonic Jet', 122, 'Outruns its own sound.'),
  _c('machines', 'r', '🚢', 'Titan Freighter', 100, 'Carries a small city across the sea.'),
  _c('machines', 'e', '🚄', 'Maglev Bullet', 165, 'Floats on magnetism at 600 km/h.'),
  _c('machines', 'e', '🛰️', 'Orbital Satellite', 158, 'Watches the whole world blink.'),
  _c('machines', 'l', '🚀', 'Heavy-Lift Rocket', 260, 'Gravity’s only rival.'),
  _c('machines', 'm', '🛸', 'The Visitor', 360, 'Registered in no nation, seen in all of them.'),

  // ---------- LANDMARKS ----------
  _c('landmarks', 'c', '🏠', 'Countryside Cottage', 9, 'Small roof, big memories.'),
  _c('landmarks', 'c', '⛲', 'Old Town Fountain', 12, 'Every coin is a wish on layaway.'),
  _c('landmarks', 'c', '🌉', 'River Footbridge', 15, 'Connecting two neighborhoods since forever.'),
  _c('landmarks', 'c', '⛪', 'Village Chapel', 17, 'Its bell sets the valley’s clock.'),
  _c('landmarks', 'c', '🎡', 'Boardwalk Ferris Wheel', 19, 'The slowest thrill ride on Earth.'),
  _c('landmarks', 'u', '🏟️', 'Grand Stadium', 52, 'Ninety thousand hearts, one scoreboard.'),
  _c('landmarks', 'u', '🕌', 'Blue Mosque', 64, 'Six minarets against the Istanbul sky.'),
  _c('landmarks', 'u', '⛩️', 'Floating Torii', 62, 'The gate between tides and spirits.'),
  _c('landmarks', 'u', '🏰', 'Highland Castle', 68, 'Walls that outlasted every siege.'),
  _c('landmarks', 'r', '🗼', 'Eiffel Tower', 112, 'A temporary exhibit, 130 years and counting.'),
  _c('landmarks', 'r', '🗽', 'Statue of Liberty', 116, 'A gift that greets the world.'),
  _c('landmarks', 'r', '🏛️', 'The Parthenon', 108, 'Democracy’s marble birthplace.'),
  _c('landmarks', 'e', '🕋', 'Great Pyramid', 175, 'The oldest wonder still standing.'),
  _c('landmarks', 'e', '🏯', 'Himeji Castle', 155, 'The white heron that never burned.'),
  _c('landmarks', 'l', '🌁', 'Golden Gate', 235, 'Fog’s favorite bridge.'),
  _c('landmarks', 'm', '🏔️', 'Everest Summit', 330, 'The one place the sky must look up to.'),

  // ---------- NATIONS ----------
  _c('nations', 'c', '🇵🇹', 'Portugal', 20, 'Navigators at the edge of the map.'),
  _c('nations', 'c', '🇳🇿', 'New Zealand', 22, 'More sheep than people, more views than both.'),
  _c('nations', 'c', '🇨🇭', 'Switzerland', 25, 'Neutral in war, undefeated in chocolate.'),
  _c('nations', 'c', '🇰🇷', 'South Korea', 26, 'From war rubble to world stage in one lifetime.'),
  _c('nations', 'c', '🇲🇽', 'Mexico', 24, 'Ancient pyramids, endless fiestas.'),
  _c('nations', 'u', '🇮🇹', 'Italy', 58, 'Empire, Renaissance, espresso.'),
  _c('nations', 'u', '🇫🇷', 'France', 60, 'Revolution served with pastry.'),
  _c('nations', 'u', '🇬🇧', 'United Kingdom', 62, 'An island that mapped the world.'),
  _c('nations', 'u', '🇧🇷', 'Brazil', 56, 'The rainforest’s heartbeat, football’s soul.'),
  _c('nations', 'u', '🇪🇬', 'Egypt', 64, 'Five thousand years of receipts.'),
  _c('nations', 'r', '🇯🇵', 'Japan', 115, 'Where tradition and tomorrow share a train.'),
  _c('nations', 'r', '🇮🇳', 'India', 112, 'A billion stories in a thousand tongues.'),
  _c('nations', 'r', '🇺🇸', 'United States', 118, 'Fifty states, one moon landing.'),
  _c('nations', 'e', '🇨🇳', 'China', 160, 'The wall visible from history itself.'),
  _c('nations', 'e', '🇬🇷', 'Greece', 152, 'Invented the word for everything.'),
  _c('nations', 'l', '🏺', 'Roman Empire', 245, 'All roads still lead here.'),
  _c('nations', 'm', '🌐', 'Pangaea', 350, 'Every nation, before there were any.'),

  // ---------- MYTHIC BEINGS ----------
  _c('myth', 'c', '🧚', 'Garden Sprite', 14, 'Blames the wind for everything it breaks.'),
  _c('myth', 'c', '🧌', 'Bridge Troll', 21, 'Toll: one riddle or two snacks.'),
  _c('myth', 'c', '👻', 'Manor Ghost', 18, 'Just wants the house kept tidy.'),
  _c('myth', 'c', '🧟', 'Graveyard Shambler', 16, 'Terrible at hide and seek.'),
  _c('myth', 'u', '🧜‍♀️', 'Siren of the Reef', 60, 'Her song has sunk a hundred ships.'),
  _c('myth', 'u', '🧙', 'Hedge Wizard', 58, 'Knows exactly one fireball. It’s enough.'),
  _c('myth', 'u', '🐺', 'Moonbound Werewolf', 66, 'Perfectly nice, 27 nights a month.'),
  _c('myth', 'u', '🧛', 'Count Nocturne', 70, 'Three centuries old, still hates garlic bread.'),
  _c('myth', 'r', '🦅', 'Thunderbird', 120, 'Storms follow in its wake.'),
  _c('myth', 'r', '🐴', 'Shadow Kelpie', 108, 'Never accept a ride from a river.'),
  _c('myth', 'r', '🗿', 'Stone Golem', 114, 'Loyal until the mountain reclaims it.'),
  _c('myth', 'e', '🔥', 'Ember Phoenix', 180, 'Its every death is a sunrise.'),
  _c('myth', 'e', '🐍', 'World Serpent', 172, 'Holds the oceans in a loop.'),
  _c('myth', 'l', '🐉', 'Aurelius, Gold Dragon', 270, 'Sleeps on the wealth of fallen kingdoms.'),
  _c('myth', 'l', '🦁', 'Celestial Sphinx', 255, 'Answer wrong and become part of the riddle.'),
  _c('myth', 'm', '⚡', 'Zeus, Sky Father', 380, 'The original thunder.'),

  // ---------- COSMOS ----------
  _c('cosmos', 'c', '☄️', 'Stray Comet', 18, 'A snowball on a million-year commute.'),
  _c('cosmos', 'c', '🌙', 'The Moon', 25, 'Earth’s oldest companion.'),
  _c('cosmos', 'c', '⭐', 'Dwarf Star', 15, 'Small, steady, and outliving everyone.'),
  _c('cosmos', 'c', '🛰️', 'Space Junk', 8, 'One nation’s satellite is another’s shooting star.'),
  _c('cosmos', 'u', '🔴', 'Mars', 55, 'The next address of humankind.'),
  _c('cosmos', 'u', '🌋', 'Io, Volcano Moon', 58, 'Four hundred active tempers.'),
  _c('cosmos', 'u', '💫', 'Meteor Shower', 52, 'The sky’s free fireworks.'),
  _c('cosmos', 'u', '🌕', 'Europa', 62, 'An ocean hiding under the ice.'),
  _c('cosmos', 'r', '🪐', 'Saturn', 125, 'The showoff with the rings.'),
  _c('cosmos', 'r', '🌪️', 'Great Red Spot', 112, 'A storm older than every nation.'),
  _c('cosmos', 'r', '🌠', 'Halley’s Comet', 110, 'See you in 2061.'),
  _c('cosmos', 'e', '🌞', 'The Sun', 185, 'Every ray is eight minutes of history.'),
  _c('cosmos', 'e', '🌀', 'Andromeda Galaxy', 170, 'Coming to a sky near you in 4 billion years.'),
  _c('cosmos', 'l', '🕳️', 'Sagittarius A*', 275, 'The quiet giant our galaxy orbits.'),
  _c('cosmos', 'm', '💥', 'The Big Bang', 400, 'The first card ever printed.'),

  // ---------- DEEP OCEAN ----------
  _c('ocean', 'c', '🐠', 'Coral Damselfish', 8, 'Small fish, big neighborhood.'),
  _c('ocean', 'c', '🦀', 'Rock Crab', 12, 'Walks sideways into every problem.'),
  _c('ocean', 'c', '🐡', 'Pufferfish', 16, 'Instant inflation, zero economics.'),
  _c('ocean', 'c', '🪼', 'Moon Jelly', 10, 'Drifting since before the dinosaurs.'),
  _c('ocean', 'c', '🦭', 'Harbor Seal', 20, 'A dog that chose the sea.'),
  _c('ocean', 'u', '🐬', 'Bottlenose Dolphin', 60, 'Smarter than half the passengers on any boat.'),
  _c('ocean', 'u', '🐙', 'Giant Octopus', 68, 'Nine brains, all of them plotting.'),
  _c('ocean', 'u', '🦈', 'Reef Shark', 64, 'Older than trees, still misunderstood.'),
  _c('ocean', 'u', '🐢', 'Leatherback Turtle', 58, 'Crosses oceans on memory alone.'),
  _c('ocean', 'r', '🦑', 'Colossal Squid', 118, 'Eyes the size of dinner plates, seen by almost no one.'),
  _c('ocean', 'r', '🐋', 'Humpback Whale', 115, 'Its song crosses entire oceans.'),
  _c('ocean', 'r', '⚓', 'Ghost Shipwreck', 105, 'Cargo: gold, barnacles, secrets.'),
  _c('ocean', 'e', '🦈', 'Great White', 178, 'The ocean’s apex headline.'),
  _c('ocean', 'e', '🐳', 'Blue Whale', 182, 'The largest heart that has ever beaten.'),
  _c('ocean', 'l', '🌊', 'Mariana Trench', 265, 'Deeper than Everest is tall.'),
  _c('ocean', 'm', '🐙', 'The Kraken', 370, 'Sailors’ tales are rarely this accurate.'),

  // ---------- PREHISTORIC ----------
  _c('dino', 'c', '🐛', 'Giant Millipede', 10, 'Two meters of nope.'),
  _c('dino', 'c', '🦎', 'Compsognathus', 14, 'Chicken-sized, dinosaur-hearted.'),
  _c('dino', 'c', '🐊', 'Deinosuchus', 24, 'A crocodile that ate dinosaurs for breakfast.'),
  _c('dino', 'c', '🐌', 'Ammonite', 9, 'Spiraled through 300 million years.'),
  _c('dino', 'u', '🦕', 'Stegosaurus', 56, 'Plates for show, tail spikes for business.'),
  _c('dino', 'u', '🦏', 'Triceratops', 66, 'Three horns, zero patience.'),
  _c('dino', 'u', '🐘', 'Woolly Mammoth', 62, 'The Ice Age’s gentle giant.'),
  _c('dino', 'u', '🐦', 'Archaeopteryx', 54, 'The first flight ever boarded.'),
  _c('dino', 'r', '🦅', 'Pteranodon', 112, 'A wingspan wider than a bus.'),
  _c('dino', 'r', '🐆', 'Smilodon', 116, 'Sabers included, manners optional.'),
  _c('dino', 'r', '🦕', 'Brachiosaurus', 108, 'Ate from the treetops, feared nothing below.'),
  _c('dino', 'e', '🦖', 'Velociraptor Pack', 176, 'Clever girls.'),
  _c('dino', 'e', '🐟', 'Megalodon', 184, 'The reason whales learned to migrate.'),
  _c('dino', 'l', '🦖', 'Tyrannosaurus Rex', 280, 'The king needs no introduction.'),
  _c('dino', 'm', '☄️', 'Chicxulub Impact', 390, 'The card that ended an era.'),

  // ---------- SPORTS ARENA ----------
  _c('sports', 'c', '⚽', 'Backyard Kickabout', 10, 'Jumpers for goalposts.'),
  _c('sports', 'c', '🏓', 'Garage Ping-Pong', 12, 'The championship table wobbles.'),
  _c('sports', 'c', '🎳', 'League Night Bowler', 14, 'One strike away from glory.'),
  _c('sports', 'c', '🏸', 'Park Shuttler', 11, 'The wind is the true opponent.'),
  _c('sports', 'c', '⛳', 'Weekend Golfer', 16, 'Blames the clubs.'),
  _c('sports', 'u', '🏀', 'Slam Dunk Ace', 58, 'Hangs in the air a little too long.'),
  _c('sports', 'u', '🥅', 'Brick Wall Keeper', 62, 'Nothing gets past. Nothing.'),
  _c('sports', 'u', '🏈', 'Hail Mary Hero', 60, 'Throws prayers that get answered.'),
  _c('sports', 'u', '🎾', 'Baseline Grinder', 56, 'Five sets? Just warming up.'),
  _c('sports', 'r', '⚾', 'Curveball King', 112, 'Physics files a complaint.'),
  _c('sports', 'r', '🥊', 'Southpaw Slugger', 118, 'The left you never see coming.'),
  _c('sports', 'r', '🏒', 'Hat-Trick Hero', 110, 'Three goals, one legend.'),
  _c('sports', 'e', '🏹', 'Bullseye Prodigy', 170, 'Splits arrows for fun.'),
  _c('sports', 'e', '🏋️', 'Iron Titan', 178, 'Warm-up weight: your max.'),
  _c('sports', 'l', '🥇', 'The G.O.A.T.', 265, 'Retired numbers in every league.'),
  _c('sports', 'm', '🏆', 'The Perfect Season', 385, 'Undefeated. Untied. Unrepeatable.'),

  // ---------- SCREEN & STAGE ----------
  _c('screen', 'c', '🎤', 'Karaoke Legend', 12, 'Off-key, on heart.'),
  _c('screen', 'c', '🍿', 'Popcorn Critic', 10, 'Two thumbs, always buttered.'),
  _c('screen', 'c', '📺', 'Laugh Track', 14, 'Ha. Ha. Ha.'),
  _c('screen', 'c', '🎭', 'Background Extra', 9, 'Blink and you’ll miss them. They noticed.'),
  _c('screen', 'c', '🧟', 'Zombie Extra #42', 15, 'Method actor. Ate the craft table.'),
  _c('screen', 'u', '🕵️', 'Detective Noir', 60, 'The rain knows what you did.'),
  _c('screen', 'u', '👯', 'Soap Opera Twin', 54, 'Returned from the dead. Twice.'),
  _c('screen', 'u', '🤠', 'Stunt Double', 64, 'Falls for a living.'),
  _c('screen', 'u', '🎬', 'Indie Director', 58, 'Three cameras, one dream.'),
  _c('screen', 'r', '🚀', 'Space Captain', 116, 'Boldly reruns forever.'),
  _c('screen', 'r', '🦸', 'Caped Crusader', 120, 'The reboot of the reboot.'),
  _c('screen', 'r', '🧙', 'Wizard Mentor', 108, 'Dies in act one. Returns in act three.'),
  _c('screen', 'e', '🦖', 'Kaiju Attack', 180, 'Filmed on location. Location destroyed.'),
  _c('screen', 'e', '📽️', 'Plot Twist', 168, 'It was the butler AND the twin.'),
  _c('screen', 'l', '🛡️', 'Plot Armor', 260, 'Cannot die before the finale.'),
  _c('screen', 'm', '🌟', 'Season Finale', 390, 'To be continued…'),

  // ---------- ROCKS & MINERALS ----------
  _c('minerals', 'c', '🪨', 'Pet Rock', 5, 'Loyal. Quiet. Rock solid.'),
  _c('minerals', 'c', '🧱', 'Humble Brick', 8, 'One of history’s greatest team players.'),
  _c('minerals', 'c', '🏖️', 'Sand Grain', 3, 'Small. Countless. Inevitable.'),
  _c('minerals', 'c', '⚪', 'River Pebble', 6, 'Skipped four times. A record.'),
  _c('minerals', 'u', '🔮', 'Quartz Cluster', 52, 'Charged under a full moon, allegedly.'),
  _c('minerals', 'u', '🖤', 'Obsidian Shard', 58, 'Sharp enough to cut time.'),
  _c('minerals', 'u', '✨', 'Fool’s Gold', 50, 'Fooled everyone but the assayer.'),
  _c('minerals', 'u', '🧂', 'Salt Crystal', 48, 'Ancient currency, modern seasoning.'),
  _c('minerals', 'r', '🥚', 'Cracked Geode', 108, 'Ugly outside, galaxy inside.'),
  _c('minerals', 'r', '💜', 'Amethyst Spire', 112, 'Grown one drip at a time for ages.'),
  _c('minerals', 'r', '🌋', 'Lava Bomb', 115, 'Freshly delivered by volcano.'),
  _c('minerals', 'e', '💎', 'Flawless Diamond', 176, 'Pressure made it unbreakable.'),
  _c('minerals', 'e', '🧊', 'Opal Fire', 165, 'Every angle, a different sunset.'),
  _c('minerals', 'l', '☄️', 'Meteorite Core', 262, 'Older than the planet it landed on.'),
  _c('minerals', 'm', '🪄', 'Philosopher’s Stone', 395, 'Turns everything to gold, allegedly.'),
];

const CARDS_BY_ID = Object.fromEntries(CARDS.map(c => [c.id, c]));

/* Signature move names per category, indexed by rarity tier (c/u, r/e, l/m). */
const MOVES = {
  animals:   ['Wild Swipe', 'Apex Pounce', "King's Judgment"],
  machines:  ['Turbo Dash', 'Sonic Overdrive', 'Orbital Strike'],
  landmarks: ['Stone Stand', 'Monument Crush', 'Wonder of Ages'],
  nations:   ['Rally Cry', 'Border Surge', 'Age of Glory'],
  myth:      ['Hex Bolt', 'Arcane Burst', 'Divine Wrath'],
  cosmos:    ['Star Spark', 'Nova Flare', 'Event Horizon'],
  ocean:     ['Bubble Jet', 'Abyssal Grip', "Kraken's Embrace"],
  dino:      ['Fossil Bite', 'Primal Crunch', 'Extinction Stomp'],
  sports:    ['Warm-Up Lap', 'Power Play', 'Championship Point'],
  screen:    ['Cold Open', 'Dramatic Zoom', 'Series Finale'],
  minerals:  ['Rock Toss', 'Crystal Lance', 'Tectonic Slam'],
};

function moveFor(card) {
  const tier = { c: 0, u: 0, r: 1, e: 1, l: 2, m: 2 }[card.rar];
  return { name: MOVES[card.cat][tier], cost: tier + 1 };
}

/* Pack definitions. cats: null = all categories. odds: per-slot rarity tables. */
const STANDARD_ODDS = [
  { c: 70, u: 25, r: 5 },
  { c: 70, u: 25, r: 5 },
  { c: 55, u: 35, r: 10 },
  { u: 60, r: 31, e: 8, l: 1 },
  { r: 58, e: 30, l: 10, m: 2 },
];
const STELLAR_ODDS = [
  { u: 60, r: 40 },
  { u: 50, r: 45, e: 5 },
  { r: 70, e: 30 },
  { r: 40, e: 48, l: 12 },
  { e: 55, l: 36, m: 9 },
];

const PACKS = [
  {
    id: 'universal', name: 'Universal Pack', cost: 100, cats: null,
    icon: '🌌', grad: ['#312e81', '#7c3aed', '#0ea5e9'],
    blurb: 'Five cards from anywhere in the universe.',
    odds: STANDARD_ODDS,
  },
  {
    id: 'beast', name: 'Beast Pack', cost: 120, cats: ['animals', 'ocean', 'dino'],
    icon: '🐾', grad: ['#14532d', '#16a34a', '#a3e635'],
    blurb: 'Wild animals, deep-sea life, and prehistoric giants.',
    odds: STANDARD_ODDS,
  },
  {
    id: 'voyager', name: 'Voyager Pack', cost: 120, cats: ['landmarks', 'nations', 'machines'],
    icon: '🧭', grad: ['#7c2d12', '#ea580c', '#fbbf24'],
    blurb: 'Landmarks, nations, and the machines that connect them.',
    odds: STANDARD_ODDS,
  },
  {
    id: 'arcane', name: 'Arcane Pack', cost: 140, cats: ['myth', 'cosmos'],
    icon: '🔮', grad: ['#2e1065', '#9333ea', '#f0abfc'],
    blurb: 'Mythic beings and the mysteries of deep space.',
    odds: STANDARD_ODDS,
  },
  {
    id: 'champions', name: 'Champions Pack', cost: 120, cats: ['sports'],
    icon: '🏆', grad: ['#7f1d1d', '#ea580c', '#facc15'],
    blurb: 'Legends of every arena, court, and field.',
    odds: STANDARD_ODDS,
  },
  {
    id: 'showtime', name: 'Showtime Pack', cost: 120, cats: ['screen'],
    icon: '🎬', grad: ['#4a044e', '#c026d3', '#f9a8d4'],
    blurb: 'Stars, tropes, and plot twists of the screen.',
    odds: STANDARD_ODDS,
  },
  {
    id: 'bedrock', name: 'Bedrock Pack', cost: 120, cats: ['minerals'],
    icon: '💎', grad: ['#1e1b4b', '#7c3aed', '#c4b5fd'],
    blurb: 'From a humble pet rock to the Philosopher’s Stone.',
    odds: STANDARD_ODDS,
  },
  {
    id: 'stellar', name: 'Stellar Pack', cost: 400, cats: null,
    icon: '💠', grad: ['#0c4a6e', '#0ea5e9', '#f0f9ff'],
    blurb: 'Premium odds. No commons. Guaranteed epic or better.',
    odds: STELLAR_ODDS,
  },
];
