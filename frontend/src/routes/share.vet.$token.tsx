import { createFileRoute } from '@tanstack/react-router'
import { useGetSharedVetVisit } from '@/lib/api-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Stethoscope } from 'lucide-react'
import { useLang } from '@/contexts/LangContext'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { SignupPrompt } from '@/components/shared/SignupPrompt'
import { cn } from '@/lib/utils'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { format } from 'date-fns'

export const Route = createFileRoute('/share/vet/$token')({
  component: SharedVetPage,
})

function SharedVetPage() {
  const { token } = Route.useParams()
  const { t } = useLang()
  const { data: v, isLoading, isError } = useGetSharedVetVisit(token)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 p-4">
        <div className="max-w-md mx-auto space-y-4 pt-8">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="h-64 bg-muted animate-pulse rounded-xl" />
        </div>
      </div>
    )
  }

  if (isError || !v) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <Stethoscope className="h-12 w-12 text-muted-foreground/40 mx-auto" />
          <p className="text-sm text-muted-foreground">{t('visitNotFound')}</p>
        </div>
      </div>
    )
  }

  const isActive = v.status === 'active'
  const reports: any[] = v.dailyReports ?? []
  const roomFeeItem: any = v.roomFeeLineItem

  // Merge all items chronologically
  const allItems: any[] = [
    ...reports.map((r: any) => ({
      date: r.reportDate,
      type: r.type,
      description: r.description,
      amount: r.amount,
    })),
  ]
  if (roomFeeItem) {
    allItems.push(roomFeeItem)
  }
  allItems.sort((a: any, b: any) => a.date.localeCompare(b.date) || 0)

  // Total expenses (absolute sum of credits + room fee)
  const totalExpenses = Math.abs(v.totalCredits ?? 0)
  // Total payments received
  const totalPayments = v.totalDeposits ?? 0
  const balance = v.balance ?? 0

  function formatRp(n: number) {
    return `Rp ${Math.abs(n).toLocaleString('id-ID')}`
  }

  return (
    <div className="min-h-screen bg-muted/30 p-4">
      <div className="max-w-md mx-auto pt-6">
        {/* Receipt Card */}
        <Card className="border-2 shadow-sm">
          <CardContent className="py-6 px-5 space-y-4">
            {/* Header — Clinic info */}
            <div className="text-center space-y-1">
              <Stethoscope className="h-8 w-8 text-primary mx-auto mb-1" />
              <h1 className="text-lg font-bold">{v.clinicName ?? 'Klinik'}</h1>
              {v.clinicAddress && (
                <p className="text-xs text-muted-foreground">{v.clinicAddress}</p>
              )}
              {v.clinicPhone && (
                <p className="text-xs text-muted-foreground">{v.clinicPhone}</p>
              )}
            </div>

            {/* Divider */}
            <hr className="border-dashed" />

            {/* Pet + Visit info */}
            <div className="space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-base">{v.petName ?? '—'}</span>
                <StatusBadge status={v.status} />
              </div>
              {v.petSpecies && (
                <p className="text-xs text-muted-foreground">{v.petSpecies}</p>
              )}
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                <span>{t('receiptOwner')}: {v.ownerName ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{v.visitDate}</span>
                <span>{v.type === 'inpatient' ? t('receiptInpatientFee') : t('receiptType')}</span>
              </div>
              {isActive && (
                <p className="text-xs text-center text-amber-600 font-medium pt-1">
                  {t('sharedVetVisitActive')}
                </p>
              )}
            </div>

            {/* Divider */}
            <hr className="border-dashed" />

            {/* Transaction list */}
            <div>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {t('receiptTransactions')}
              </h2>

              {allItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">{t('noReportsYet')}</p>
              ) : (
                <div className="space-y-3">
                  {allItems.map((item: any, i: number) => (
                    <div key={i} className="flex items-start justify-between text-sm">
                      <div className="flex-1 min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          {item.type === 'roomFee' ? (
                            <span className="text-xs text-muted-foreground font-medium">
                              {v.type === 'inpatient' ? t('receiptInpatientFee') || 'Inpatient fee' : t('receiptStayFee') || 'Stay fee'}
                            </span>
                          ) : item.type === 'deposit' ? (
                            <span className="text-xs font-medium text-green-700">
                              {t('receiptDeposit') || 'Payment'}
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-red-600">
                              {t('receiptCredit') || 'Expense'}
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground">{item.date}</span>
                        </div>
                        {item.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <p className={cn(
                        "text-sm font-medium shrink-0 whitespace-nowrap",
                        item.type === 'deposit' ? "text-green-600" : "text-red-500"
                      )}>
                        {item.type === 'deposit' ? '+' : '-'}{formatRp(item.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Divider */}
            <hr className="border-dashed" />

            {/* Totals */}
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t('receiptTotal')}</span>
                <span className="font-medium text-red-500">{formatRp(totalExpenses)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t('receiptPayment')}</span>
                <span className="font-medium text-green-600">{formatRp(totalPayments)}</span>
              </div>
              <hr className="border-dashed" />
              <div className="flex items-center justify-between font-semibold text-base pt-1">
                <span>{t('receiptBalance')}</span>
                <span className={cn(balance >= 0 ? 'text-green-600' : 'text-red-500')}>
                  {balance >= 0 ? '+' : '-'}{formatRp(balance)}
                </span>
              </div>
              <p className={cn(
                "text-[10px] text-center",
                balance >= 0 ? "text-green-600" : "text-red-500"
              )}>
                {balance >= 0 ? t('receiptBalancePositive') : t('receiptBalanceNegative')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Clinical notes */}
        {(v.anamnesis || v.therapy) && (
          <Card className="mt-4 border shadow-sm">
            <CardContent className="py-4 px-5 space-y-3">
              {v.anamnesis && (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">{t('anamnesis')}</p>
                  <p className="text-sm">{v.anamnesis}</p>
                </div>
              )}
              {v.therapy && (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">{t('therapy')}</p>
                  <p className="text-sm">{v.therapy}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Monitoring charts */}
        {(() => {
          const records = (v as any).monitoring ?? []
          if (records.length === 0) return null
          return (
            <>
              {(() => {
                const weightData = records.filter((r: any) => r.weight != null).reverse().map((r: any) => ({ date: format(new Date(r.recordedAt), 'MM/dd'), weight: r.weight }))
                if (weightData.length === 0) return null
                return (
                  <Card className="mt-4 border shadow-sm">
                    <CardHeader className="pb-2 pt-4"><CardTitle className="text-sm">Weight (kg)</CardTitle></CardHeader>
                    <CardContent className="pb-4">
                      <ResponsiveContainer width="100%" height={140}>
                        <LineChart data={weightData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} width={32} />
                          <Tooltip />
                          <Line type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )
              })()}

              {(() => {
                const tempData = records.filter((r: any) => r.temperature != null).reverse().map((r: any) => ({ date: format(new Date(r.recordedAt), 'MM/dd'), temperature: r.temperature }))
                if (tempData.length === 0) return null
                return (
                  <Card className="mt-4 border shadow-sm">
                    <CardHeader className="pb-2 pt-4"><CardTitle className="text-sm">Temperature (°C)</CardTitle></CardHeader>
                    <CardContent className="pb-4">
                      <ResponsiveContainer width="100%" height={140}>
                        <LineChart data={tempData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} width={32} />
                          <Tooltip />
                          <Line type="monotone" dataKey="temperature" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )
              })()}

              {(() => {
                const heightData = records.filter((r: any) => r.height != null).reverse().map((r: any) => ({ date: format(new Date(r.recordedAt), 'MM/dd'), height: r.height }))
                if (heightData.length === 0) return null
                return (
                  <Card className="mt-4 border shadow-sm">
                    <CardHeader className="pb-2 pt-4"><CardTitle className="text-sm">Height (cm)</CardTitle></CardHeader>
                    <CardContent className="pb-4">
                      <ResponsiveContainer width="100%" height={140}>
                        <LineChart data={heightData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} width={32} />
                          <Tooltip />
                          <Line type="monotone" dataKey="height" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )
              })()}
            </>
          )
        })()}

        {/* Signup Prompt */}
        <div className="mt-5">
          <SignupPrompt />
        </div>

        <p className="text-xs text-center text-muted-foreground pb-8 mt-4">PetHub</p>
      </div>
    </div>
  )
}
