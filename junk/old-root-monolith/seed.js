require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const DEFAULT_MONGODB_URI = 'mongodb://127.0.0.1:27017/pantry-guardian'
const MONGODB_URI = process.env.MONGODB_URI || DEFAULT_MONGODB_URI

if (!MONGODB_URI) {
  console.error('❌ Error: MONGODB_URI not found in .env file')
  process.exit(1)
}

// Define schemas inline for seeding
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  name: String,
  city: { type: String, default: 'London' }
}, { timestamps: true })

const StorageMethodSchema = new mongoose.Schema({
  _id: String,
  name: { type: String, required: true },
  tempRangeMinC: { type: Number, required: true },
  tempRangeMaxC: { type: Number, required: true },
  humidityPreferred: { type: Number, required: true }
}, { _id: false })

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  baseShelfLifeDays: { type: Number, required: true },
  roomTempShelfLifeDays: Number,
  fridgeShelfLifeDays: Number,
  freezerShelfLifeDays: Number,
  storageNotes: String,
  defaultStorageMethodId: { type: String, required: true, ref: 'StorageMethod' }
}, { timestamps: true })

const RecipeIngredientSchema = new mongoose.Schema({
  name: { type: String, required: true }
}, { _id: false })

const RecipeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  instructions: String,
  ingredients: { type: [RecipeIngredientSchema], default: [] }
}, { timestamps: true })

const InventoryItemSchema = new mongoose.Schema({
  userId: { type: String, required: true, ref: 'User' },
  productId: { type: String, required: true, ref: 'Product' },
  storageMethodId: { type: String, required: true, ref: 'StorageMethod' },
  purchasedAt: { type: Date, required: true },
  openedAt: Date,
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  notes: String
}, { timestamps: true })

const WeatherSnapshotSchema = new mongoose.Schema({
  inventoryItemId: { type: String, required: true, ref: 'InventoryItem' },
  capturedAt: { type: Date, default: Date.now },
  tempC: { type: Number, required: true },
  humidity: { type: Number, required: true }
})

const PredictionSchema = new mongoose.Schema({
  inventoryItemId: { type: String, required: true, ref: 'InventoryItem' },
  predictedExpiry: { type: Date, required: true },
  modelVersion: { type: String, required: true },
  confidence: { type: Number, required: true, min: 0, max: 1 },
  createdAt: { type: Date, default: Date.now }
})

const FeedbackSchema = new mongoose.Schema({
  inventoryItemId: { type: String, required: true, ref: 'InventoryItem' },
  userReportedExpiry: Date,
  freshnessScore: { type: Number, min: 1, max: 5 },
  notes: String,
  createdAt: { type: Date, default: Date.now }
})

const PushSubscriberSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  endpoint: { type: String, required: true, unique: true },
  auth: { type: String, required: true },
  p256dh: { type: String, required: true },
  notificationCount: { type: Number, default: 0 },
  lastNotificationTime: { type: Date, default: null },
  notificationHistory: [
    {
      notificationType: String,
      date: Date,
    },
  ],
}, { timestamps: true })

// Create or retrieve models
const User = mongoose.models.User || mongoose.model('User', UserSchema)
const StorageMethod = mongoose.models.StorageMethod || mongoose.model('StorageMethod', StorageMethodSchema)
const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema)
const Recipe = mongoose.models.Recipe || mongoose.model('Recipe', RecipeSchema)
const InventoryItem = mongoose.models.InventoryItem || mongoose.model('InventoryItem', InventoryItemSchema)
const WeatherSnapshot = mongoose.models.WeatherSnapshot || mongoose.model('WeatherSnapshot', WeatherSnapshotSchema)
const Prediction = mongoose.models.Prediction || mongoose.model('Prediction', PredictionSchema)
const Feedback = mongoose.models.Feedback || mongoose.model('Feedback', FeedbackSchema)
const PushSubscriber = mongoose.models.PushSubscriber || mongoose.model('PushSubscriber', PushSubscriberSchema)

async function main() {
  console.log('🌱 Starting MongoDB seed...')
  
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    await Promise.all([
      WeatherSnapshot.deleteMany({}),
      Prediction.deleteMany({}),
      Feedback.deleteMany({}),
      PushSubscriber.deleteMany({}),
      InventoryItem.deleteMany({}),
      Recipe.deleteMany({}),
      Product.deleteMany({}),
      StorageMethod.deleteMany({}),
    ])
    console.log('✅ Cleared existing demo collections')

    // Create storage methods
    const storageMethodsData = [
      { _id: 'room', name: 'Room Temperature', tempRangeMinC: 18, tempRangeMaxC: 25, humidityPreferred: 50 },
      { _id: 'fridge', name: 'Refrigerator', tempRangeMinC: 2, tempRangeMaxC: 5, humidityPreferred: 65 },
      { _id: 'freezer', name: 'Freezer', tempRangeMinC: -20, tempRangeMaxC: -10, humidityPreferred: 70 }
    ]

    for (const sm of storageMethodsData) {
      await StorageMethod.findByIdAndUpdate(sm._id, sm, { upsert: true, new: true })
    }

    console.log('✅ Storage methods created')

    // Create Recipes
    const recipes = [
      {
        title: 'Classic Tomato Pasta',
        description: 'A simple yet delicious pasta dish with fresh tomatoes and basil.',
        instructions: 'Boil pasta. Saute garlic and tomatoes. Mix and serve with basil.',
        ingredients: [
          { name: 'Pasta' },
          { name: 'Tomatoes' },
          { name: 'Garlic' },
          { name: 'Basil' },
          { name: 'Olive Oil' },
          { name: 'Salt' },
        ],
      },
      {
        title: 'Vegetable Stir Fry',
        description: 'Quick and healthy stir fry with mixed vegetables.',
        instructions: 'Chop vegetables. Stir fry in hot oil with soy sauce. Serve over rice.',
        ingredients: [
          { name: 'Rice' },
          { name: 'Carrots' },
          { name: 'Broccoli' },
          { name: 'Bell Pepper' },
          { name: 'Soy Sauce' },
          { name: 'Ginger' },
          { name: 'Garlic' },
        ],
      },
      {
        title: 'Banana Pancakes',
        description: 'Fluffy pancakes made with ripe bananas.',
        instructions: 'Mash bananas. Mix with flour, eggs, and milk. Cook on griddle.',
        ingredients: [
          { name: 'Bananas' },
          { name: 'Flour' },
          { name: 'Eggs' },
          { name: 'Milk' },
          { name: 'Butter' },
          { name: 'Maple Syrup' },
        ],
      },
      {
        title: 'Kitchen Sink Frittata',
        description: 'Eggs, greens, and leftovers baked into a clean, compact meal with strong shelf-life logic.',
        instructions: 'Whisk eggs and milk. Fold in greens, cheese, onion, and herbs. Bake until set.',
        ingredients: [
          { name: 'Eggs' },
          { name: 'Milk' },
          { name: 'Spinach' },
          { name: 'Cheddar Cheese' },
          { name: 'Onion' },
          { name: 'Herbs' },
        ],
      },
      {
        title: 'Pantry Guardian Bowl',
        description: 'A grain bowl built around whatever is freshest in your fridge and pantry.',
        instructions: 'Cook rice. Top with tomatoes, lettuce, carrots, olive oil, and lemon.',
        ingredients: [
          { name: 'Rice' },
          { name: 'Tomatoes' },
          { name: 'Lettuce' },
          { name: 'Carrots' },
          { name: 'Olive Oil' },
          { name: 'Lemon' },
        ],
      },
      {
        title: 'Everything-Must-Go Soup',
        description: 'A broth-forward cleanup recipe for produce that needs attention immediately.',
        instructions: 'Simmer vegetables with stock until tender. Serve with bread.',
        ingredients: [
          { name: 'Broccoli' },
          { name: 'Carrots' },
          { name: 'Onion' },
          { name: 'Garlic' },
          { name: 'Vegetable Stock' },
          { name: 'Bread' },
        ],
      },
      {
        title: 'Potato Chips',
        description: 'A bare-minimum snack that only needs one potato and a hot oven or fryer.',
        instructions: 'Slice potatoes thinly. Crisp in hot oil or oven until golden.',
        ingredients: [{ name: 'Potato' }],
      },
      {
        title: 'Baked Potato',
        description: 'The simplest dinner on the page: one potato, heat, and a fork.',
        instructions: 'Bake potato until soft. Split open and season lightly.',
        ingredients: [{ name: 'Potato' }],
      },
      {
        title: 'Apple Slices',
        description: 'A single-fruit snack for apples that are still crisp enough to serve raw.',
        instructions: 'Slice apples and serve chilled or at room temperature.',
        ingredients: [{ name: 'Apple' }],
      },
      {
        title: 'Boiled Eggs',
        description: 'A protein reset made from a single pantry staple and almost no effort.',
        instructions: 'Boil eggs until set. Cool, peel, and serve.',
        ingredients: [{ name: 'Eggs' }],
      },
      {
        title: 'Miso Noodle Rescue',
        description: 'A savory bowl for clearing out vegetables, noodles, and any softening greens fast.',
        instructions: 'Cook noodles. Stir into miso broth with vegetables and eggs.',
        ingredients: [
          { name: 'Noodles' },
          { name: 'Miso' },
          { name: 'Carrots' },
          { name: 'Spinach' },
          { name: 'Eggs' },
          { name: 'Sesame Oil' },
        ],
      },
      {
        title: 'Crispy Potato Hash',
        description: 'A skillet-heavy dinner that turns potatoes, onions, and leftovers into a sharp, fast meal.',
        instructions: 'Pan-fry potatoes with onion until crisp. Finish with herbs and eggs if desired.',
        ingredients: [
          { name: 'Potatoes' },
          { name: 'Onion' },
          { name: 'Eggs' },
          { name: 'Herbs' },
          { name: 'Salt' },
          { name: 'Pepper' },
        ],
      },
      {
        title: 'Apple Cinnamon Toast',
        description: 'A quick breakfast for using apples before they soften too much.',
        instructions: 'Toast bread, top with apples, butter, cinnamon, and honey.',
        ingredients: [
          { name: 'Apples' },
          { name: 'Bread' },
          { name: 'Butter' },
          { name: 'Cinnamon' },
          { name: 'Honey' },
        ],
      },
      {
        title: 'Palak Paneer Skillet',
        description: 'A fast stovetop paneer and spinach dish for using palak, paneer, chilli, and haldi before quality drops.',
        instructions: 'Cook onion and spices, add spinach, then fold in paneer and finish hot.',
        ingredients: [
          { name: 'Palak' },
          { name: 'Paneer' },
          { name: 'Onion' },
          { name: 'Garlic' },
          { name: 'Haldi' },
          { name: 'Chilli' },
        ],
      },
      {
        title: 'Atta Roti with Honey',
        description: 'A minimal sweet-savory plate using atta dough and honey when pantry choices are limited.',
        instructions: 'Mix atta with water and salt, cook roti, then drizzle with honey and ghee.',
        ingredients: [
          { name: 'Atta' },
          { name: 'Water' },
          { name: 'Salt' },
          { name: 'Honey' },
          { name: 'Ghee' },
        ],
      },
      {
        title: 'Coconut Chilli Chutney',
        description: 'A quick grinder chutney to use nariyal and green chilli while fresh and aromatic.',
        instructions: 'Blend coconut with chilli, lemon, and salt until coarse.',
        ingredients: [
          { name: 'Nariyal' },
          { name: 'Green Chilli' },
          { name: 'Salt' },
          { name: 'Lemon' },
        ],
      },
      {
        title: 'Jeera Basmati Rice',
        description: 'A pantry-side rice recipe to use basmati and jeera with low prep and stable shelf ingredients.',
        instructions: 'Temper cumin in ghee, add basmati rice, and cook until fluffy.',
        ingredients: [
          { name: 'Basmati Rice' },
          { name: 'Jeera' },
          { name: 'Ghee' },
          { name: 'Salt' },
        ],
      },
      {
        title: 'Honey Apple Bowl',
        description: 'A no-cook prep bowl for apples and honey when you need a quick low-effort recipe.',
        instructions: 'Slice apples, top with honey and cinnamon, and serve immediately.',
        ingredients: [
          { name: 'Apples' },
          { name: 'Honey' },
          { name: 'Cinnamon' },
        ],
      },
    ]

    for (const recipe of recipes) {
      await Recipe.findOneAndUpdate(
        { title: recipe.title },
        recipe,
        { upsert: true, new: true }
      )
    }
    console.log('✅ Recipes created')

    // Create demo user
    const hashedPassword = await bcrypt.hash('demo1234', 12)
    
    const demoUser = await User.findOneAndUpdate(
      { email: 'demo@example.com' },
      {
        email: 'demo@example.com',
        name: 'Demo User',
        passwordHash: hashedPassword,
        city: 'London'
      },
      { upsert: true, new: true }
    )

    console.log('✅ Demo user created')

    // Sample products
    const productsData = [
      // Fresh Fruits
      { name: 'Apples', category: 'Fresh Fruits', base: 7, room: 14, fridge: 28, freezer: 365, storage: 'room', notes: 'Store in cool, dark place' },
      { name: 'Bananas', category: 'Fresh Fruits', base: 5, room: 5, fridge: 7, freezer: 180, storage: 'room', notes: 'Keep at room temperature until ripe' },
      { name: 'Oranges', category: 'Fresh Fruits', base: 10, room: 14, fridge: 28, freezer: 365, storage: 'room', notes: 'Store in cool place' },
      { name: 'Strawberries', category: 'Fresh Fruits', base: 3, room: 1, fridge: 7, freezer: 180, storage: 'fridge', notes: 'Highly perishable' },
      { name: 'Grapes', category: 'Fresh Fruits', base: 5, room: 2, fridge: 14, freezer: 365, storage: 'fridge', notes: 'Refrigerate unwashed' },
      
      // Fresh Vegetables  
      { name: 'Tomatoes', category: 'Fresh Vegetables', base: 7, room: 7, fridge: 14, freezer: 180, storage: 'room', notes: 'Best flavor at room temp' },
      { name: 'Lettuce', category: 'Fresh Vegetables', base: 5, room: 0, fridge: 10, freezer: 0, storage: 'fridge', notes: 'Wash before storing' },
      { name: 'Carrots', category: 'Fresh Vegetables', base: 14, room: 7, fridge: 28, freezer: 365, storage: 'fridge', notes: 'Remove greens before storing' },
      { name: 'Broccoli', category: 'Fresh Vegetables', base: 5, room: 1, fridge: 7, freezer: 365, storage: 'fridge', notes: 'Store unwashed' },
      { name: 'Potatoes', category: 'Fresh Vegetables', base: 30, room: 30, fridge: 90, freezer: 365, storage: 'room', notes: 'Store in dark, cool place' },
      
      // Dairy
      { name: 'Milk', category: 'Dairy', base: 7, room: 0, fridge: 7, freezer: 90, storage: 'fridge', notes: 'Must refrigerate' },
      { name: 'Cheddar Cheese', category: 'Dairy', base: 21, room: 0, fridge: 60, freezer: 180, storage: 'fridge', notes: 'Wrap tightly' },
      { name: 'Yogurt', category: 'Dairy', base: 14, room: 0, fridge: 21, freezer: 60, storage: 'fridge', notes: 'Check expiry date' },
      { name: 'Butter', category: 'Dairy', base: 30, room: 7, fridge: 90, freezer: 365, storage: 'fridge', notes: 'Can freeze' },
      
      // Meat & Poultry
      { name: 'Chicken Breast', category: 'Meat & Poultry', base: 2, room: 0, fridge: 2, freezer: 270, storage: 'fridge', notes: 'Cook within 2 days' },
      { name: 'Ground Beef', category: 'Meat & Poultry', base: 2, room: 0, fridge: 2, freezer: 120, storage: 'fridge', notes: 'Highly perishable' },
      { name: 'Bacon', category: 'Meat & Poultry', base: 7, room: 0, fridge: 14, freezer: 30, storage: 'fridge', notes: 'Cured meat' },
      
      // Eggs & Tofu
      { name: 'Eggs', category: 'Eggs & Tofu', base: 28, room: 7, fridge: 35, freezer: 365, storage: 'fridge', notes: 'Keep in carton' },
      { name: 'Tofu', category: 'Eggs & Tofu', base: 7, room: 0, fridge: 7, freezer: 180, storage: 'fridge', notes: 'Keep in water' },
      
      // Bakery
      { name: 'Bread', category: 'Bakery', base: 5, room: 5, fridge: 14, freezer: 180, storage: 'room', notes: 'Store in cool, dry place' },
      { name: 'Bagels', category: 'Bakery', base: 5, room: 3, fridge: 14, freezer: 180, storage: 'room', notes: 'Dense bread' },
      
      // Pantry Staples
      { name: 'Rice', category: 'Pantry Staples', base: 730, room: 730, fridge: 1095, freezer: 1460, storage: 'room', notes: 'Long shelf life' },
      { name: 'Pasta', category: 'Pantry Staples', base: 730, room: 730, fridge: 1095, freezer: 1460, storage: 'room', notes: 'Dry pasta' },
      { name: 'Olive Oil', category: 'Pantry Staples', base: 365, room: 365, fridge: 730, freezer: 0, storage: 'room', notes: 'Store in dark place' },
    ]

    const storageMap = { 'room': 'room', 'fridge': 'fridge', 'freezer': 'freezer' }

    let createdCount = 0
    for (const p of productsData) {
      await Product.findOneAndUpdate(
        { name: p.name },
        {
          name: p.name,
          category: p.category,
          baseShelfLifeDays: p.base,
          roomTempShelfLifeDays: p.room,
          fridgeShelfLifeDays: p.fridge,
          freezerShelfLifeDays: p.freezer,
          storageNotes: p.notes,
          defaultStorageMethodId: storageMap[p.storage],
        },
        { upsert: true, new: true }
      )
      createdCount++
    }

    console.log(`✅ All ${createdCount} products created`)

    const productByName = new Map()
    for (const product of await Product.find().lean()) {
      productByName.set(product.name, product)
    }

    const demoInventorySeed = [
      { productName: 'Chicken Breast', storageMethodId: 'fridge', purchasedDaysAgo: 1, quantity: 2, unit: 'pieces', notes: 'Use soon' },
      { productName: 'Milk', storageMethodId: 'fridge', purchasedDaysAgo: 2, quantity: 1, unit: 'carton', notes: 'For breakfast' },
      { productName: 'Eggs', storageMethodId: 'fridge', purchasedDaysAgo: 3, quantity: 12, unit: 'count', notes: 'Weekend batch' },
      { productName: 'Apples', storageMethodId: 'room', purchasedDaysAgo: 4, quantity: 6, unit: 'count', notes: 'Snack fruit' },
      { productName: 'Bread', storageMethodId: 'room', purchasedDaysAgo: 2, quantity: 1, unit: 'loaf', notes: 'Toast and sandwiches' },
      { productName: 'Broccoli', storageMethodId: 'fridge', purchasedDaysAgo: 1, quantity: 1, unit: 'head', notes: 'Dinner veg' },
      { productName: 'Rice', storageMethodId: 'room', purchasedDaysAgo: 10, quantity: 1, unit: 'bag', notes: 'Pantry staple' },
      { productName: 'Bananas', storageMethodId: 'room', purchasedDaysAgo: 1, quantity: 6, unit: 'count', notes: 'Ripening batch' },
    ]

    const demoInventoryItems = []
    for (const seedItem of demoInventorySeed) {
      const product = productByName.get(seedItem.productName)
      if (!product) continue

      const purchasedAt = new Date()
      purchasedAt.setDate(purchasedAt.getDate() - seedItem.purchasedDaysAgo)

      const inventoryItem = await InventoryItem.create({
        userId: demoUser._id.toString(),
        productId: product._id.toString(),
        storageMethodId: seedItem.storageMethodId,
        purchasedAt,
        quantity: seedItem.quantity,
        unit: seedItem.unit,
        notes: seedItem.notes,
      })

      demoInventoryItems.push({ inventoryItem, product, purchasedAt, seedItem })
    }

    for (const entry of demoInventoryItems) {
      const storageMethodName = entry.seedItem.storageMethodId === 'freezer'
        ? 'Freezer'
        : entry.seedItem.storageMethodId === 'fridge'
          ? 'Refrigerator'
          : 'Room Temperature'

      const shelfLife =
        storageMethodName === 'Freezer'
          ? (entry.product.freezerShelfLifeDays || entry.product.baseShelfLifeDays)
          : storageMethodName === 'Refrigerator'
            ? (entry.product.fridgeShelfLifeDays || entry.product.baseShelfLifeDays)
            : (entry.product.roomTempShelfLifeDays || entry.product.baseShelfLifeDays)

      await WeatherSnapshot.create({
        inventoryItemId: entry.inventoryItem._id.toString(),
        tempC: storageMethodName === 'Freezer' ? -18 : storageMethodName === 'Refrigerator' ? 4 : 22,
        humidity: storageMethodName === 'Room Temperature' ? 45 : 62,
      })

      const predictedExpiry = new Date(entry.purchasedAt)
      predictedExpiry.setDate(predictedExpiry.getDate() + shelfLife)

      await Prediction.create({
        inventoryItemId: entry.inventoryItem._id.toString(),
        predictedExpiry,
        confidence: 0.88,
        modelVersion: 'seed-2.0',
      })
    }

    if (demoInventoryItems[0]) {
      await Feedback.create({
        inventoryItemId: demoInventoryItems[0].inventoryItem._id.toString(),
        freshnessScore: 4,
        notes: 'Looks fine, but use within a day or two.',
      })
    }

    console.log('✅ Demo inventory, weather, predictions, and feedback created')

    console.log('🎉 Seed completed successfully!')
  } catch (error) {
    console.error('❌ Seed failed:', error)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    console.log('✅ Disconnected from MongoDB')
  }
}

main()
