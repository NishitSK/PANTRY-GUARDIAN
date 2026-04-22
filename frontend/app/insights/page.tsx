import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'
import connectDB from '@/lib/mongodb'
import { User, InventoryItem, Prediction } from '@/models'
import DashboardLayout from '@/components/layout/DashboardLayout'
import nextDynamic from 'next/dynamic'
import { predict } from '@/lib/prediction'
import { getCurrentWeather } from '@/lib/weather'
import Link from 'next/link'
import {
  Package, AlertTriangle, Timer, Leaf,
  TrendingUp, Activity, ArrowUpRight, Plus
} from 'lucide-react'

const InsightsLocationWeather = nextDynamic(() => import('@/components/InsightsLocationWeather'), { ssr: false })
const InsightsCharts = nextDynamic(() => import('@/components/insights/InsightsCharts'), { ssr: false })

export default async function InsightsPage() {
    const { userId } = await auth()
    if (!userId) {
        redirect('/auth/login')
    }

    const clerkUser = await currentUser()
    const email = clerkUser?.emailAddresses?.[0]?.emailAddress
    if (!email) {
        redirect('/auth/login')
    }

    await connectDB()
    const uri = process.env.MONGODB_URI || ''
    console.log(`[DB Diagnostic] Insights connecting to: ${uri.substring(0, 15)}...`)

    let user = await User.findOne({ email }).lean()

    if (!user) {
        await User.create({
            email,
            name: clerkUser?.fullName || clerkUser?.firstName || undefined,
            image: clerkUser?.imageUrl,
        })
        user = await User.findOne({ email }).lean()
    }

    if (!user) {
        redirect('/auth/login')
    }

    const weather = user.city ? await getCurrentWeather(user.city) : null
    const currentTempC = weather?.tempC ?? 20
    const currentHumidity = weather?.humidity ?? 60

    const items = await InventoryItem.find({ userId: user._id.toString() })
        .populate('productId')
        .populate('storageMethodId')
        .lean()

    const itemsWithPredictions = await Promise.all(
        items.map(async (item: any) => {
            const predictions = await Prediction.find({ inventoryItemId: item._id.toString() })
                .sort({ createdAt: -1 })
                .limit(1)
                .lean()

            return {
                ...item,
                predictions: predictions
            }
        })
    )

    // Count by category
    const categoryCount = itemsWithPredictions.reduce((acc, item: any) => {
        const cat = item.productId?.category || 'Unknown'
        acc[cat] = (acc[cat] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    const sortedCategories = (Object.entries(categoryCount) as [string, number][])
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)

    // Calculate real dashboard stats
    const now = new Date()
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

    let expiredCount = 0
    let expiringCount = 0
    let freshCount = 0

    itemsWithPredictions.forEach((item: any) => {
        const product = item.productId
        const storage = item.storageMethodId
        if (!product || !storage) return

        const prediction = predict({
            baseShelfLifeDays: product.baseShelfLifeDays,
            roomTempShelfLifeDays: product.roomTempShelfLifeDays,
            fridgeShelfLifeDays: product.fridgeShelfLifeDays,
            freezerShelfLifeDays: product.freezerShelfLifeDays,
            storageMethodName: storage.name,
            tempMinC: storage.tempRangeMinC,
            tempMaxC: storage.tempRangeMaxC,
            humidityPreferred: storage.humidityPreferred,
            tempC: currentTempC,
            humidity: currentHumidity,
            purchasedAt: new Date(item.purchasedAt),
            openedAt: item.openedAt ? new Date(item.openedAt) : null,
        })

        const expiryDate = new Date(prediction.predictedExpiry)

        if (expiryDate < now) expiredCount++
        else if (expiryDate <= threeDaysFromNow) expiringCount++
        else freshCount++
    })

    const totalItems = itemsWithPredictions.length
    const freshPercent = totalItems > 0 ? Math.round((freshCount / totalItems) * 100) : 0

    // Context-aware header description (no hardcoded editorial)
    const headerDesc = totalItems === 0
        ? 'No items tracked yet. Add your first pantry item to start seeing analytics.'
        : `${totalItems} item${totalItems !== 1 ? 's' : ''} tracked — ${freshCount} in prime condition, ${expiringCount} expiring soon${expiredCount > 0 ? `, ${expiredCount} expired` : ''}.`

    return (
        <DashboardLayout>
            <div className="max-w-[1400px] mx-auto py-6 md:py-12 px-2 sm:px-4 md:px-6 space-y-8 md:space-y-12">

                {/* Editorial Header */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8 border-4 border-black bg-white p-4 sm:p-6 shadow-[8px_8px_0_#000]">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] bg-[#FFE66D] text-black px-3 py-1 border-2 border-black font-black uppercase tracking-[0.2em]">Curation Intel</span>
                            <div className="h-[2px] w-12 bg-black" />
                        </div>
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-noto-serif font-bold text-black leading-tight">Kitchen Analytics</h1>
                        <p className="text-black/80 font-manrope text-base sm:text-lg max-w-xl leading-relaxed">
                            {headerDesc}
                        </p>
                    </div>
                    <div className="block">
                        <InsightsLocationWeather />
                    </div>
                </header>

                {/* Empty state — full section when no items */}
                {totalItems === 0 ? (
                    <section className="border-4 border-black bg-[#FFFDF7] p-10 shadow-[8px_8px_0_#000] text-center">
                        <div className="max-w-md mx-auto space-y-6">
                            <div className="w-20 h-20 border-4 border-black bg-[#FFE66D] flex items-center justify-center mx-auto">
                                <Package className="w-10 h-10 text-black" />
                            </div>
                            <h2 className="font-noto-serif text-4xl text-black">Your pantry is empty</h2>
                            <p className="font-manrope text-base text-black/70 leading-relaxed">
                                Analytics, charts, and insights will appear here once you start tracking items.
                                Add your first item to unlock freshness tracking, expiry predictions, and category breakdowns.
                            </p>
                            <Link href="/add">
                                <button className="inline-flex items-center gap-3 border-2 border-black bg-[#FFE66D] px-8 py-4 font-black uppercase tracking-[0.12em] text-black shadow-[4px_4px_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
                                    <Plus className="h-5 w-5" />
                                    Add your first item
                                </button>
                            </Link>
                        </div>
                    </section>
                ) : (
                    <>
                        {/* Expiry Formula */}
                        <section className="border-4 border-black bg-[#F6F1E7] p-5 shadow-[8px_8px_0_#000]">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/60">Expiry Formula</p>
                                    <h2 className="font-noto-serif text-3xl text-black">How expiry is calculated</h2>
                                    <p className="font-manrope text-sm leading-6 text-black/75 max-w-2xl">
                                        Shelf life comes from the item&apos;s storage method, then temperature and humidity adjust it for room-temperature storage.
                                        Opened items are reduced further before the purchase date is used to calculate the expiry date.
                                    </p>
                                </div>

                                <div className="grid gap-3 md:grid-cols-2 lg:max-w-2xl">
                                    <div className="border-2 border-black bg-white px-4 py-3 shadow-[4px_4px_0_#000]">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/60">Formula</p>
                                        <p className="mt-2 font-mono text-sm leading-6 text-black">
                                            Expiry Date = Purchase Date + Adjusted Shelf Life
                                        </p>
                                    </div>
                                    <div className="border-2 border-black bg-white px-4 py-3 shadow-[4px_4px_0_#000]">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/60">Opened Items</p>
                                        <p className="mt-2 font-mono text-sm leading-6 text-black">
                                            Adjusted Shelf Life = Storage Shelf Life × Weather Penalty × 0.75
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Stats Grid — all computed from real data */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-white p-8 border-4 border-black shadow-[6px_6px_0_#000] transition-all group overflow-hidden relative">
                                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Package className="w-24 h-24 text-black" />
                                </div>
                                <div className="relative space-y-4">
                                    <div className="w-12 h-12 border-2 border-black bg-[#FFE66D] flex items-center justify-center">
                                        <Package className="w-6 h-6 text-black" />
                                    </div>
                                    <div>
                                        <p className="text-4xl font-noto-serif font-bold text-black">{totalItems}</p>
                                        <p className="text-[10px] font-black text-black/70 uppercase tracking-widest mt-1">Total Stock</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-8 border-4 border-black shadow-[6px_6px_0_#000] transition-all group overflow-hidden relative">
                                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <AlertTriangle className="w-24 h-24 text-red-600" />
                                </div>
                                <div className="relative space-y-4">
                                    <div className="w-12 h-12 border-2 border-black bg-[#FFD2CC] flex items-center justify-center">
                                        <AlertTriangle className="w-6 h-6 text-red-600" />
                                    </div>
                                    <div>
                                        <p className="text-4xl font-noto-serif font-bold text-red-600">{expiredCount}</p>
                                        <p className="text-[10px] font-black text-black/70 uppercase tracking-widest mt-1">Stale/Expired</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-8 border-4 border-black shadow-[6px_6px_0_#000] transition-all group overflow-hidden relative">
                                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Timer className="w-24 h-24 text-black" />
                                </div>
                                <div className="relative space-y-4">
                                    <div className="w-12 h-12 border-2 border-black bg-[#FFE66D] flex items-center justify-center">
                                        <Timer className="w-6 h-6 text-black" />
                                    </div>
                                    <div>
                                        <p className="text-4xl font-noto-serif font-bold text-black">{expiringCount}</p>
                                        <p className="text-[10px] font-black text-black/70 uppercase tracking-widest mt-1">Urgent Rescue</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-8 border-4 border-black shadow-[6px_6px_0_#000] transition-all group overflow-hidden relative">
                                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Leaf className="w-24 h-24 text-black" />
                                </div>
                                <div className="relative space-y-4">
                                    <div className="w-12 h-12 border-2 border-black bg-[#93E1A8] flex items-center justify-center">
                                        <Leaf className="w-6 h-6 text-black" />
                                    </div>
                                    <div>
                                        <p className="text-4xl font-noto-serif font-bold text-black">{freshCount}</p>
                                        <p className="text-[10px] font-black text-black/70 uppercase tracking-widest mt-1">Prime Condition</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Charts & Depth */}
                        <div className="grid grid-cols-12 gap-6 md:gap-8">
                            <div className="col-span-12 lg:col-span-8 bg-[#F4F4EF] border-4 border-black p-4 sm:p-6 md:p-10 shadow-[8px_8px_0_#000] overflow-hidden">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 md:mb-10">
                                    <div className="flex items-center gap-3">
                                        <TrendingUp className="h-5 w-5 text-black" />
                                        <h2 className="text-sm font-manrope font-black uppercase tracking-[0.2em] text-black">Distribution Trends</h2>
                                    </div>
                                    <Link href="/inventory">
                                        <button className="flex min-h-11 items-center gap-2 text-[10px] font-black uppercase tracking-widest text-black border-2 border-black bg-[#FFE66D] px-3 py-2 shadow-[4px_4px_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
                                            Full Inventory <ArrowUpRight className="h-3 w-3" />
                                        </button>
                                    </Link>
                                </div>
                                <InsightsCharts
                                    categoryData={sortedCategories}
                                    storageData={{
                                        pantry: itemsWithPredictions.filter((i: any) => i.storageMethodId?.name?.toLowerCase().includes('room')).length,
                                        fridge: itemsWithPredictions.filter((i: any) => {
                                            const name = i.storageMethodId?.name?.toLowerCase() || ''
                                            return name.includes('fridge') || name.includes('refrig')
                                        }).length,
                                        freezer: itemsWithPredictions.filter((i: any) => i.storageMethodId?.name?.toLowerCase().includes('freezer')).length
                                    }}
                                    totalItems={totalItems}
                                />
                            </div>

                            <div className="col-span-12 lg:col-span-4 space-y-6">
                                {/* Preservation Quotient — real computed values */}
                                <div className="bg-black text-white p-6 sm:p-8 md:p-10 relative overflow-hidden border-4 border-black shadow-[8px_8px_0_#93E1A8]">
                                    <div className="absolute -right-8 -bottom-8 opacity-10">
                                        <Activity className="w-48 h-48" />
                                    </div>
                                    <h3 className="text-2xl font-noto-serif mb-4">Preservation Quotient</h3>
                                    <p className="text-stone-400 font-manrope text-sm leading-relaxed mb-6">
                                        {freshPercent}% of your pantry is currently in prime condition.
                                        {expiringCount > 0 && ` ${expiringCount} item${expiringCount !== 1 ? 's' : ''} need attention in the next 3 days.`}
                                        {expiredCount > 0 && ` ${expiredCount} item${expiredCount !== 1 ? 's' : ''} have already expired.`}
                                    </p>
                                    <div className="space-y-4">
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1">
                                            <span>Pantry Health</span>
                                            <span className="text-[#93E1A8]">{freshPercent}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-white/10 border border-white overflow-hidden">
                                            <div className="h-full bg-[#93E1A8] transition-all duration-1000" style={{ width: `${freshPercent}%` }} />
                                        </div>

                                        {expiringCount > 0 && (
                                            <>
                                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1">
                                                    <span>Expiring Soon</span>
                                                    <span className="text-[#FFE66D]">{totalItems > 0 ? Math.round((expiringCount / totalItems) * 100) : 0}%</span>
                                                </div>
                                                <div className="h-2 w-full bg-white/10 border border-white overflow-hidden">
                                                    <div className="h-full bg-[#FFE66D] transition-all duration-1000" style={{ width: `${totalItems > 0 ? Math.round((expiringCount / totalItems) * 100) : 0}%` }} />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Category summary */}
                                <div className="bg-white p-5 sm:p-8 border-4 border-black shadow-[8px_8px_0_#000]">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/60 mb-4">Top categories</p>
                                    {sortedCategories.length > 0 ? (
                                        <div className="space-y-3">
                                            {sortedCategories.slice(0, 3).map(([cat, count]) => (
                                                <div key={cat} className="flex items-center justify-between">
                                                    <span className="font-manrope font-black text-sm text-black uppercase tracking-[0.1em]">{cat}</span>
                                                    <span className="border-2 border-black bg-[#FFE66D] px-3 py-0.5 text-xs font-black">
                                                        {count} item{count !== 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm font-manrope text-black/50">No categories yet.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </DashboardLayout>
    )
}
