const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Create storage methods
  const room = await prisma.storageMethod.upsert({
    where: { id: 'room' },
    update: {},
    create: {
      id: 'room',
      name: 'Room Temperature',
      tempRangeMinC: 18,
      tempRangeMaxC: 25,
      humidityPreferred: 50
    }
  })

  const fridge = await prisma.storageMethod.upsert({
    where: { id: 'fridge' },
    update: {},
    create: {
      id: 'fridge',
      name: 'Refrigerator',
      tempRangeMinC: 2,
      tempRangeMaxC: 5,
      humidityPreferred: 65
    }
  })

  const freezer = await prisma.storageMethod.upsert({
    where: { id: 'freezer' },
    update: {},
    create: {
      id: 'freezer',
      name: 'Freezer',
      tempRangeMinC: -20,
      tempRangeMaxC: -10,
      humidityPreferred: 70
    }
  })

  console.log('✅ Storage methods created')

  // Create demo user
  const hashedPassword = await bcrypt.hash('demo1234', 12)
  
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      name: 'Demo User',
      passwordHash: hashedPassword,
      city: 'London'
    }
  })

  console.log('✅ Demo user created')

  // Products data - 150+ items across 12 categories
  const products = [
    // Fresh Fruits (15 items)
    { name: 'Apples', category: 'Fresh Fruits', base: 7, room: 7, fridge: 28, freezer: 365, storage: 'room', notes: 'Store in cool, dark place' },
    { name: 'Bananas', category: 'Fresh Fruits', base: 5, room: 5, fridge: 7, freezer: 180, storage: 'room', notes: 'Keep at room temperature until ripe' },
    { name: 'Oranges', category: 'Fresh Fruits', base: 10, room: 10, fridge: 28, freezer: 365, storage: 'room', notes: 'Store in cool place' },
    { name: 'Strawberries', category: 'Fresh Fruits', base: 3, room: 2, fridge: 7, freezer: 180, storage: 'fridge', notes: 'Highly perishable' },
    { name: 'Grapes', category: 'Fresh Fruits', base: 5, room: 3, fridge: 14, freezer: 365, storage: 'fridge', notes: 'Refrigerate unwashed' },
    { name: 'Watermelon', category: 'Fresh Fruits', base: 7, room: 7, fridge: 14, freezer: 365, storage: 'room', notes: 'Whole melons last longer' },
    { name: 'Mangoes', category: 'Fresh Fruits', base: 5, room: 5, fridge: 7, freezer: 180, storage: 'room', notes: 'Ripen at room temp' },
    { name: 'Pineapple', category: 'Fresh Fruits', base: 5, room: 5, fridge: 7, freezer: 180, storage: 'room', notes: 'Cut pineapple needs fridge' },
    { name: 'Blueberries', category: 'Fresh Fruits', base: 5, room: 2, fridge: 10, freezer: 180, storage: 'fridge', notes: 'Very delicate' },
    { name: 'Peaches', category: 'Fresh Fruits', base: 4, room: 4, fridge: 7, freezer: 180, storage: 'room', notes: 'Ripen at room temp' },
    { name: 'Pears', category: 'Fresh Fruits', base: 5, room: 5, fridge: 14, freezer: 180, storage: 'room', notes: 'Ripen off tree' },
    { name: 'Cherries', category: 'Fresh Fruits', base: 3, room: 2, fridge: 10, freezer: 180, storage: 'fridge', notes: 'Keep cold and dry' },
    { name: 'Kiwi', category: 'Fresh Fruits', base: 7, room: 7, fridge: 28, freezer: 180, storage: 'room', notes: 'Store with apples to ripen' },
    { name: 'Plums', category: 'Fresh Fruits', base: 4, room: 4, fridge: 7, freezer: 180, storage: 'room', notes: 'Ripen at room temp' },
    { name: 'Papaya', category: 'Fresh Fruits', base: 5, room: 5, fridge: 7, freezer: 180, storage: 'room', notes: 'Tropical fruit' },

    // Fresh Vegetables (20 items)
    { name: 'Tomatoes', category: 'Fresh Vegetables', base: 7, room: 7, fridge: 14, freezer: 180, storage: 'room', notes: 'Best flavor at room temp' },
    { name: 'Lettuce', category: 'Fresh Vegetables', base: 5, room: 2, fridge: 10, freezer: 0, storage: 'fridge', notes: 'Wash before storing' },
    { name: 'Carrots', category: 'Fresh Vegetables', base: 14, room: 7, fridge: 28, freezer: 365, storage: 'fridge', notes: 'Remove greens before storing' },
    { name: 'Broccoli', category: 'Fresh Vegetables', base: 5, room: 2, fridge: 7, freezer: 365, storage: 'fridge', notes: 'Store unwashed' },
    { name: 'Bell Peppers', category: 'Fresh Vegetables', base: 7, room: 5, fridge: 14, freezer: 180, storage: 'fridge', notes: 'Keep in crisper' },
    { name: 'Cucumbers', category: 'Fresh Vegetables', base: 7, room: 5, fridge: 10, freezer: 0, storage: 'fridge', notes: 'Sensitive to cold' },
    { name: 'Spinach', category: 'Fresh Vegetables', base: 5, room: 1, fridge: 7, freezer: 180, storage: 'fridge', notes: 'Highly perishable' },
    { name: 'Potatoes', category: 'Fresh Vegetables', base: 30, room: 30, fridge: 90, freezer: 365, storage: 'room', notes: 'Store in dark, cool place' },
    { name: 'Onions', category: 'Fresh Vegetables', base: 30, room: 30, fridge: 60, freezer: 180, storage: 'room', notes: 'Keep dry and ventilated' },
    { name: 'Garlic', category: 'Fresh Vegetables', base: 60, room: 60, fridge: 90, freezer: 365, storage: 'room', notes: 'Store in cool, dry place' },
    { name: 'Zucchini', category: 'Fresh Vegetables', base: 5, room: 3, fridge: 7, freezer: 180, storage: 'fridge', notes: 'Do not wash before storing' },
    { name: 'Cauliflower', category: 'Fresh Vegetables', base: 5, room: 2, fridge: 7, freezer: 365, storage: 'fridge', notes: 'Store in crisper' },
    { name: 'Cabbage', category: 'Fresh Vegetables', base: 14, room: 7, fridge: 28, freezer: 180, storage: 'fridge', notes: 'Long lasting vegetable' },
    { name: 'Celery', category: 'Fresh Vegetables', base: 7, room: 2, fridge: 14, freezer: 180, storage: 'fridge', notes: 'Wrap in foil' },
    { name: 'Mushrooms', category: 'Fresh Vegetables', base: 5, room: 1, fridge: 7, freezer: 180, storage: 'fridge', notes: 'Store in paper bag' },
    { name: 'Green Beans', category: 'Fresh Vegetables', base: 5, room: 2, fridge: 7, freezer: 365, storage: 'fridge', notes: 'Keep dry' },
    { name: 'Eggplant', category: 'Fresh Vegetables', base: 7, room: 5, fridge: 10, freezer: 180, storage: 'room', notes: 'Sensitive to cold' },
    { name: 'Sweet Potatoes', category: 'Fresh Vegetables', base: 21, room: 21, fridge: 60, freezer: 365, storage: 'room', notes: 'Store in cool, dark place' },
    { name: 'Radishes', category: 'Fresh Vegetables', base: 7, room: 3, fridge: 14, freezer: 0, storage: 'fridge', notes: 'Remove greens' },
    { name: 'Asparagus', category: 'Fresh Vegetables', base: 3, room: 1, fridge: 5, freezer: 365, storage: 'fridge', notes: 'Stand in water' },

    // Dairy (15 items)
    { name: 'Milk', category: 'Dairy', base: 7, room: 0, fridge: 7, freezer: 90, storage: 'fridge', notes: 'Must refrigerate' },
    { name: 'Cheddar Cheese', category: 'Dairy', base: 21, room: 0, fridge: 60, freezer: 180, storage: 'fridge', notes: 'Wrap tightly' },
    { name: 'Yogurt', category: 'Dairy', base: 14, room: 0, fridge: 21, freezer: 60, storage: 'fridge', notes: 'Check expiry date' },
    { name: 'Butter', category: 'Dairy', base: 30, room: 2, fridge: 90, freezer: 365, storage: 'fridge', notes: 'Can freeze' },
    { name: 'Cream', category: 'Dairy', base: 7, room: 0, fridge: 10, freezer: 90, storage: 'fridge', notes: 'Highly perishable' },
    { name: 'Mozzarella Cheese', category: 'Dairy', base: 14, room: 0, fridge: 21, freezer: 180, storage: 'fridge', notes: 'Keep in brine' },
    { name: 'Parmesan Cheese', category: 'Dairy', base: 30, room: 0, fridge: 180, freezer: 365, storage: 'fridge', notes: 'Hard cheese lasts longer' },
    { name: 'Cottage Cheese', category: 'Dairy', base: 10, room: 0, fridge: 14, freezer: 0, storage: 'fridge', notes: 'Do not freeze' },
    { name: 'Sour Cream', category: 'Dairy', base: 14, room: 0, fridge: 21, freezer: 0, storage: 'fridge', notes: 'Do not freeze' },
    { name: 'Ice Cream', category: 'Dairy', base: 60, room: 0, fridge: 0, freezer: 90, storage: 'freezer', notes: 'Keep frozen' },
    { name: 'Greek Yogurt', category: 'Dairy', base: 14, room: 0, fridge: 21, freezer: 60, storage: 'fridge', notes: 'High protein' },
    { name: 'Ricotta Cheese', category: 'Dairy', base: 7, room: 0, fridge: 10, freezer: 0, storage: 'fridge', notes: 'Soft cheese' },
    { name: 'Cream Cheese', category: 'Dairy', base: 14, room: 0, fridge: 21, freezer: 60, storage: 'fridge', notes: 'Seal tightly' },
    { name: 'Whipped Cream', category: 'Dairy', base: 5, room: 0, fridge: 7, freezer: 0, storage: 'fridge', notes: 'Use quickly' },
    { name: 'Condensed Milk', category: 'Dairy', base: 365, room: 365, fridge: 730, freezer: 730, storage: 'room', notes: 'Unopened lasts long' },

    // Meat & Poultry (15 items)
    { name: 'Chicken Breast', category: 'Meat & Poultry', base: 2, room: 0, fridge: 2, freezer: 270, storage: 'fridge', notes: 'Cook within 2 days' },
    { name: 'Ground Beef', category: 'Meat & Poultry', base: 2, room: 0, fridge: 2, freezer: 120, storage: 'fridge', notes: 'Highly perishable' },
    { name: 'Pork Chops', category: 'Meat & Poultry', base: 3, room: 0, fridge: 5, freezer: 180, storage: 'fridge', notes: 'Keep cold' },
    { name: 'Turkey Breast', category: 'Meat & Poultry', base: 2, room: 0, fridge: 2, freezer: 270, storage: 'fridge', notes: 'Similar to chicken' },
    { name: 'Bacon', category: 'Meat & Poultry', base: 7, room: 0, fridge: 14, freezer: 30, storage: 'fridge', notes: 'Cured meat' },
    { name: 'Sausages', category: 'Meat & Poultry', base: 3, room: 0, fridge: 7, freezer: 60, storage: 'fridge', notes: 'Check packaging' },
    { name: 'Beef Steak', category: 'Meat & Poultry', base: 3, room: 0, fridge: 5, freezer: 270, storage: 'fridge', notes: 'Quality meat' },
    { name: 'Lamb Chops', category: 'Meat & Poultry', base: 3, room: 0, fridge: 5, freezer: 270, storage: 'fridge', notes: 'Keep refrigerated' },
    { name: 'Whole Chicken', category: 'Meat & Poultry', base: 2, room: 0, fridge: 2, freezer: 365, storage: 'fridge', notes: 'Larger cuts last longer frozen' },
    { name: 'Ham', category: 'Meat & Poultry', base: 5, room: 0, fridge: 7, freezer: 60, storage: 'fridge', notes: 'Cooked ham' },
    { name: 'Duck Breast', category: 'Meat & Poultry', base: 2, room: 0, fridge: 3, freezer: 180, storage: 'fridge', notes: 'Rich meat' },
    { name: 'Ground Turkey', category: 'Meat & Poultry', base: 2, room: 0, fridge: 2, freezer: 120, storage: 'fridge', notes: 'Lean meat' },
    { name: 'Chicken Wings', category: 'Meat & Poultry', base: 2, room: 0, fridge: 2, freezer: 270, storage: 'fridge', notes: 'Popular cut' },
    { name: 'Pork Belly', category: 'Meat & Poultry', base: 3, room: 0, fridge: 5, freezer: 180, storage: 'fridge', notes: 'Fatty cut' },
    { name: 'Veal', category: 'Meat & Poultry', base: 3, room: 0, fridge: 5, freezer: 180, storage: 'fridge', notes: 'Tender meat' },

    // Seafood (12 items)
    { name: 'Salmon Fillet', category: 'Seafood', base: 2, room: 0, fridge: 2, freezer: 90, storage: 'fridge', notes: 'Very perishable' },
    { name: 'Shrimp', category: 'Seafood', base: 2, room: 0, fridge: 2, freezer: 180, storage: 'fridge', notes: 'Keep on ice' },
    { name: 'Tuna Steak', category: 'Seafood', base: 2, room: 0, fridge: 2, freezer: 90, storage: 'fridge', notes: 'Fresh fish' },
    { name: 'Cod Fillet', category: 'Seafood', base: 2, room: 0, fridge: 2, freezer: 180, storage: 'fridge', notes: 'White fish' },
    { name: 'Mussels', category: 'Seafood', base: 1, room: 0, fridge: 2, freezer: 90, storage: 'fridge', notes: 'Use immediately' },
    { name: 'Crab Meat', category: 'Seafood', base: 2, room: 0, fridge: 3, freezer: 90, storage: 'fridge', notes: 'Sweet meat' },
    { name: 'Oysters', category: 'Seafood', base: 3, room: 0, fridge: 7, freezer: 0, storage: 'fridge', notes: 'Keep alive until use' },
    { name: 'Lobster Tail', category: 'Seafood', base: 1, room: 0, fridge: 2, freezer: 180, storage: 'fridge', notes: 'Premium seafood' },
    { name: 'Scallops', category: 'Seafood', base: 2, room: 0, fridge: 2, freezer: 90, storage: 'fridge', notes: 'Delicate' },
    { name: 'Tilapia', category: 'Seafood', base: 2, room: 0, fridge: 2, freezer: 180, storage: 'fridge', notes: 'Mild fish' },
    { name: 'Mackerel', category: 'Seafood', base: 2, room: 0, fridge: 2, freezer: 90, storage: 'fridge', notes: 'Oily fish' },
    { name: 'Squid', category: 'Seafood', base: 2, room: 0, fridge: 2, freezer: 90, storage: 'fridge', notes: 'Clean before storing' },

    // Bakery (12 items)
    { name: 'White Bread', category: 'Bakery', base: 5, room: 5, fridge: 14, freezer: 180, storage: 'room', notes: 'Store in cool, dry place' },
    { name: 'Whole Wheat Bread', category: 'Bakery', base: 7, room: 7, fridge: 14, freezer: 180, storage: 'room', notes: 'More oil, lasts longer' },
    { name: 'Croissants', category: 'Bakery', base: 2, room: 2, fridge: 7, freezer: 60, storage: 'room', notes: 'Best fresh' },
    { name: 'Bagels', category: 'Bakery', base: 5, room: 5, fridge: 14, freezer: 180, storage: 'room', notes: 'Dense bread' },
    { name: 'Muffins', category: 'Bakery', base: 3, room: 3, fridge: 7, freezer: 90, storage: 'room', notes: 'Sweet baked goods' },
    { name: 'Baguette', category: 'Bakery', base: 1, room: 1, fridge: 3, freezer: 90, storage: 'room', notes: 'Eat same day' },
    { name: 'Donuts', category: 'Bakery', base: 2, room: 2, fridge: 7, freezer: 60, storage: 'room', notes: 'Cream-filled need fridge' },
    { name: 'Cake', category: 'Bakery', base: 3, room: 3, fridge: 7, freezer: 180, storage: 'room', notes: 'Frosted cakes need fridge' },
    { name: 'Cookies', category: 'Bakery', base: 14, room: 14, fridge: 30, freezer: 180, storage: 'room', notes: 'Keep in airtight container' },
    { name: 'Pita Bread', category: 'Bakery', base: 7, room: 7, fridge: 14, freezer: 180, storage: 'room', notes: 'Flatbread' },
    { name: 'Tortillas', category: 'Bakery', base: 14, room: 14, fridge: 30, freezer: 180, storage: 'room', notes: 'Sealed package' },
    { name: 'Brownies', category: 'Bakery', base: 5, room: 5, fridge: 14, freezer: 90, storage: 'room', notes: 'Chocolate treat' },

    // Pantry Staples (20 items)
    { name: 'Rice', category: 'Pantry Staples', base: 730, room: 730, fridge: 1095, freezer: 1460, storage: 'room', notes: 'Long shelf life' },
    { name: 'Pasta', category: 'Pantry Staples', base: 730, room: 730, fridge: 1095, freezer: 1460, storage: 'room', notes: 'Dry pasta' },
    { name: 'Canned Tomatoes', category: 'Pantry Staples', base: 730, room: 730, fridge: 5, freezer: 0, storage: 'room', notes: 'Unopened lasts years' },
    { name: 'Olive Oil', category: 'Pantry Staples', base: 365, room: 365, fridge: 730, freezer: 0, storage: 'room', notes: 'Store in dark place' },
    { name: 'Flour', category: 'Pantry Staples', base: 365, room: 365, fridge: 730, freezer: 1095, storage: 'room', notes: 'Keep dry' },
    { name: 'Sugar', category: 'Pantry Staples', base: 730, room: 730, fridge: 1095, freezer: 1460, storage: 'room', notes: 'Indefinite if dry' },
    { name: 'Salt', category: 'Pantry Staples', base: 1825, room: 1825, fridge: 1825, freezer: 1825, storage: 'room', notes: 'Never expires' },
    { name: 'Black Pepper', category: 'Pantry Staples', base: 730, room: 730, fridge: 1095, freezer: 1095, storage: 'room', notes: 'Ground loses flavor faster' },
    { name: 'Honey', category: 'Pantry Staples', base: 1825, room: 1825, fridge: 1825, freezer: 0, storage: 'room', notes: 'Never spoils' },
    { name: 'Peanut Butter', category: 'Pantry Staples', base: 180, room: 180, fridge: 365, freezer: 730, storage: 'room', notes: 'Natural needs fridge' },
    { name: 'Soy Sauce', category: 'Pantry Staples', base: 730, room: 730, fridge: 1095, freezer: 0, storage: 'room', notes: 'High salt preserves' },
    { name: 'Vinegar', category: 'Pantry Staples', base: 730, room: 730, fridge: 1095, freezer: 0, storage: 'room', notes: 'Acidic preservative' },
    { name: 'Canned Beans', category: 'Pantry Staples', base: 730, room: 730, fridge: 5, freezer: 0, storage: 'room', notes: 'Protein source' },
    { name: 'Oats', category: 'Pantry Staples', base: 365, room: 365, fridge: 730, freezer: 1095, storage: 'room', notes: 'Whole grain' },
    { name: 'Coffee Beans', category: 'Pantry Staples', base: 180, room: 180, fridge: 365, freezer: 730, storage: 'room', notes: 'Keep in airtight container' },
    { name: 'Tea Bags', category: 'Pantry Staples', base: 730, room: 730, fridge: 1095, freezer: 0, storage: 'room', notes: 'Dry storage' },
    { name: 'Cereal', category: 'Pantry Staples', base: 180, room: 180, fridge: 365, freezer: 365, storage: 'room', notes: 'Keep sealed' },
    { name: 'Crackers', category: 'Pantry Staples', base: 180, room: 180, fridge: 365, freezer: 365, storage: 'room', notes: 'Keep dry' },
    { name: 'Maple Syrup', category: 'Pantry Staples', base: 365, room: 365, fridge: 730, freezer: 0, storage: 'fridge', notes: 'Refrigerate after opening' },
    { name: 'Jam', category: 'Pantry Staples', base: 180, room: 180, fridge: 365, freezer: 730, storage: 'fridge', notes: 'Refrigerate after opening' },

    // Frozen Foods (12 items)
    { name: 'Frozen Peas', category: 'Frozen Foods', base: 365, room: 0, fridge: 5, freezer: 365, storage: 'freezer', notes: 'Keep frozen' },
    { name: 'Frozen Corn', category: 'Frozen Foods', base: 365, room: 0, fridge: 5, freezer: 365, storage: 'freezer', notes: 'Blanched and frozen' },
    { name: 'Frozen Pizza', category: 'Frozen Foods', base: 365, room: 0, fridge: 2, freezer: 365, storage: 'freezer', notes: 'Convenience food' },
    { name: 'Frozen Berries', category: 'Frozen Foods', base: 365, room: 0, fridge: 3, freezer: 365, storage: 'freezer', notes: 'Great for smoothies' },
    { name: 'Frozen Broccoli', category: 'Frozen Foods', base: 365, room: 0, fridge: 5, freezer: 365, storage: 'freezer', notes: 'Nutritious' },
    { name: 'Frozen French Fries', category: 'Frozen Foods', base: 365, room: 0, fridge: 2, freezer: 365, storage: 'freezer', notes: 'Pre-cut potatoes' },
    { name: 'Frozen Fish Sticks', category: 'Frozen Foods', base: 365, room: 0, fridge: 2, freezer: 365, storage: 'freezer', notes: 'Breaded fish' },
    { name: 'Frozen Waffles', category: 'Frozen Foods', base: 365, room: 0, fridge: 3, freezer: 365, storage: 'freezer', notes: 'Quick breakfast' },
    { name: 'Frozen Spinach', category: 'Frozen Foods', base: 365, room: 0, fridge: 5, freezer: 365, storage: 'freezer', notes: 'Leafy green' },
    { name: 'Frozen Meatballs', category: 'Frozen Foods', base: 180, room: 0, fridge: 3, freezer: 180, storage: 'freezer', notes: 'Precooked' },
    { name: 'Frozen Edamame', category: 'Frozen Foods', base: 365, room: 0, fridge: 3, freezer: 365, storage: 'freezer', notes: 'Soy beans' },
    { name: 'Frozen Mixed Vegetables', category: 'Frozen Foods', base: 365, room: 0, fridge: 5, freezer: 365, storage: 'freezer', notes: 'Variety pack' },

    // Beverages (10 items)
    { name: 'Orange Juice', category: 'Beverages', base: 7, room: 0, fridge: 7, freezer: 180, storage: 'fridge', notes: 'Refrigerate after opening' },
    { name: 'Apple Juice', category: 'Beverages', base: 7, room: 0, fridge: 7, freezer: 180, storage: 'fridge', notes: 'Fresh juice' },
    { name: 'Cola', category: 'Beverages', base: 270, room: 270, fridge: 270, freezer: 0, storage: 'room', notes: 'Carbonated' },
    { name: 'Beer', category: 'Beverages', base: 180, room: 90, fridge: 180, freezer: 0, storage: 'fridge', notes: 'Best cold' },
    { name: 'Wine', category: 'Beverages', base: 365, room: 365, fridge: 730, freezer: 0, storage: 'room', notes: 'Unopened lasts long' },
    { name: 'Sparkling Water', category: 'Beverages', base: 365, room: 365, fridge: 365, freezer: 0, storage: 'room', notes: 'Carbonated water' },
    { name: 'Iced Tea', category: 'Beverages', base: 270, room: 270, fridge: 270, freezer: 0, storage: 'room', notes: 'Bottled tea' },
    { name: 'Energy Drink', category: 'Beverages', base: 365, room: 365, fridge: 365, freezer: 0, storage: 'room', notes: 'High caffeine' },
    { name: 'Coconut Water', category: 'Beverages', base: 270, room: 270, fridge: 7, freezer: 0, storage: 'fridge', notes: 'Refrigerate after opening' },
    { name: 'Almond Milk', category: 'Beverages', base: 7, room: 0, fridge: 7, freezer: 90, storage: 'fridge', notes: 'Dairy alternative' },

    // Condiments & Sauces (12 items)
    { name: 'Ketchup', category: 'Condiments & Sauces', base: 365, room: 365, fridge: 730, freezer: 0, storage: 'fridge', notes: 'Refrigerate after opening' },
    { name: 'Mustard', category: 'Condiments & Sauces', base: 365, room: 365, fridge: 730, freezer: 0, storage: 'fridge', notes: 'Long lasting' },
    { name: 'Mayonnaise', category: 'Condiments & Sauces', base: 60, room: 0, fridge: 60, freezer: 0, storage: 'fridge', notes: 'Keep cold' },
    { name: 'Hot Sauce', category: 'Condiments & Sauces', base: 730, room: 730, fridge: 1095, freezer: 0, storage: 'room', notes: 'Spicy and preserved' },
    { name: 'BBQ Sauce', category: 'Condiments & Sauces', base: 180, room: 180, fridge: 365, freezer: 0, storage: 'fridge', notes: 'Sweet and tangy' },
    { name: 'Sriracha', category: 'Condiments & Sauces', base: 730, room: 730, fridge: 1095, freezer: 0, storage: 'room', notes: 'Chili sauce' },
    { name: 'Salsa', category: 'Condiments & Sauces', base: 30, room: 0, fridge: 30, freezer: 180, storage: 'fridge', notes: 'Fresh ingredients' },
    { name: 'Hummus', category: 'Condiments & Sauces', base: 7, room: 0, fridge: 7, freezer: 180, storage: 'fridge', notes: 'Chickpea dip' },
    { name: 'Pesto', category: 'Condiments & Sauces', base: 7, room: 0, fridge: 14, freezer: 180, storage: 'fridge', notes: 'Basil sauce' },
    { name: 'Ranch Dressing', category: 'Condiments & Sauces', base: 60, room: 0, fridge: 60, freezer: 0, storage: 'fridge', notes: 'Creamy dressing' },
    { name: 'Teriyaki Sauce', category: 'Condiments & Sauces', base: 365, room: 365, fridge: 730, freezer: 0, storage: 'room', notes: 'Asian sauce' },
    { name: 'Worcestershire Sauce', category: 'Condiments & Sauces', base: 730, room: 730, fridge: 1095, freezer: 0, storage: 'room', notes: 'Fermented sauce' },

    // Snacks (10 items)
    { name: 'Potato Chips', category: 'Snacks', base: 90, room: 90, fridge: 180, freezer: 365, storage: 'room', notes: 'Keep sealed' },
    { name: 'Pretzels', category: 'Snacks', base: 90, room: 90, fridge: 180, freezer: 365, storage: 'room', notes: 'Dry snack' },
    { name: 'Popcorn', category: 'Snacks', base: 180, room: 180, fridge: 365, freezer: 365, storage: 'room', notes: 'Kernels last long' },
    { name: 'Chocolate Bar', category: 'Snacks', base: 180, room: 180, fridge: 365, freezer: 365, storage: 'room', notes: 'Avoid heat' },
    { name: 'Granola Bars', category: 'Snacks', base: 180, room: 180, fridge: 365, freezer: 365, storage: 'room', notes: 'Energy snack' },
    { name: 'Trail Mix', category: 'Snacks', base: 180, room: 180, fridge: 365, freezer: 365, storage: 'room', notes: 'Nuts and dried fruit' },
    { name: 'Beef Jerky', category: 'Snacks', base: 365, room: 365, fridge: 730, freezer: 730, storage: 'room', notes: 'Dried meat' },
    { name: 'Fruit Gummies', category: 'Snacks', base: 365, room: 365, fridge: 730, freezer: 730, storage: 'room', notes: 'Candy' },
    { name: 'Rice Cakes', category: 'Snacks', base: 180, room: 180, fridge: 365, freezer: 365, storage: 'room', notes: 'Light snack' },
    { name: 'Protein Bar', category: 'Snacks', base: 365, room: 365, fridge: 730, freezer: 730, storage: 'room', notes: 'Fitness food' },

    // Eggs & Tofu (6 items)
    { name: 'Eggs', category: 'Eggs & Tofu', base: 28, room: 7, fridge: 35, freezer: 365, storage: 'fridge', notes: 'Keep in carton' },
    { name: 'Tofu', category: 'Eggs & Tofu', base: 7, room: 0, fridge: 7, freezer: 180, storage: 'fridge', notes: 'Keep in water' },
    { name: 'Silken Tofu', category: 'Eggs & Tofu', base: 5, room: 0, fridge: 5, freezer: 90, storage: 'fridge', notes: 'Soft texture' },
    { name: 'Egg Whites', category: 'Eggs & Tofu', base: 7, room: 0, fridge: 7, freezer: 365, storage: 'fridge', notes: 'Liquid form' },
    { name: 'Tempeh', category: 'Eggs & Tofu', base: 10, room: 0, fridge: 10, freezer: 365, storage: 'fridge', notes: 'Fermented soy' },
    { name: 'Quail Eggs', category: 'Eggs & Tofu', base: 21, room: 5, fridge: 28, freezer: 365, storage: 'fridge', notes: 'Small eggs' },
  ]

  // Create products with proper storage method associations
  const storageMethodMap = {
    'room': room.id,
    'fridge': fridge.id,
    'freezer': freezer.id
  }

  let createdCount = 0
  for (const p of products) {
    const storageId = storageMethodMap[p.storage]
    
    // Check if product already exists
    const existing = await prisma.product.findFirst({
      where: { name: p.name }
    })
    
    if (!existing) {
      await prisma.product.create({
        data: {
          name: p.name,
          category: p.category,
          baseShelfLifeDays: p.base,
          roomTempShelfLifeDays: p.room,
          fridgeShelfLifeDays: p.fridge,
          freezerShelfLifeDays: p.freezer,
          storageNotes: p.notes,
          defaultStorageMethodId: storageId
        }
      })
    }
    
    createdCount++
    if (createdCount % 20 === 0) {
      console.log(`✅ Processed ${createdCount} products...`)
    }
  }

  console.log(`✅ All ${createdCount} products created`)

  // Create a sample inventory item for demo user
  const chickenProduct = await prisma.product.findFirst({
    where: { name: 'Chicken Breast' }
  })

  if (chickenProduct) {
    const purchasedAt = new Date()
    purchasedAt.setDate(purchasedAt.getDate() - 1) // Purchased yesterday

    const item = await prisma.inventoryItem.create({
      data: {
        userId: demoUser.id,
        productId: chickenProduct.id,
        storageMethodId: fridge.id,
        purchasedAt,
        quantity: 2,
        unit: 'pieces',
        notes: 'Sample item for demo'
      }
    })

    // Create weather snapshot
    await prisma.weatherSnapshot.create({
      data: {
        inventoryItemId: item.id,
        tempC: 4,
        humidity: 65
      }
    })

    // Create prediction
    await prisma.prediction.create({
      data: {
        inventoryItemId: item.id,
        predictedExpiry: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Expires tomorrow
        confidence: 0.85,
        modelVersion: 'rb-1.1'
      }
    })

    console.log('✅ Sample inventory item created')
  }

  console.log('🎉 Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
