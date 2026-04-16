/**
 * fix-product-shelf-lives.js
 *
 * One-time script to update shelf-life values for products that were created
 * with the generic fallback (room=7, fridge=14, freezer=90).
 *
 * Run:  node fix-product-shelf-lives.js
 *
 * The script applies the same lookup logic as lib/shelfLifeDb.ts, so it uses
 * require() with a manually-inlined version of the key mappings (since this
 * runs outside Next.js / TypeScript).
 */

require('dotenv').config()
const mongoose = require('mongoose')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pantry-guardian'

const ProductSchema = new mongoose.Schema({
  name: String,
  category: String,
  baseShelfLifeDays: Number,
  roomTempShelfLifeDays: Number,
  fridgeShelfLifeDays: Number,
  freezerShelfLifeDays: Number,
  storageNotes: String,
  defaultStorageMethodId: String,
}, { timestamps: true })

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema)

// ─── Inline shelf-life DB (key common items) ──────────────────────────────────
// Same data as lib/shelfLifeDb.ts but plain JS objects.

const SHELF_LIFE_PATCHES = {
  // Honey — was seeded with base=7 from receipt fallback
  honey:      { base: 730, room: 730, fridge: 365, freezer: 0,    storage: 'room', notes: 'Honey has indefinite shelf life if sealed. Score reflects jar freshness, not safety.' },
  // Cinnamon
  cinnamon:   { base: 730, room: 730, fridge: 0,   freezer: 0,    storage: 'room', notes: 'Ground cinnamon retains peak flavour ~2 years. Score reflects potency, not spoilage risk.' },
  // Butter — depends heavily on storage but should NOT be 7d
  butter:     { base: 30,  room: 10,  fridge: 90,  freezer: 365,  storage: 'fridge', notes: 'Refrigerate. Freeze for up to 1 year.' },
  // Apples — seeded at base=7 but room-temp apples last 2 weeks
  apples:     { base: 14,  room: 14,  fridge: 42,  freezer: 365,  storage: 'room', notes: 'Cool, dark place. Refrigerate for longest life.' },
  apple:      { base: 14,  room: 14,  fridge: 42,  freezer: 365,  storage: 'room', notes: 'Cool, dark place. Refrigerate for longest life.' },
  // Bananas — seeded correctly at 5d room, but fridge should be 7
  bananas:    { base: 5,   room: 5,   fridge: 7,   freezer: 90,   storage: 'room', notes: 'Room temp until ripe, then refrigerate.' },
  banana:     { base: 5,   room: 5,   fridge: 7,   freezer: 90,   storage: 'room', notes: 'Room temp until ripe, then refrigerate.' },
  // Bread — already correct in seed, but re-assert for any receipt-created copies
  bread:      { base: 5,   room: 5,   fridge: 14,  freezer: 90,   storage: 'room', notes: 'Room temp 3-5 days. Refrigerator 2 weeks. Freeze 3 months.' },
  // Milk — already correct
  milk:       { base: 7,   room: 0,   fridge: 7,   freezer: 90,   storage: 'fridge', notes: 'Must refrigerate.' },
  // Eggs — correct in seed
  eggs:       { base: 28,  room: 14,  fridge: 35,  freezer: 365,  storage: 'fridge', notes: 'Refrigerate for longest life.' },
  egg:        { base: 28,  room: 14,  fridge: 35,  freezer: 365,  storage: 'fridge', notes: 'Refrigerate for longest life.' },
  // Rice — correct in seed
  rice:       { base: 730, room: 730, fridge: 1095,freezer: 1460, storage: 'room', notes: 'White/basmati: 2+ years sealed.' },
  'basmati rice': { base: 730, room: 730, fridge: 1095, freezer: 1460, storage: 'room', notes: 'Store sealed, cool, dark place.' },
  // Cheese
  cheese:     { base: 21,  room: 0,   fridge: 30,  freezer: 120,  storage: 'fridge', notes: 'Hard cheeses last longer than soft.' },
  // Ghee
  ghee:       { base: 365, room: 90,  fridge: 365, freezer: 1095, storage: 'room', notes: 'Very stable — 3 months room, 1 year fridge.' },
  // Spices
  turmeric:   { base: 1095,room: 1095,fridge: 0,   freezer: 0,    storage: 'room', notes: 'Retains peak colour ~3 years.' },
  haldi:      { base: 1095,room: 1095,fridge: 0,   freezer: 0,    storage: 'room', notes: 'Same as turmeric.' },
  jeera:      { base: 730, room: 730, fridge: 0,   freezer: 0,    storage: 'room', notes: 'Cumin seeds ~2 years sealed.' },
  cumin:      { base: 730, room: 730, fridge: 0,   freezer: 0,    storage: 'room', notes: '~2 years for whole seeds.' },
  // Salt / Sugar
  salt:       { base: 3650,room: 3650,fridge: 0,   freezer: 0,    storage: 'room', notes: 'Salt does not expire.' },
  sugar:      { base: 1825,room: 1825,fridge: 0,   freezer: 0,    storage: 'room', notes: 'Indefinite if kept dry.' },
  // Potatoes — seeded correctly
  potatoes:   { base: 30,  room: 30,  fridge: 90,  freezer: 365,  storage: 'room', notes: 'Cool, dark, dry place.' },
  potato:     { base: 30,  room: 30,  fridge: 90,  freezer: 365,  storage: 'room', notes: 'Cool, dark, dry place.' },
  // Pantry oils
  'olive oil':{ base: 365, room: 365, fridge: 730, freezer: 0,    storage: 'room', notes: 'Opened: 3-6 months. Keep away from heat.' },
  // Onion / Garlic
  onion:      { base: 30,  room: 30,  fridge: 60,  freezer: 240,  storage: 'room', notes: 'Cool, dark, ventilated place.' },
  onions:     { base: 30,  room: 30,  fridge: 60,  freezer: 240,  storage: 'room', notes: 'Cool, dark, ventilated place.' },
  garlic:     { base: 60,  room: 60,  fridge: 180, freezer: 365,  storage: 'room', notes: 'Whole bulb: 2 months room; individual cloves: a few weeks.' },
  // Yogurt
  yogurt:     { base: 14,  room: 0,   fridge: 21,  freezer: 60,   storage: 'fridge', notes: 'Refrigerate; check expiry.' },
  dahi:       { base: 7,   room: 0,   fridge: 14,  freezer: 30,   storage: 'fridge', notes: 'Curd: use within 2 weeks refrigerated.' },
  // Paneer
  paneer:     { base: 5,   room: 0,   fridge: 7,   freezer: 60,   storage: 'fridge', notes: 'Fresh paneer: 5-7 days refrigerated.' },
  // Tomatoes
  tomatoes:   { base: 7,   room: 7,   fridge: 14,  freezer: 180,  storage: 'room', notes: 'Best flavor at room temp.' },
  tomato:     { base: 7,   room: 7,   fridge: 14,  freezer: 180,  storage: 'room', notes: 'Best flavor at room temp.' },
  // Coriander / Mint
  coriander:  { base: 7,   room: 2,   fridge: 14,  freezer: 90,   storage: 'fridge', notes: 'Stem in water, cover leaves, refrigerate.' },
  dhania:     { base: 7,   room: 2,   fridge: 14,  freezer: 90,   storage: 'fridge', notes: 'Store with stems in water in fridge.' },
  mint:       { base: 10,  room: 2,   fridge: 14,  freezer: 90,   storage: 'fridge', notes: 'Refrigerate with stems in water.' },
  // Flour
  flour:      { base: 240, room: 240, fridge: 365, freezer: 730,  storage: 'room', notes: 'All-purpose: 6-12 months room temp.' },
  atta:       { base: 90,  room: 90,  fridge: 180, freezer: 365,  storage: 'room', notes: 'Whole-wheat: 3 months room, longer refrigerated.' },
  // Pasta
  pasta:      { base: 730, room: 730, fridge: 1095,freezer: 1460, storage: 'room', notes: 'Dry pasta: 2 years.' },
}

async function main() {
  console.log('🔧 Connecting to MongoDB...')
  await mongoose.connect(MONGODB_URI)
  console.log('✅ Connected')

  const allProducts = await Product.find({}).lean()
  console.log(`📦 Found ${allProducts.length} products in DB`)

  let updated = 0
  let skipped = 0

  for (const product of allProducts) {
    const key = product.name.toLowerCase().trim()

    // Try exact match
    let patch = SHELF_LIFE_PATCHES[key]

    // Try partial matching
    if (!patch) {
      for (const [patchKey, patchData] of Object.entries(SHELF_LIFE_PATCHES)) {
        if (key.includes(patchKey) || patchKey.includes(key)) {
          patch = patchData
          break
        }
      }
    }

    if (!patch) {
      // console.log(`  [SKIP] No patch for: "${product.name}"`)
      skipped++
      continue
    }

    // Only update if values are suspiciously low (likely from generic fallback)
    const needsUpdate =
      (patch.room > 0 && product.roomTempShelfLifeDays <= 7 && patch.room > 7) ||
      (patch.base > product.baseShelfLifeDays * 2) ||
      (patch.fridge > 0 && product.fridgeShelfLifeDays <= 14 && patch.fridge > 14)

    if (!needsUpdate) {
      // console.log(`  [OK]   "${product.name}" looks fine — skipping`)
      skipped++
      continue
    }

    await Product.findByIdAndUpdate(product._id, {
      baseShelfLifeDays: patch.base,
      roomTempShelfLifeDays: patch.room,
      fridgeShelfLifeDays: patch.fridge,
      freezerShelfLifeDays: patch.freezer,
      defaultStorageMethodId: patch.storage,
      storageNotes: patch.notes,
    })

    console.log(`  ✅ Updated "${product.name}": base=${patch.base}d, room=${patch.room}d, fridge=${patch.fridge}d, freezer=${patch.freezer}d`)
    updated++
  }

  console.log(`\n🎉 Done! Updated ${updated} products, skipped ${skipped}.`)
  await mongoose.disconnect()
}

main().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
