import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ 
    status: 'online', 
    timestamp: new Date().toISOString(),
    env_check: {
      has_db_uri: !!process.env.MONGODB_URI,
      has_clerk_key: !!process.env.CLERK_SECRET_KEY,
      port: process.env.PORT || 'not-set'
    }
  })
}
