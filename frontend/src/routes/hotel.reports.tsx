import { createFileRoute, Link } from '@tanstack/react-router'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/shared/PageHeader'
import { useGetMe, useGetHotelReportSummary } from '@/lib/api-client'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Users, TrendingUp, Hotel, Calendar } from 'lucide-react'
import { useLang } from '@/contexts/LangContext'
import { StatusBadge } from '@/components/shared/StatusBadge'

export const Route = createFileRoute('/hotel/reports')({
  component: HotelReportsPage,
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
      return { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] }
    }
    case 'quarterly': {
      const q = Math.floor(m / 3)
      const start = new Date(y, q * 3, 1)
      const end = new Date(y, q * 3 + 3, 0)
      return { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] }
    }
    case 'yearly':
      return { startDate: `${y}-01-01`, endDate: `${y}-12-31` }
    default:
      return { startDate: date, endDate: date }
  }
}

function HotelReportsPage() {
  const me = useGetMe()
  const hotelId = me.data?.hotelId
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

  const summary = useGetHotelReportSummary(hotelId ?? undefined, { ...range, period, date: refDate })
  const s = summary.data
  const { t } = useLang()

  return (
    <AppShell>
      <PageHeader title={t('nav_reports')} back backHref="/hotel" />

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
                  <Users className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Total guests</p>
                  <p className="text-lg font-bold">{s.totalGuests}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4 text-center">
                  <Hotel className="h-5 w-5 text-orange-500 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Active stays</p>
                  <p className="text-lg font-bold">{s.activeStays}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4 text-center col-span-2">
                  <TrendingUp className="h-5 w-5 text-green-500 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Total revenue</p>
                  <p className="text-lg font-bold">{formatRp(s.totalRevenue)}</p>
                </CardContent>
              </Card>
            </div>

            {/* Top Services */}
            {s.topServices && s.topServices.length > 0 && (
              <Card>
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-sm">{t('topServices')}</CardTitle>
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

            {/* Guest list */}
            <Card>
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-sm">Guests</CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                {s.guests.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No guests in this period</p>
                ) : (
                  <div className="space-y-2">
                    {s.guests.map((g: any) => (
                      <Link key={g.bookingId} to="/hotel/$bookingId" params={{ bookingId: String(g.bookingId) }}>
                        <div className="flex items-center justify-between py-2 border-b last:border-0 hover:bg-muted/50 rounded px-2 -mx-2 transition-colors">
                          <div>
                            <p className="text-sm font-medium">{g.petName}</p>
                            <p className="text-xs text-muted-foreground">{g.ownerPhone} · {g.checkIn} - {g.checkOut ?? 'Active'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{formatRp(g.totalCost)}</p>
                            <StatusBadge status={g.status} />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  )
}
