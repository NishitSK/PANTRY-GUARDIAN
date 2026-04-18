/**
 * Pantry Guardian — Shelf-Life Knowledge Base
 *
 * Provides realistic, research-backed shelf-life defaults for common grocery
 * items. This is used by the products API when creating new product records
 * (e.g. from receipt scanning) to avoid falling back to the generic 7-day
 * placeholder.
 *
 * Values are intentionally conservative where food safety matters (meat, dairy)
 * and generous where scientifically supported (honey, dry spices, rice).
 *
 * Structure per entry:
 *   base            Baseline days used when storage method is unknown
 *   room            Days at 18-25°C room temperature
 *   fridge          Days refrigerated (2-5°C)
 *   freezer         Days frozen (≤-18°C)
 *   defaultStorage  'room' | 'fridge' | 'freezer'
 *   category        Canonical category label (matches seed.js)
 *   scoreLabel      What to call the "freshness" metric for this item type
 *   notes           Human-readable storage tip
 */

export type ShelfLifeEntry = {
  base: number
  room: number
  fridge: number
  freezer: number
  defaultStorage: 'room' | 'fridge' | 'freezer'
  category: string
  scoreLabel: 'Condition' | 'Pantry health' | 'Shelf life' | 'Quality'
  notes: string
}

// ─── Pantry Stable Items ─────────────────────────────────────────────────────
// Items with very long real-world shelf lives. Many users don't realise honey
// never truly expires; spices lose potency but stay safe for years.

const PANTRY_STAPLES: Record<string, ShelfLifeEntry> = {
  honey: {
    base: 730, room: 730, fridge: 365, freezer: 0,
    defaultStorage: 'room', category: 'Pantry Staples',
    scoreLabel: 'Pantry health',
    notes: 'Honey has an indefinite shelf life if stored sealed. Score reflects jar freshness, not safety.',
  },
  cinnamon: {
    base: 730, room: 730, fridge: 0, freezer: 0,
    defaultStorage: 'room', category: 'Pantry Staples',
    scoreLabel: 'Pantry health',
    notes: 'Ground cinnamon retains peak flavour for ~2 years. Score reflects potency, not spoilage risk.',
  },
  salt: { base: 3650, room: 3650, fridge: 0, freezer: 0, defaultStorage: 'room', category: 'Pantry Staples', scoreLabel: 'Shelf life', notes: 'Salt does not expire.' },
  sugar: { base: 1825, room: 1825, fridge: 0, freezer: 0, defaultStorage: 'room', category: 'Pantry Staples', scoreLabel: 'Shelf life', notes: 'Indefinite if kept dry and sealed.' },
  rice: { base: 730, room: 730, fridge: 1095, freezer: 1460, defaultStorage: 'room', category: 'Pantry Staples', scoreLabel: 'Shelf life', notes: 'White/basmati rice lasts 2+ years sealed.' },
  'basmati rice': { base: 730, room: 730, fridge: 1095, freezer: 1460, defaultStorage: 'room', category: 'Pantry Staples', scoreLabel: 'Shelf life', notes: 'Store sealed in a cool, dark place.' },
  pasta: { base: 730, room: 730, fridge: 1095, freezer: 1460, defaultStorage: 'room', category: 'Pantry Staples', scoreLabel: 'Shelf life', notes: 'Dry pasta keeps for 2 years.' },
  flour: { base: 240, room: 240, fridge: 365, freezer: 730, defaultStorage: 'room', category: 'Pantry Staples', scoreLabel: 'Shelf life', notes: 'All-purpose flour: 6-12 months room temp.' },
  atta: { base: 90, room: 90, fridge: 180, freezer: 365, defaultStorage: 'room', category: 'Pantry Staples', scoreLabel: 'Shelf life', notes: 'Whole-wheat atta: 3 months at room temp, longer refrigerated.' },
  maida: { base: 365, room: 365, fridge: 730, freezer: 1095, defaultStorage: 'room', category: 'Pantry Staples', scoreLabel: 'Shelf life', notes: 'Refined flour: ~1 year room temp.' },
  'olive oil': { base: 365, room: 365, fridge: 730, freezer: 0, defaultStorage: 'room', category: 'Pantry Staples', scoreLabel: 'Pantry health', notes: 'Unopened: 18-24 months. Opened: 3-6 months. Store away from heat and light.' },
  oil: { base: 365, room: 365, fridge: 730, freezer: 0, defaultStorage: 'room', category: 'Pantry Staples', scoreLabel: 'Pantry health', notes: 'Most cooking oils: ~1 year unopened.' },
  turmeric: { base: 1095, room: 1095, fridge: 0, freezer: 0, defaultStorage: 'room', category: 'Pantry Staples', scoreLabel: 'Pantry health', notes: 'Ground turmeric retains peak colour and flavour for up to 3 years.' },
  haldi: { base: 1095, room: 1095, fridge: 0, freezer: 0, defaultStorage: 'room', category: 'Pantry Staples', scoreLabel: 'Pantry health', notes: 'Same as turmeric — 3 years peak potency.' },
  jeera: { base: 730, room: 730, fridge: 0, freezer: 0, defaultStorage: 'room', category: 'Pantry Staples', scoreLabel: 'Pantry health', notes: 'Cumin seeds retain flavour ~2 years sealed.' },
  cumin: { base: 730, room: 730, fridge: 0, freezer: 0, defaultStorage: 'room', category: 'Pantry Staples', scoreLabel: 'Pantry health', notes: '~2 years for whole seeds, ~1 year ground.' },
  pepper: { base: 1095, room: 1095, fridge: 0, freezer: 0, defaultStorage: 'room', category: 'Pantry Staples', scoreLabel: 'Pantry health', notes: 'Whole peppercorns last 3-4 years; ground ~2-3 years.' },
  chilli: { base: 730, room: 730, fridge: 0, freezer: 0, defaultStorage: 'room', category: 'Pantry Staples', scoreLabel: 'Pantry health', notes: 'Dried/ground chilli: ~2 years.' },
  'garam masala': { base: 730, room: 730, fridge: 0, freezer: 0, defaultStorage: 'room', category: 'Pantry Staples', scoreLabel: 'Pantry health', notes: 'Spice blend: ~2 years peak flavour.' },
  cardamom: { base: 1095, room: 1095, fridge: 0, freezer: 0, defaultStorage: 'room', category: 'Pantry Staples', scoreLabel: 'Pantry health', notes: 'Whole pods: 3 years. Ground: ~1 year.' },
  elaichi: { base: 1095, room: 1095, fridge: 0, freezer: 0, defaultStorage: 'room', category: 'Pantry Staples', scoreLabel: 'Pantry health', notes: 'Same as cardamom.' },
  vinegar: { base: 1825, room: 1825, fridge: 0, freezer: 0, defaultStorage: 'room', category: 'Pantry Staples', scoreLabel: 'Shelf life', notes: 'Indefinite shelf life due to acidity.' },
  soy_sauce: { base: 730, room: 730, fridge: 1095, freezer: 0, defaultStorage: 'room', category: 'Pantry Staples', scoreLabel: 'Pantry health', notes: 'Unopened: ~2 years. Opened: refrigerate and use within 1 year.' },
  pickle: { base: 365, room: 365, fridge: 730, freezer: 0, defaultStorage: 'room', category: 'Pantry Staples', scoreLabel: 'Pantry health', notes: 'Commercial pickles: 1-2 years.' },
  ghee: { base: 365, room: 90, fridge: 365, freezer: 1095, defaultStorage: 'room', category: 'Pantry Staples', scoreLabel: 'Pantry health', notes: 'Unopened: 1 year room temp. Opened: 3 months room, 1 year fridge.' },
  mustard: { base: 730, room: 365, fridge: 1095, freezer: 0, defaultStorage: 'room', category: 'Pantry Staples', scoreLabel: 'Pantry health', notes: 'Prepared mustard: 1 year room, 3 years refrigerated.' },
  ketchup: { base: 365, room: 180, fridge: 365, freezer: 0, defaultStorage: 'room', category: 'Pantry Staples', scoreLabel: 'Pantry health', notes: 'Refrigerate after opening.' },
  jam: { base: 365, room: 180, fridge: 730, freezer: 0, defaultStorage: 'room', category: 'Pantry Staples', scoreLabel: 'Pantry health', notes: 'Unopened: 1-2 years. Opened: 6 months refrigerated.' },
  oats: { base: 730, room: 730, fridge: 1095, freezer: 1460, defaultStorage: 'room', category: 'Pantry Staples', scoreLabel: 'Shelf life', notes: 'Rolled oats: 2 years room temp.' },
  lentils: { base: 730, room: 730, fridge: 0, freezer: 0, defaultStorage: 'room', category: 'Pantry Staples', scoreLabel: 'Shelf life', notes: 'Dried lentils: 2-3 years.' },
  dal: { base: 730, room: 730, fridge: 0, freezer: 0, defaultStorage: 'room', category: 'Pantry Staples', scoreLabel: 'Shelf life', notes: 'Dried dal: 2 years.' },
  'canned goods': { base: 730, room: 730, fridge: 0, freezer: 0, defaultStorage: 'room', category: 'Pantry Staples', scoreLabel: 'Shelf life', notes: 'Commercially canned goods: 2-5 years.' },
  noodles: { base: 730, room: 730, fridge: 0, freezer: 0, defaultStorage: 'room', category: 'Pantry Staples', scoreLabel: 'Shelf life', notes: 'Dry noodles: 2 years.' },
  semolina: { base: 730, room: 730, fridge: 0, freezer: 0, defaultStorage: 'room', category: 'Pantry Staples', scoreLabel: 'Shelf life', notes: 'Suji/rava: 2 years sealed.' },
  suji: { base: 730, room: 730, fridge: 0, freezer: 0, defaultStorage: 'room', category: 'Pantry Staples', scoreLabel: 'Shelf life', notes: 'Semolina: 2 years sealed.' },
  poha: { base: 365, room: 365, fridge: 0, freezer: 0, defaultStorage: 'room', category: 'Pantry Staples', scoreLabel: 'Shelf life', notes: 'Flattened rice: ~1 year.' },
  'baking powder': { base: 365, room: 365, fridge: 0, freezer: 0, defaultStorage: 'room', category: 'Pantry Staples', scoreLabel: 'Shelf life', notes: 'Baking powder: 1 year.' },
  'baking soda': { base: 730, room: 730, fridge: 0, freezer: 0, defaultStorage: 'room', category: 'Pantry Staples', scoreLabel: 'Shelf life', notes: 'Baking soda: 2+ years sealed.' },
  cornflour: { base: 730, room: 730, fridge: 0, freezer: 0, defaultStorage: 'room', category: 'Pantry Staples', scoreLabel: 'Shelf life', notes: 'Cornstarch/cornflour: 2 years.' },
  vermicelli: { base: 365, room: 365, fridge: 0, freezer: 0, defaultStorage: 'room', category: 'Pantry Staples', scoreLabel: 'Shelf life', notes: 'Dry vermicelli: ~1 year.' },
  nuts: { base: 365, room: 180, fridge: 365, freezer: 730, defaultStorage: 'room', category: 'Pantry Staples', scoreLabel: 'Pantry health', notes: 'Nuts: 3-6 months room, 1 year fridge to avoid rancidity.' },
  almonds: { base: 365, room: 180, fridge: 365, freezer: 730, defaultStorage: 'room', category: 'Pantry Staples', scoreLabel: 'Pantry health', notes: 'Almonds: 6 months room, 1 year fridge.' },
  cashews: { base: 365, room: 180, fridge: 365, freezer: 730, defaultStorage: 'room', category: 'Pantry Staples', scoreLabel: 'Pantry health', notes: 'Cashews: 6 months room, 1 year fridge.' },
  'coconut oil': { base: 730, room: 730, fridge: 0, freezer: 0, defaultStorage: 'room', category: 'Pantry Staples', scoreLabel: 'Pantry health', notes: 'Coconut oil: 2 years unopened.' },
  tea: { base: 730, room: 730, fridge: 0, freezer: 0, defaultStorage: 'room', category: 'Pantry Staples', scoreLabel: 'Pantry health', notes: 'Loose-leaf or bagged tea: ~2 years sealed.' },
  coffee: { base: 365, room: 180, fridge: 365, freezer: 730, defaultStorage: 'room', category: 'Pantry Staples', scoreLabel: 'Pantry health', notes: 'Whole beans: 6 months room, 1 year frozen. Ground: 3-5 months.' },
  'soda / sparkling water': { base: 270, room: 270, fridge: 365, freezer: 0, defaultStorage: 'room', category: 'Beverages', scoreLabel: 'Quality', notes: 'Unopened: 6-9 months. Stays safe but loses carbonation.' },
}

// ─── Fresh Produce ────────────────────────────────────────────────────────────

const FRESH_PRODUCE: Record<string, ShelfLifeEntry> = {
  apple: { base: 14, room: 14, fridge: 42, freezer: 365, defaultStorage: 'room', category: 'Fresh Fruits', scoreLabel: 'Condition', notes: 'Store in cool place. Refrigerate for longest life.' },
  apples: { base: 14, room: 14, fridge: 42, freezer: 365, defaultStorage: 'room', category: 'Fresh Fruits', scoreLabel: 'Condition', notes: 'Store in cool place. Refrigerate for longest life.' },
  banana: { base: 5, room: 5, fridge: 7, freezer: 90, defaultStorage: 'room', category: 'Fresh Fruits', scoreLabel: 'Condition', notes: 'Ripen at room temp; refrigerate once ripe.' },
  bananas: { base: 5, room: 5, fridge: 7, freezer: 90, defaultStorage: 'room', category: 'Fresh Fruits', scoreLabel: 'Condition', notes: 'Ripen at room temp; refrigerate once ripe.' },
  orange: { base: 14, room: 14, fridge: 28, freezer: 180, defaultStorage: 'room', category: 'Fresh Fruits', scoreLabel: 'Condition', notes: 'Room temp up to 2 weeks; fridge up to 4 weeks.' },
  mango: { base: 5, room: 5, fridge: 14, freezer: 365, defaultStorage: 'room', category: 'Fresh Fruits', scoreLabel: 'Condition', notes: 'Ripen at room temp, then refrigerate.' },
  grapes: { base: 7, room: 2, fridge: 14, freezer: 365, defaultStorage: 'fridge', category: 'Fresh Fruits', scoreLabel: 'Condition', notes: 'Refrigerate unwashed; wash just before eating.' },
  strawberries: { base: 3, room: 1, fridge: 7, freezer: 180, defaultStorage: 'fridge', category: 'Fresh Fruits', scoreLabel: 'Condition', notes: 'Very perishable; refrigerate and eat within a week.' },
  lemon: { base: 14, room: 7, fridge: 21, freezer: 120, defaultStorage: 'room', category: 'Fresh Fruits', scoreLabel: 'Condition', notes: 'Room temp 1 week; fridge up to 3 weeks.' },
  pomegranate: { base: 14, room: 7, fridge: 60, freezer: 365, defaultStorage: 'room', category: 'Fresh Fruits', scoreLabel: 'Condition', notes: 'Whole pomegranate can be refrigerated for up to 2 months.' },
  coconut: { base: 7, room: 7, fridge: 14, freezer: 90, defaultStorage: 'room', category: 'Fresh Fruits', scoreLabel: 'Condition', notes: 'Whole fresh coconut: 1-2 weeks. Refrigerate opened.' },
  nariyal: { base: 7, room: 7, fridge: 14, freezer: 90, defaultStorage: 'room', category: 'Fresh Fruits', scoreLabel: 'Condition', notes: 'Fresh coconut: use within 2 weeks.' },
  papaya: { base: 5, room: 3, fridge: 7, freezer: 180, defaultStorage: 'room', category: 'Fresh Fruits', scoreLabel: 'Condition', notes: 'Ripen at room temp; refrigerate when ripe.' },
  guava: { base: 5, room: 3, fridge: 7, freezer: 180, defaultStorage: 'room', category: 'Fresh Fruits', scoreLabel: 'Condition', notes: 'Use within a week.' },
  tomato: { base: 7, room: 7, fridge: 14, freezer: 180, defaultStorage: 'room', category: 'Fresh Vegetables', scoreLabel: 'Condition', notes: 'Best flavor at room temp; refrigerate only when very ripe.' },
  tomatoes: { base: 7, room: 7, fridge: 14, freezer: 180, defaultStorage: 'room', category: 'Fresh Vegetables', scoreLabel: 'Condition', notes: 'Best flavor at room temperature.' },
  carrot: { base: 21, room: 7, fridge: 28, freezer: 365, defaultStorage: 'fridge', category: 'Fresh Vegetables', scoreLabel: 'Condition', notes: 'Remove greens; refrigerate for up to 4 weeks.' },
  carrots: { base: 21, room: 7, fridge: 28, freezer: 365, defaultStorage: 'fridge', category: 'Fresh Vegetables', scoreLabel: 'Condition', notes: 'Remove greens; refrigerate for up to 4 weeks.' },
  potato: { base: 30, room: 30, fridge: 90, freezer: 365, defaultStorage: 'room', category: 'Fresh Vegetables', scoreLabel: 'Condition', notes: 'Store in cool, dark, dry place away from onions.' },
  potatoes: { base: 30, room: 30, fridge: 90, freezer: 365, defaultStorage: 'room', category: 'Fresh Vegetables', scoreLabel: 'Condition', notes: 'Cool, dark, dry place.' },
  onion: { base: 30, room: 30, fridge: 60, freezer: 240, defaultStorage: 'room', category: 'Fresh Vegetables', scoreLabel: 'Condition', notes: 'Cool, dark place with ventilation. Do not store with potatoes.' },
  onions: { base: 30, room: 30, fridge: 60, freezer: 240, defaultStorage: 'room', category: 'Fresh Vegetables', scoreLabel: 'Condition', notes: 'Cool, dark, ventilated place.' },
  garlic: { base: 60, room: 60, fridge: 180, freezer: 365, defaultStorage: 'room', category: 'Fresh Vegetables', scoreLabel: 'Condition', notes: 'Whole bulb: 2 months room temp; individual cloves: a few weeks.' },
  ginger: { base: 21, room: 7, fridge: 21, freezer: 180, defaultStorage: 'room', category: 'Fresh Vegetables', scoreLabel: 'Condition', notes: 'Freeze for longest life.' },
  spinach: { base: 5, room: 1, fridge: 7, freezer: 365, defaultStorage: 'fridge', category: 'Fresh Vegetables', scoreLabel: 'Condition', notes: 'Refrigerate and use within a week.' },
  palak: { base: 5, room: 1, fridge: 7, freezer: 365, defaultStorage: 'fridge', category: 'Fresh Vegetables', scoreLabel: 'Condition', notes: 'Use within a week of purchase.' },
  broccoli: { base: 5, room: 1, fridge: 7, freezer: 365, defaultStorage: 'fridge', category: 'Fresh Vegetables', scoreLabel: 'Condition', notes: 'Refrigerate; use within a week.' },
  lettuce: { base: 7, room: 1, fridge: 10, freezer: 0, defaultStorage: 'fridge', category: 'Fresh Vegetables', scoreLabel: 'Condition', notes: 'Keep refrigerated; 7-10 days.' },
  capsicum: { base: 10, room: 3, fridge: 14, freezer: 365, defaultStorage: 'fridge', category: 'Fresh Vegetables', scoreLabel: 'Condition', notes: 'Refrigerate for up to 2 weeks.' },
  'bell pepper': { base: 10, room: 3, fridge: 14, freezer: 365, defaultStorage: 'fridge', category: 'Fresh Vegetables', scoreLabel: 'Condition', notes: 'Refrigerate; whole peppers last up to 2 weeks.' },
  bhindi: { base: 3, room: 1, fridge: 4, freezer: 365, defaultStorage: 'fridge', category: 'Fresh Vegetables', scoreLabel: 'Condition', notes: 'Okra: use within 3-4 days of purchase.' },
  okra: { base: 3, room: 1, fridge: 4, freezer: 365, defaultStorage: 'fridge', category: 'Fresh Vegetables', scoreLabel: 'Condition', notes: 'Use within 3-4 days.' },
  cauliflower: { base: 7, room: 2, fridge: 14, freezer: 365, defaultStorage: 'fridge', category: 'Fresh Vegetables', scoreLabel: 'Condition', notes: 'Refrigerate; use within 2 weeks.' },
  cucumber: { base: 7, room: 2, fridge: 10, freezer: 0, defaultStorage: 'fridge', category: 'Fresh Vegetables', scoreLabel: 'Condition', notes: 'Refrigerate; use within 10 days.' },
  coriander: { base: 7, room: 2, fridge: 14, freezer: 90, defaultStorage: 'fridge', category: 'Fresh Vegetables', scoreLabel: 'Condition', notes: 'Refrigerate with stems in water and cover leaves.' },
  dhania: { base: 7, room: 2, fridge: 14, freezer: 90, defaultStorage: 'fridge', category: 'Fresh Vegetables', scoreLabel: 'Condition', notes: 'Store with stems in water in fridge.' },
  mint: { base: 10, room: 2, fridge: 14, freezer: 90, defaultStorage: 'fridge', category: 'Fresh Vegetables', scoreLabel: 'Condition', notes: 'Refrigerate with stems in water.' },
  methi: { base: 5, room: 1, fridge: 7, freezer: 90, defaultStorage: 'fridge', category: 'Fresh Vegetables', scoreLabel: 'Condition', notes: 'Fenugreek leaves: use within a week.' },
}

// ─── Dairy ────────────────────────────────────────────────────────────────────

const DAIRY: Record<string, ShelfLifeEntry> = {
  milk: { base: 7, room: 0, fridge: 7, freezer: 90, defaultStorage: 'fridge', category: 'Dairy', scoreLabel: 'Condition', notes: 'Must be refrigerated. Freeze only if needed.' },
  butter: { base: 30, room: 10, fridge: 90, freezer: 365, defaultStorage: 'fridge', category: 'Dairy', scoreLabel: 'Condition', notes: 'Refrigerate; freeze for up to 1 year.' },
  'cheddar cheese': { base: 21, room: 0, fridge: 60, freezer: 180, defaultStorage: 'fridge', category: 'Dairy', scoreLabel: 'Condition', notes: 'Wrap tightly; hard cheese keeps 1-2 months refrigerated.' },
  cheese: { base: 21, room: 0, fridge: 30, freezer: 120, defaultStorage: 'fridge', category: 'Dairy', scoreLabel: 'Condition', notes: 'Hard cheeses last longer than soft.' },
  paneer: { base: 5, room: 0, fridge: 7, freezer: 60, defaultStorage: 'fridge', category: 'Dairy', scoreLabel: 'Condition', notes: 'Fresh paneer: use within 5-7 days refrigerated.' },
  yogurt: { base: 14, room: 0, fridge: 21, freezer: 60, defaultStorage: 'fridge', category: 'Dairy', scoreLabel: 'Condition', notes: 'Check expiry; refrigerate.' },
  dahi: { base: 7, room: 0, fridge: 14, freezer: 30, defaultStorage: 'fridge', category: 'Dairy', scoreLabel: 'Condition', notes: 'Curd/dahi: use within 1-2 weeks refrigerated.' },
  cream: { base: 14, room: 0, fridge: 14, freezer: 90, defaultStorage: 'fridge', category: 'Dairy', scoreLabel: 'Condition', notes: 'Single/double cream: 1-2 weeks refrigerated.' },
  ghee: { base: 365, room: 90, fridge: 365, freezer: 1095, defaultStorage: 'room', category: 'Dairy', scoreLabel: 'Pantry health', notes: 'Clarified butter: very stable — 3 months room, 1 year fridge.' },
  eggs: { base: 28, room: 14, fridge: 35, freezer: 365, defaultStorage: 'fridge', category: 'Dairy', scoreLabel: 'Condition', notes: 'Refrigerate for longest life.' },
  egg: { base: 28, room: 14, fridge: 35, freezer: 365, defaultStorage: 'fridge', category: 'Dairy', scoreLabel: 'Condition', notes: 'Refrigerate for longest life.' },
}

// ─── Meat & Seafood ───────────────────────────────────────────────────────────

const MEAT: Record<string, ShelfLifeEntry> = {
  chicken: { base: 2, room: 0, fridge: 2, freezer: 270, defaultStorage: 'fridge', category: 'Meat & Poultry', scoreLabel: 'Condition', notes: 'Cook within 2 days. Freeze if not using immediately.' },
  'chicken breast': { base: 2, room: 0, fridge: 2, freezer: 270, defaultStorage: 'fridge', category: 'Meat & Poultry', scoreLabel: 'Condition', notes: 'Cook within 2 days. Freeze for up to 9 months.' },
  beef: { base: 2, room: 0, fridge: 3, freezer: 120, defaultStorage: 'fridge', category: 'Meat & Poultry', scoreLabel: 'Condition', notes: 'Cook or freeze within 3 days.' },
  'ground beef': { base: 2, room: 0, fridge: 2, freezer: 120, defaultStorage: 'fridge', category: 'Meat & Poultry', scoreLabel: 'Condition', notes: 'Highly perishable; use within 2 days.' },
  fish: { base: 2, room: 0, fridge: 2, freezer: 180, defaultStorage: 'fridge', category: 'Meat & Poultry', scoreLabel: 'Condition', notes: 'Use within 1-2 days. Freeze for up to 6 months.' },
  shrimp: { base: 2, room: 0, fridge: 2, freezer: 180, defaultStorage: 'fridge', category: 'Meat & Poultry', scoreLabel: 'Condition', notes: 'Use within 2 days. Excellent frozen.' },
  bacon: { base: 7, room: 0, fridge: 7, freezer: 30, defaultStorage: 'fridge', category: 'Meat & Poultry', scoreLabel: 'Condition', notes: 'Cured meat; refrigerate and use within 1 week of opening.' },
}

// ─── Bakery ───────────────────────────────────────────────────────────────────

const BAKERY: Record<string, ShelfLifeEntry> = {
  bread: { base: 5, room: 5, fridge: 14, freezer: 90, defaultStorage: 'room', category: 'Bakery', scoreLabel: 'Condition', notes: 'Room temp 3-5 days. Refrigerator extends to 2 weeks. Freeze for 3 months.' },
  bagels: { base: 3, room: 3, fridge: 7, freezer: 180, defaultStorage: 'room', category: 'Bakery', scoreLabel: 'Condition', notes: 'Best within 3 days. Freeze immediately for long storage.' },
  biscuits: { base: 14, room: 14, fridge: 0, freezer: 90, defaultStorage: 'room', category: 'Bakery', scoreLabel: 'Shelf life', notes: 'Sealed packet: 2-4 weeks. Freeze opened packs.' },
  cookies: { base: 14, room: 14, fridge: 21, freezer: 90, defaultStorage: 'room', category: 'Bakery', scoreLabel: 'Shelf life', notes: 'Store in airtight container at room temp up to 2 weeks.' },
  cake: { base: 4, room: 4, fridge: 7, freezer: 90, defaultStorage: 'room', category: 'Bakery', scoreLabel: 'Condition', notes: 'Unfrosted: 4 days room. Frosted: refrigerate.' },
  roti: { base: 2, room: 2, fridge: 4, freezer: 30, defaultStorage: 'room', category: 'Bakery', scoreLabel: 'Condition', notes: 'Best eaten fresh. Refrigerate up to 4 days.' },
}

// ─── Frozen Foods ─────────────────────────────────────────────────────────────

const FROZEN: Record<string, ShelfLifeEntry> = {
  'frozen vegetables': { base: 365, room: 0, fridge: 3, freezer: 365, defaultStorage: 'freezer', category: 'Frozen Foods', scoreLabel: 'Quality', notes: 'Keep frozen; once thawed use within 24 hours.' },
  'ice cream': { base: 180, room: 0, fridge: 0, freezer: 180, defaultStorage: 'freezer', category: 'Frozen Foods', scoreLabel: 'Quality', notes: 'Best within 6 months; safe beyond but quality declines.' },
  'frozen meal': { base: 180, room: 0, fridge: 3, freezer: 180, defaultStorage: 'freezer', category: 'Frozen Foods', scoreLabel: 'Quality', notes: 'Keep frozen until use.' },
}

// ─── Beverages ────────────────────────────────────────────────────────────────

const BEVERAGES: Record<string, ShelfLifeEntry> = {
  juice: { base: 14, room: 3, fridge: 14, freezer: 180, defaultStorage: 'fridge', category: 'Beverages', scoreLabel: 'Condition', notes: 'Refrigerate after opening.' },
  water: { base: 730, room: 730, fridge: 0, freezer: 0, defaultStorage: 'room', category: 'Beverages', scoreLabel: 'Shelf life', notes: 'Sealed bottled water: indefinite. Store away from chemicals.' },
  soda: { base: 270, room: 270, fridge: 365, freezer: 0, defaultStorage: 'room', category: 'Beverages', scoreLabel: 'Quality', notes: 'Carbonate fades over time but stays safe.' },
  wine: { base: 1095, room: 1095, fridge: 1460, freezer: 0, defaultStorage: 'room', category: 'Beverages', scoreLabel: 'Quality', notes: 'Depends heavily on variety. Red: 3-5 years. White: 2-3 years.' },
  beer: { base: 180, room: 180, fridge: 270, freezer: 0, defaultStorage: 'room', category: 'Beverages', scoreLabel: 'Quality', notes: 'Best within 6 months of brewing.' },
  lassi: { base: 3, room: 0, fridge: 3, freezer: 0, defaultStorage: 'fridge', category: 'Beverages', scoreLabel: 'Condition', notes: 'Homemade lassi: use within 3 days refrigerated.' },
  buttermilk: { base: 14, room: 0, fridge: 14, freezer: 0, defaultStorage: 'fridge', category: 'Beverages', scoreLabel: 'Condition', notes: 'Refrigerate; use within 2 weeks.' },
}

// ─── Master index ─────────────────────────────────────────────────────────────

export const SHELF_LIFE_DB: Record<string, ShelfLifeEntry> = {
  ...PANTRY_STAPLES,
  ...FRESH_PRODUCE,
  ...DAIRY,
  ...MEAT,
  ...BAKERY,
  ...FROZEN,
  ...BEVERAGES,
}

/**
 * Category-level defaults for when a specific product can't be matched.
 * Far more realistic than the API's current "14 days for everything" fallback.
 */
export const CATEGORY_DEFAULTS: Record<string, Omit<ShelfLifeEntry, 'notes'> & { notes: string }> = {
  'Fresh Fruits': { base: 7, room: 7, fridge: 14, freezer: 180, defaultStorage: 'room', category: 'Fresh Fruits', scoreLabel: 'Condition', notes: 'Varies by variety; most fruits last 5-14 days.' },
  'Fresh Vegetables': { base: 7, room: 3, fridge: 10, freezer: 180, defaultStorage: 'fridge', category: 'Fresh Vegetables', scoreLabel: 'Condition', notes: 'Most vegetables last 5-10 days refrigerated.' },
  Dairy: { base: 14, room: 0, fridge: 14, freezer: 90, defaultStorage: 'fridge', category: 'Dairy', scoreLabel: 'Condition', notes: 'Always refrigerate dairy.' },
  'Meat & Poultry': { base: 2, room: 0, fridge: 2, freezer: 180, defaultStorage: 'fridge', category: 'Meat & Poultry', scoreLabel: 'Condition', notes: 'Cook or freeze within 1-2 days.' },
  Bakery: { base: 5, room: 5, fridge: 14, freezer: 90, defaultStorage: 'room', category: 'Bakery', scoreLabel: 'Condition', notes: 'Baked goods: 3-7 days room temp.' },
  'Pantry Staples': { base: 365, room: 365, fridge: 730, freezer: 1095, defaultStorage: 'room', category: 'Pantry Staples', scoreLabel: 'Pantry health', notes: 'Most dry pantry goods last 1-2 years sealed.' },
  Beverages: { base: 180, room: 180, fridge: 365, freezer: 0, defaultStorage: 'room', category: 'Beverages', scoreLabel: 'Quality', notes: 'Varies by type.' },
  'Frozen Foods': { base: 180, room: 0, fridge: 3, freezer: 365, defaultStorage: 'freezer', category: 'Frozen Foods', scoreLabel: 'Quality', notes: 'Keep frozen until use.' },
  'Eggs & Tofu': { base: 28, room: 7, fridge: 35, freezer: 180, defaultStorage: 'fridge', category: 'Eggs & Tofu', scoreLabel: 'Condition', notes: 'Refrigerate eggs; use tofu within a week.' },
}

/**
 * Look up shelf-life data for a product name.
 * Tries: exact match → case-insensitive → partial word match → null.
 */
export function lookupShelfLife(productName: string): ShelfLifeEntry | null {
  const key = productName.toLowerCase().trim()
  if (SHELF_LIFE_DB[key]) return SHELF_LIFE_DB[key]

  // Partial match: check if any DB key is contained in the product name
  for (const [dbKey, entry] of Object.entries(SHELF_LIFE_DB)) {
    const words = dbKey.split(/\s+/)
    if (words.every(w => key.includes(w))) return entry
  }

  // Reverse: check if the product name is contained in a DB key
  for (const [dbKey, entry] of Object.entries(SHELF_LIFE_DB)) {
    if (dbKey.includes(key)) return entry
  }

  return null
}

/**
 * Look up category-level defaults by raw category string.
 * Falls back to 'Pantry Staples' defaults if not found.
 */
export function lookupCategoryDefaults(category: string): typeof CATEGORY_DEFAULTS[string] {
  const direct = CATEGORY_DEFAULTS[category]
  if (direct) return direct

  const lower = category.toLowerCase()
  for (const [cat, defaults] of Object.entries(CATEGORY_DEFAULTS)) {
    if (lower.includes(cat.toLowerCase()) || cat.toLowerCase().includes(lower)) {
      return defaults
    }
  }

  return CATEGORY_DEFAULTS['Pantry Staples']
}

/**
 * Returns the appropriate score label for a given category.
 * Used to decide whether to show "Freshness", "Pantry health", "Quality", etc.
 */
export function getScoreLabel(category: string, productName: string): string {
  const entry = lookupShelfLife(productName)
  if (entry) return entry.scoreLabel

  const cat = category.toLowerCase()
  if (cat.includes('pantry') || cat.includes('spice') || cat.includes('condiment') || cat.includes('bakery')) {
    return 'Pantry health'
  }
  if (cat.includes('frozen') || cat.includes('beverage')) return 'Quality'
  return 'Condition'
}

/**
 * Calculates the final shelf-life days based on product data, storage method, and opened status.
 */
export function calculateShelfLife(product: any, storageNameRaw: string, isOpened: boolean): number {
  const storageName = storageNameRaw.toLowerCase()
  let shelfLife = product.baseShelfLifeDays

  if (storageName.includes('freezer')) {
    shelfLife = product.freezerShelfLifeDays ?? shelfLife
  } else if (storageName.includes('fridge') || storageName.includes('refrig')) {
    shelfLife = product.fridgeShelfLifeDays ?? shelfLife
  } else if (storageName.includes('room')) {
    shelfLife = product.roomTempShelfLifeDays ?? shelfLife
  }

  // Opened penalty: 25% reduction
  if (isOpened) {
    shelfLife = Math.floor(shelfLife * 0.75)
  }

  return Math.max(1, shelfLife)
}
