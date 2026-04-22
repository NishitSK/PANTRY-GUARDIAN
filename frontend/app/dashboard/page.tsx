import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'
import connectDB from '@/lib/mongodb'
import { InventoryItem, User } from '@/models'
import DashboardLayout from '@/components/layout/DashboardLayout'
import OverviewHero from '@/components/dashboard/OverviewHero'
import ExpiringSoonCarousel from '@/components/dashboard/ExpiringSoonCarousel'
import QuickActions from '@/components/dashboard/QuickActions'
import { calculateShelfLife } from '@/lib/shelfLifeDb'
import Link from 'next/link'
import { Plus, ArrowRight } from 'lucide-react'

async function getDashboardStats(userId: string) {
    try {
        await connectDB()
        const uri = process.env.MONGODB_URI || ''
        console.log(`[DB Diagnostic] Dashboard connecting to: ${uri.substring(0, 15)}...`)
    } catch (error) {
        console.warn('Dashboard DB connection skipped:', error)
        return {
            totalItems: 0,
            expiringSoonCount: 0,
            freshCount: 0,
            expiredCount: 0,
            expiringItems: [],
            freshPercent: 0,
            urgentItemName: null as string | null,
        }
    }

    const items = await InventoryItem.find({ userId }).populate('productId').populate('storageMethodId').lean()
  
    const today = new Date()
    let expiringSoonCount = 0
    let expiredCount = 0
    let freshCount = 0
    const expiringItems: { _id: string; name: string; category: string; daysLeft: number }[] = []
    let urgentItemName: string | null = null

    for (const item of items) {
        const product = item.productId as any
        const storage = item.storageMethodId as any
        if (!product || !storage) continue

        const storageName = storage?.name || 'Room Temp'
        const shelfLife = calculateShelfLife(product, storageName, !!item.openedAt)

        const expiryDate = new Date(item.purchasedAt)
        expiryDate.setDate(expiryDate.getDate() + shelfLife)
        const daysLeft = Math.round((expiryDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))

        if (daysLeft < 0) {
            expiredCount++
        } else if (daysLeft <= 3) {
            expiringSoonCount++
            expiringItems.push({
                _id: item._id.toString(),
                name: product.name,
                category: product.category,
                daysLeft,
            })
            if (!urgentItemName) urgentItemName = product.name
        } else {
            freshCount++
        }
    }

    const totalItems = items.length
    const freshPercent = totalItems > 0
        ? Math.round(((freshCount) / totalItems) * 100)
        : 0

    return {
        totalItems,
        expiringSoonCount,
        freshCount,
        expiredCount,
        freshPercent,
        expiringItems: expiringItems.sort((a, b) => a.daysLeft - b.daysLeft).slice(0, 4),
        urgentItemName,
    }
}

export default async function DashboardPage() {
    const { userId } = await auth()
    if (!userId) redirect('/auth/login')

    const user = await currentUser()
    const email = user?.emailAddresses?.[0]?.emailAddress
    let dbUser;
    let stats;
    let connectionError = null;

    try {
        await connectDB()
        const email = user?.emailAddresses?.[0]?.emailAddress
        if (!email) redirect('/auth/login')

        dbUser = await User.findOne({ email }).lean()
        if (!dbUser) {
            await User.create({
                email,
                name: user?.fullName || user?.firstName || undefined,
                image: user?.imageUrl,
            })
            dbUser = await User.findOne({ email }).lean()
        }

        if (!dbUser) redirect('/auth/login')
        stats = await getDashboardStats(dbUser._id.toString())
    } catch (error: any) {
        console.error('[Dashboard Error]', error)
        connectionError = error.message || 'Unknown connection error'
        stats = {
            totalItems: 0,
            expiringSoonCount: 0,
            freshCount: 0,
            expiredCount: 0,
            freshPercent: 0,
            expiringItems: [],
            urgentItemName: null
        }
    }

    if (connectionError) {
        return (
            <DashboardLayout>
                <div className="max-w-[1400px] mx-auto py-20 px-4">
                    <div className="border-4 border-black bg-[#FFD2CC] p-10 shadow-[10px_10px_0_#000] text-center">
                        <h1 className="text-3xl font-black uppercase mb-4">Connection Diagnostic</h1>
                        <p className="text-xl font-bold mb-8">The dashboard cannot reach your database.</p>
                        <div className="bg-white/50 p-6 border-2 border-black inline-block text-left font-mono text-sm mb-8">
                            <p className="text-red-700 font-bold mb-2">Error: {connectionError}</p>
                            <p className="text-black/60">Possible causes:</p>
                            <ul className="list-disc ml-6 mt-2 space-y-1">
                                <li>MongoDB Atlas IP Whitelist is missing (Add 0.0.0.0/0)</li>
                                <li>Vercel Environment Variables are not applied (Redeploy needed)</li>
                                <li>Database credentials in MONGODB_URI are incorrect</li>
                            </ul>
                        </div>
                        <div>
                            <button 
                                onClick={() => window.location.reload()} 
                                className="border-2 border-black bg-white px-6 py-2 font-black uppercase tracking-widest hover:bg-black hover:text-white transition-colors"
                            >
                                Try Refreshing
                            </button>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        )
    }

    const isEmpty = stats.totalItems === 0

    // Contextual header copy — no poetic placeholder text
    const headerSubtitle = isEmpty
        ? '0 items tracked — add your first item to get started'
        : stats.expiringSoonCount > 0
            ? `${stats.totalItems} item${stats.totalItems !== 1 ? 's' : ''} tracked · ${stats.expiringSoonCount} expiring soon`
            : `${stats.totalItems} item${stats.totalItems !== 1 ? 's' : ''} tracked · Items in prime condition`

    return (
        <DashboardLayout>
            <div className="max-w-[1400px] mx-auto py-6 md:py-10 px-2 sm:px-4">
                {/* Status Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mb-8 md:mb-12 border-4 border-black bg-[#F6F1E7] px-4 sm:px-6 py-4 sm:py-5 shadow-[8px_8px_0_#000]">
                    <div>
                        <h1 className="text-xs font-manrope font-black uppercase tracking-[0.35em] text-black mb-2">Pantry Status</h1>
                        <p className="text-xl sm:text-2xl font-noto-serif font-bold text-black">{headerSubtitle}</p>
                    </div>
                    <div className="flex w-full sm:w-auto items-center justify-end gap-3 sm:gap-4">
                        <div className="h-12 w-12 border-2 border-black flex items-center justify-center bg-[#FFE66D]">
                            <div className="h-full w-full flex items-center justify-center text-black font-black">
                                {user?.firstName?.charAt(0) || user?.username?.charAt(0) || 'U'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Hero */}
                <OverviewHero
                    userName={user?.firstName || user?.fullName || 'Chef'}
                    purity={stats.freshPercent}
                    itemsTracked={stats.totalItems}
                    toRestock={stats.expiringSoonCount}
                    isEmpty={isEmpty}
                    urgentItemName={stats.urgentItemName}
                />

                <div className="grid grid-cols-12 gap-8 mt-16">
                    {/* Main Section */}
                    <div className="col-span-12 lg:col-span-8">
                        <ExpiringSoonCarousel items={stats.expiringItems} />

                        {/* Pantry Health Report — data-driven, never hardcoded */}
                        <div className="bg-[#FFFDF7] p-10 border-4 border-black shadow-[10px_10px_0_#000] relative overflow-hidden">
                            <div className="relative z-10">
                                {isEmpty ? (
                                    /* Empty state */
                                    <>
                                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-black/50 mb-3">Recipe Suggestions</p>
                                        <h2 className="text-3xl font-noto-serif font-bold text-black mb-4">No pantry data yet</h2>
                                        <p className="text-black/70 font-manrope text-base leading-relaxed max-w-xl mb-8">
                                            Recipe suggestions appear once you start tracking items. Add anything in your pantry — even a single item — and we&apos;ll start matching recipes.
                                        </p>
                                        <Link href="/add">
                                            <button className="flex items-center gap-3 text-black font-black uppercase tracking-[0.12em] hover:gap-5 transition-all group border-2 border-black px-4 py-2 bg-[#FFE66D] hover:bg-black hover:text-white">
                                                <Plus className="h-5 w-5" />
                                                Add your first item
                                            </button>
                                        </Link>
                                    </>
                                ) : (
                                    /* Data-present state */
                                    <>
                                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-black/50 mb-3">Recipe Suggestions</p>
                                        <h2 className="text-3xl font-noto-serif font-bold text-black mb-4">Pantry Health Report</h2>
                                        <p className="text-black/80 font-manrope text-lg leading-relaxed max-w-xl mb-8">
                                            {stats.urgentItemName
                                                ? <>Based on your {stats.totalItems} tracked item{stats.totalItems !== 1 ? 's' : ''}, we suggest using your <span className="text-black bg-[#93E1A8] px-1 font-black">{stats.urgentItemName}</span> soon — it&apos;s expiring in 3 days or less.</>
                                                : <>You have {stats.totalItems} item{stats.totalItems !== 1 ? 's' : ''} in your pantry. Visit the recipe gallery to find meals that match what you have.</>
                                            }
                                        </p>
                                        <div className="flex flex-wrap gap-3">
                                            <Link href="/recipes">
                                                <button className="flex items-center gap-3 text-black font-black uppercase tracking-[0.12em] hover:gap-5 transition-all group border-2 border-black px-4 py-2 bg-white hover:bg-[#FFE66D]">
                                                    Explore recipe gallery
                                                    <ArrowRight className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                                </button>
                                            </Link>
                                            <Link href="/inventory">
                                                <button className="flex items-center gap-3 text-black font-black uppercase tracking-[0.12em] border-2 border-black px-4 py-2 bg-white hover:bg-black hover:text-white transition-all">
                                                    View full inventory
                                                </button>
                                            </Link>
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="absolute right-[-5%] bottom-[-5%] w-48 h-48 bg-[#FFE66D] border-4 border-black rotate-12 opacity-20" />
                        </div>
                    </div>

                    {/* Sidebar Actions */}
                    <div className="col-span-12 lg:col-span-4 space-y-8">
                        {/* Quick Actions — full client component with working scan */}
                        <QuickActions />

                        {/* Pantry Health — real computed metrics */}
                        <div className="bg-white p-8 border-4 border-black shadow-[8px_8px_0_#000]">
                            <h3 className="text-xl font-noto-serif font-bold text-black mb-6">Pantry Health</h3>

                            {isEmpty ? (
                                <div className="text-center py-4">
                                    <p className="text-black/50 font-manrope text-sm mb-4">No items tracked yet.</p>
                                    <Link href="/add">
                                        <button className="border-2 border-black bg-[#FFE66D] px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] hover:bg-black hover:text-white transition-colors">
                                            Track first item
                                        </button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Fresh bar */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-black">
                                            <span>Prime</span>
                                            <span>{stats.freshCount} item{stats.freshCount !== 1 ? 's' : ''} · {stats.freshPercent}%</span>
                                        </div>
                                        <div className="h-2 bg-black/10 overflow-hidden border border-black">
                                            <div
                                                className="h-full bg-[#93E1A8] transition-all duration-1000"
                                                style={{ width: `${stats.freshPercent}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Expiring soon bar */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-black">
                                            <span>Expiring Soon</span>
                                            <span>{stats.expiringSoonCount} item{stats.expiringSoonCount !== 1 ? 's' : ''}</span>
                                        </div>
                                        <div className="h-2 bg-black/10 overflow-hidden border border-black">
                                            <div
                                                className="h-full bg-[#FFE66D] transition-all duration-1000"
                                                style={{ width: `${stats.totalItems > 0 ? Math.round((stats.expiringSoonCount / stats.totalItems) * 100) : 0}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Expired bar */}
                                    {stats.expiredCount > 0 && (
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-black">
                                                <span>Expired</span>
                                                <span className="text-red-700">{stats.expiredCount} item{stats.expiredCount !== 1 ? 's' : ''}</span>
                                            </div>
                                            <div className="h-2 bg-black/10 overflow-hidden border border-black">
                                                <div
                                                    className="h-full bg-[#FFD2CC] transition-all duration-1000"
                                                    style={{ width: `${Math.round((stats.expiredCount / stats.totalItems) * 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}