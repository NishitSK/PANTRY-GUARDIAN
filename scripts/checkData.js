const { PrismaClient } = require('@prisma/client')

;(async () => {
  const prisma = new PrismaClient()
  try {
    const productCount = await prisma.product.count()
    const storageCount = await prisma.storageMethod.count()
    const userCount = await prisma.user.count()
    const inventoryCount = await prisma.inventoryItem.count()
    
    console.log('Database counts:')
    console.log('- Users:', userCount)
    console.log('- Products:', productCount)
    console.log('- Storage Methods:', storageCount)
    console.log('- Inventory Items:', inventoryCount)
    
    if (productCount === 0) {
      console.log('\n⚠️  No products found. Run: npm run seed')
    }
  } catch (e) {
    console.error('Error:', e)
  } finally {
    await prisma.$disconnect()
  }
})()
