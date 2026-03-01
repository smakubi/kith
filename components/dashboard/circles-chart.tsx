'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { CircleChartPoint } from '@/types'

interface CirclesChartProps {
  data: CircleChartPoint[]
}

export function CirclesChart({ data }: CirclesChartProps) {
  const gridColor     = '#f1f5f9'
  const tickColor     = '#94a3b8'
  const tooltipBg     = '#ffffff'
  const tooltipBorder = '#e2e8f0'
  const cursorColor   = '#f1f5f9'

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">People per Circle</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis dataKey="circle" tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false} interval={0} />
            <YAxis tick={{ fontSize: 12, fill: tickColor }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                borderRadius: '12px',
                border: `1px solid ${tooltipBorder}`,
                background: tooltipBg,
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
              cursor={{ fill: cursorColor }}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
