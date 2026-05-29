import { createFileRoute } from '@tanstack/react-router'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/shared/PageHeader'
import { useGetMe, useGetReportSummary, useGetVisitStats } from '@/lib/api-client'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { TrendingUp, Users, Activity, Heart, Skull, LogOut, Calendar } from 'lucide-react'

export const Route = createFileRoute('/vet/reports')({
  component: VetReportsPage,
})

type Period = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom'

const PERIODS: { key: Period; label: string }[] = [
  { key: 'daily', label: 'Today' },
  { key: 'weekly', label: 'Week' },
  { key: 'monthly', label: 'Month' },
  { key: 'quarterly', label: 'Quarter' },
  { key: 'yearly', label: 'Year' },
  { key: 'custom', label: 'Custom' },
]

function formatRp(n: number) {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}K`
  return `Rp ${n.toLocaleString('id-ID')}`
}

function formatXLabel(label: string, period: Period) {
  if (period === 'daily' || period === 'weekly') return label.replace(/^\d{4}-/, '')
  return label
}

function computeDateRange(period: Period, date: string): { startDate: string; endDate: string } {
  const d = new Date(date)
  const y = d.getFullYear()
  const m = d.getMonth()

  switch (period) {
    case 'daily':
      return { startDate: date, endDate: date }
    case 'weekly': {
      const day = d.getDay()
      const diff = d.getDate() - day + (day === 0 ? -6 : 1)
      const mon = new Date(d.setDate(diff))
      const sun = new Date(mon)
      sun.setDate(mon.getDate() + 6)
      return {
        startDate: mon.toISOString().split('T')[0],
        endDate: sun.toISOString().split('T')[0],
      }
    }
    case 'monthly': {
      const start = new Date(y, m, 1)
      const end = new Date(y, m + 1, 0)
      return {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      }
    }
    case 'quarterly': {
      const q = Math.floor(m / 3)
      const start = new Date(y, q * 3, 1)
      const end = new Date(y, q * 3 + 3, 0)
      return {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      }
    }
    case 'yearly':
      return {
        startDate: `${y}-01-01`,
        endDate: `${y}-12-31`,
      }
    default:
      return { startDate: date, endDate: date }
  }
}

function VetReportsPage() {
  const me = useGetMe()
  const clinicId = me.data?.clinicId
  const [period, setPeriod] = useState<Period>('monthly')
  const [refDate, setRefDate] = useState(() => new Date().toISOString().split('T')[0])
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d.toISOString().split('T')[0]
  })
  const [customEnd, setCustomEnd] = useState(() => new Date().toISOString().split('T')[0])

  const range =
    period === 'custom'
      ? { startDate: customStart, endDate: customEnd }
      : computeDateRange(period, refDate)

  const summary = useGetReportSummary(clinicId ?? undefined, { ...range, period, date: refDate })
  const stats = useGetVisitStats(clinicId ?? undefined, { ...range, period, date: refDate })

  const s = summary.data
  const st = stats.data

  return (
    <AppShell>
      <PageHeader title="Reports" back backHref="/vet" />

      <div className="space-y-4">
        {/* Period selector */}
        <Card>
          <CardContent className="py-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              {PERIODS.map((p) => (
                <Button
                  key={p.key}
                  size="sm"
                  variant={period === p.key ? 'default' : 'outline'}
                  onClick={() => setPeriod(p.key)}
                >
                  {p.label}
                </Button>
              ))}
            </div>

            {period === 'custom' && (
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Label className="text-xs">From</Label>
                  <Input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} />
                </div>
                <div className="flex-1">
                  <Label className="text-xs">To</Label>
                  <Input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {s && (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="py-4 text-center">
                  <TrendingUp className="h-5 w-5 text-green-500 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Revenue</p>
                  <p className="text-lg font-bold">{formatRp(s.totalRevenue)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4 text-center">
                  <Users className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Visits</p>
                  <p className="text-lg font-bold">{s.totalVisits}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4 text-center">
                  <Activity className="h-5 w-5 text-orange-500 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Inpatient</p>
                  <p className="text-lg font-bold">{s.inpatientVisits}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4 text-center">
                  <Activity className="h-5 w-5 text-purple-500 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Outpatient</p>
                  <p className="text-lg font-bold">{s.outpatientVisits}</p>
                </CardContent>
              </Card>
            </div>

            {/* Patient outcomes */}
            <Card>
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-sm">Patient outcomes</CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <Heart className="h-5 w-5 text-green-500 mx-auto mb-1" />
                    <p className="text-lg font-bold">{s.survivedCount}</p>
                    <p className="text-xs text-muted-foreground">Survived</p>
                  </div>
                  <div>
                    <Skull className="h-5 w-5 text-red-400 mx-auto mb-1" />
                    <p className="text-lg font-bold">{s.diedCount}</p>
                    <p className="text-xs text-muted-foreground">Passed away</p>
                  </div>
                  <div>
                    <LogOut className="h-5 w-5 text-orange-400 mx-auto mb-1" />
                    <p className="text-lg font-bold">{s.earlyDischargeCount}</p>
                    <p className="text-xs text-muted-foreground">Early exit</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Services */}
            {s.topServices && s.topServices.length > 0 && (
              <Card>
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-sm">Top services</CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="space-y-2">
                    {s.topServices.map((svc: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                        <span className="font-medium">{i + 1}. {svc.name}</span>
                        <span className="text-muted-foreground text-xs">{svc.count}x · {formatRp(svc.revenue)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Visit trend chart */}
            {st && st.labels.length > 0 && (
              <Card>
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-sm">Visit trend</CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={st.labels.map((l: string, i: number) => ({ label: formatXLabel(l, period), visits: st.visitCounts[i] }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} width={32} />
                      <Tooltip />
                      <Bar dataKey="visits" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Revenue chart */}
            {st && st.labels.length > 0 && st.revenues.some((r: number) => r > 0) && (
              <Card>
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-sm">Revenue trend</CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={st.labels.map((l: string, i: number) => ({ label: formatXLabel(l, period), revenue: st.revenues[i] }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} width={32} />
                      <Tooltip />
                      <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </AppShell>
  )
}
