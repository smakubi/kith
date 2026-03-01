'use client'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { InteractionChartPoint } from '@/types'

interface InteractionsChartProps {
  data: InteractionChartPoint[]
}

export function InteractionsChart({ data }: InteractionsChartProps) {
  const gridColor     = '#f1f5f9'
  const tickColor     = '#94a3b8'
  const tooltipBg     = '#ffffff'
  const tooltipBorder = '#e2e8f0'
  const labelColor    = '#1e293b'

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Interactions — Last 6 Months</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="interactionGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#f43f5e" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: tickColor }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: tickColor }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                borderRadius: '12px',
                border: `1px solid ${tooltipBorder}`,
                background: tooltipBg,
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
              labelStyle={{ fontWeight: 600, color: labelColor }}
            />
            <Area
              type="monotone"
              dataKey="interactions"
              stroke="#f43f5e"
              strokeWidth={2}
              fill="url(#interactionGrad)"
              dot={{ r: 3, fill: '#f43f5e', strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#f43f5e', strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
