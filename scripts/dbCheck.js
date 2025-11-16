const { PrismaClient } = require('@prisma/client')

;(async () => {
  const prisma = new PrismaClient()
  try {
    const v = await prisma.$queryRawUnsafe('SELECT version()')
    const users = await prisma.user.count()
    console.log('Connected to Postgres. Version:', v?.[0]?.version || v)
    console.log('User count:', users)
    process.exit(0)
  } catch (e) {
    console.error('DB check failed:', e)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
})()
