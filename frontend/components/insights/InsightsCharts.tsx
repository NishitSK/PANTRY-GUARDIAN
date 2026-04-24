'use client'

import { useMemo, useState } from 'react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Sector
} from 'recharts'
import Card from '@/components/ui/Card'
import { TrendingUp, Package, Archive, Snowflake } from 'lucide-react'

interface InsightsChartsProps {
  categoryData: [string, number][]
  storageData: {
    pantry: number
    fridge: number
    freezer: number
  }
  totalItems: number
}

const COLORS = ['#1a2e1f', '#2f4b32', '#4a6b50', '#6b8f72', '#8fb396']
const STORAGE_COLORS = {
  pantry: '#4f46e5', // Indigo
  fridge: '#2563eb', // Blue
  freezer: '#0ea5e9' // Sky
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border-2 border-black shadow-[4px_4px_0_#000]">
        <p className="font-serif font-bold text-base mb-1 text-black">{label}</p>
        <p className="text-xs font-black text-black uppercase tracking-[0.12em]">
          {payload[0].value} items
        </p>
      </div>
    )
  }
  return null
}

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props

  return (
    <g>
      <text x={cx} y={cy} dy={-10} textAnchor="middle" fill={fill} className="text-2xl font-serif font-bold">
        {value}
      </text>
      <text x={cx} y={cy} dy={15} textAnchor="middle" fill="#9ca3af" className="text-xs font-medium uppercase tracking-wider">
        {payload.name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        cornerRadius={6}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={innerRadius - 6}
        outerRadius={innerRadius - 2}
        fill={fill}
        fillOpacity={0.2}
        cornerRadius={4}
      />
    </g>
  )
}

export default function InsightsCharts({ categoryData, storageData, totalItems }: InsightsChartsProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  const barData = useMemo(() => {
    return categoryData.map(([name, value]) => ({ name, value }))
  }, [categoryData])

  const pieData = useMemo(() => {
    return [
      { name: 'Pantry', value: storageData.pantry, color: STORAGE_COLORS.pantry },
      { name: 'Fridge', value: storageData.fridge, color: STORAGE_COLORS.fridge },
      { name: 'Freezer', value: storageData.freezer, color: STORAGE_COLORS.freezer },
    ].filter(d => d.value > 0)
  }, [storageData])

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index)
  }

  return (
    <div className="grid min-w-0 gap-6 md:grid-cols-2 flex-1 min-h-0 pb-6 items-stretch">
      {/* Top Categories Bar Chart */}
      <Card className="overflow-hidden !shadow-[6px_6px_0_#000] !border-4 !border-black flex min-w-0 flex-col !rounded-none min-h-[360px] sm:min-h-[460px] !bg-white">
        <div className="p-4 border-b-2 border-black shrink-0 bg-[#F6F1E7]">
          <h3 className="font-serif text-lg font-bold text-black flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-black" /> Top Categories
          </h3>
        </div>
        <div className="p-2 sm:p-4 flex-1 min-h-0">
          {barData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-black/70">
              <p className="text-sm font-black uppercase tracking-[0.1em]">No data available</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 16, right: 6, left: -18, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.5} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6b7280', fontSize: 12 }} 
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={40}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      {/* Storage Distribution Pie Chart */}
      <Card className="overflow-hidden !shadow-[6px_6px_0_#000] !border-4 !border-black flex min-w-0 flex-col !rounded-none min-h-[360px] sm:min-h-[460px] !bg-white">
        <div className="p-4 border-b-2 border-black shrink-0 bg-[#F6F1E7]">
          <h3 className="font-serif text-lg font-bold text-black flex items-center gap-2">
            <Package className="w-4 h-4 text-black" /> Storage Distribution
          </h3>
        </div>
        <div className="px-4 py-5 flex-1 min-h-0 flex flex-col items-center justify-start gap-4">
          <div className="h-[190px] w-full max-w-[220px] relative shrink-0">
               <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    activeIndex={activeIndex}
                    activeShape={renderActiveShape}
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={46}
                    outerRadius={64}
                    dataKey="value"
                    onMouseEnter={onPieEnter}
                    paddingAngle={4}
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend / Key */}
            <div className="grid w-full max-w-[320px] grid-cols-1 gap-2">
              <div className="flex items-center gap-3 p-2.5 border-2 border-black bg-white min-w-0">
                  <div className="p-2 bg-[#DDE6FF] border border-black">
                    <Archive className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                <div className="min-w-0">
                    <p className="text-[10px] font-black text-black/70 uppercase tracking-wider">Pantry</p>
                    <p className="text-lg font-serif font-bold text-black">{storageData.pantry}</p>
                  </div>
               </div>
              <div className="flex items-center gap-3 p-2.5 border-2 border-black bg-white min-w-0">
                  <div className="p-2 bg-[#D6EBFF] border border-black">
                    <Snowflake className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                <div className="min-w-0">
                    <p className="text-[10px] font-black text-black/70 uppercase tracking-wider">Fridge</p>
                    <p className="text-lg font-serif font-bold text-black">{storageData.fridge}</p>
                  </div>
               </div>
              <div className="flex items-center gap-3 p-2.5 border-2 border-black bg-white min-w-0">
                  <div className="p-2 bg-[#D9F3FF] border border-black">
                    <Snowflake className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  </div>
                <div className="min-w-0">
                    <p className="text-[10px] font-black text-black/70 uppercase tracking-wider">Freezer</p>
                    <p className="text-lg font-serif font-bold text-black">{storageData.freezer}</p>
                  </div>
               </div>
            </div>
        </div>
      </Card>
    </div>
  )
}
