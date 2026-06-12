import { createFileRoute } from '@tanstack/react-router'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/shared/PageHeader'
import { useGetMe, useGetProductReport, useListProductSales } from '@/lib/api-client'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { TrendingUp, Package, ShoppingCart } from 'lucide-react'
import { useLang } from '@/contexts/LangContext'

export const Route = createFileRoute('/product-reports')({
  component: ProductReportsPage,
})

type Period = 'daily' | 'weekly' | 'monthly' | 'custom'

const PERIODS: { key: Period; label: string }[] = [
  { key: 'daily', label: 'Today' },
  { key: 'weekly', label: 'Week' },
  { key: 'monthly', label: 'Month' },
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
      return {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      }
    }
    default:
      return { startDate: date, endDate: date }
  }
}

function ProductReportsPage() {
  const me = useGetMe()
  const { t } = useLang()
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

  const report = useGetProductReport(clinicId ?? undefined, { ...range, period, date: refDate })
  const sales = useListProductSales(clinicId ?? undefined, { startDate: range.startDate, endDate: range.endDate })

  const r = report.data

  return (
    <AppShell>
      <PageHeader title={t('productReport')} back backHref={me.data?.isHotelOwner ? '/hotel' : '/vet'} />

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

        {r && (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="py-4 text-center">
                  <TrendingUp className="h-5 w-5 text-green-500 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">{t('totalRevenue')}</p>
                  <p className="text-lg font-bold">{formatRp(r.totalRevenue)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4 text-center">
                  <ShoppingCart className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">{t('totalSales')}</p>
                  <p className="text-lg font-bold">{r.totalSales}</p>
                </CardContent>
              </Card>
            </div>

            {/* Top products */}
            {r.topProducts && r.topProducts.length > 0 && (
              <Card>
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-sm">{t('topProducts')}</CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="space-y-2">
                    {r.topProducts.map((p: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                        <span className="font-medium">{i + 1}. {p.name}</span>
                        <span className="text-muted-foreground text-xs">{p.quantity}x · {formatRp(p.revenue)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Sales trend chart */}
            {r.labels.length > 0 && (
              <Card>
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-sm">Sales trend</CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={r.labels.map((l: string, i: number) => ({ label: l.replace(/^\d{4}-/, ''), sales: r.salesCounts[i] }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} width={32} />
                      <Tooltip />
                      <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Revenue chart */}
            {r.labels.length > 0 && r.revenues.some((rv: number) => rv > 0) && (
              <Card>
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-sm">Revenue trend</CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={r.labels.map((l: string, i: number) => ({ label: l.replace(/^\d{4}-/, ''), revenue: r.revenues[i] }))}>
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

            {/* Stock summary */}
            {r.stockSummary && r.stockSummary.length > 0 && (
              <Card>
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-sm">{t('stockReport')}</CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="space-y-2">
                    {r.stockSummary.map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="truncate">{p.name}</span>
                          {p.barcode && <span className="text-xs text-muted-foreground">#{p.barcode}</span>}
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-medium">{p.stock} {p.unit}</span>
                          <p className="text-xs text-muted-foreground">Rp {parseFloat(p.price ?? '0').toLocaleString('id-ID')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent sales */}
            {sales.data && sales.data.length > 0 && (
              <Card>
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-sm">{t('saleHistory')}</CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="space-y-2">
                    {sales.data.slice(0, 20).map((s: any) => (
                      <div key={s.id} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                        <div>
                          <p className="font-medium">{s.buyerName || 'Walk-in'}</p>
                          <p className="text-xs text-muted-foreground">
                            {s.saleDate} · {s.items?.length || 0} items
                          </p>
                        </div>
                        <span className="font-medium">Rp {parseFloat(s.total ?? '0').toLocaleString('id-ID')}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </AppShell>
  )
}
