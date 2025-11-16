const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function updateDemoUserCity() {
  try {
    // Update demo user's city
    const updated = await prisma.user.update({
      where: { email: 'demo@example.com' },
      data: { city: 'Mumbai' } // Change this to your city
    })
    
    console.log('✅ Updated demo user city to:', updated.city)
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateDemoUserCity()
