import { createFileRoute } from '@tanstack/react-router'
import { useGetSharedHotelBooking } from '@/lib/api-client'
import { Card, CardContent } from '@/components/ui/card'
import { Building2 } from 'lucide-react'
import { useLang } from '@/contexts/LangContext'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { SignupPrompt } from '@/components/shared/SignupPrompt'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/share/hotel/$token')({
  component: SharedHotelPage,
})

function SharedHotelPage() {
  const { token } = Route.useParams()
  const { t } = useLang()
  const { data: b, isLoading, isError } = useGetSharedHotelBooking(token)

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

  if (isError || !b) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <Building2 className="h-12 w-12 text-muted-foreground/40 mx-auto" />
          <p className="text-sm text-muted-foreground">{t('visitNotFound')}</p>
        </div>
      </div>
    )
  }

  const isActive = b.status === 'active'
  const logs: any[] = b.dailyLogs ?? []
  const roomFeeItem: any = b.roomFeeLineItem

  // Merge all items chronologically
  const allItems: any[] = [
    ...logs.map((l: any) => ({
      date: l.logDate,
      type: l.type,
      description: l.description,
      amount: l.amount,
    })),
  ]
  if (roomFeeItem) {
    allItems.push(roomFeeItem)
  }
  allItems.sort((a: any, b: any) => a.date.localeCompare(b.date) || 0)

  const totalExpenses = Math.abs(b.totalCredits ?? 0)
  const totalPayments = b.totalDeposits ?? 0
  const balance = b.balance ?? 0

  function formatRp(n: number) {
    return `Rp ${Math.abs(n).toLocaleString('id-ID')}`
  }

  return (
    <div className="min-h-screen bg-muted/30 p-4">
      <div className="max-w-md mx-auto pt-6">
        {/* Receipt Card */}
        <Card className="border-2 shadow-sm">
          <CardContent className="py-6 px-5 space-y-4">
            {/* Header — Hotel info */}
            <div className="text-center space-y-1">
              <Building2 className="h-8 w-8 text-primary mx-auto mb-1" />
              <h1 className="text-lg font-bold">{b.clinicName ?? 'Hotel'}</h1>
              {b.clinicAddress && (
                <p className="text-xs text-muted-foreground">{b.clinicAddress}</p>
              )}
              {b.clinicPhone && (
                <p className="text-xs text-muted-foreground">{b.clinicPhone}</p>
              )}
            </div>

            {/* Divider */}
            <hr className="border-dashed" />

            {/* Pet + Booking info */}
            <div className="space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-base">{b.petName ?? '—'}</span>
                <StatusBadge status={b.status} />
              </div>
              {b.petSpecies && (
                <p className="text-xs text-muted-foreground">{b.petSpecies}</p>
              )}
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                <span>{t('receiptOwner')}: {b.ownerName ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{t('checkInLabel')}: {b.checkIn}</span>
                {b.checkOut && <span>{t('checkOutLabel')}: {b.checkOut}</span>}
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{b.roomType ?? ''}</span>
                <span>{b.daysIn} {b.daysIn === 1 ? t('receiptDay') : t('receiptDays')}</span>
              </div>
              {isActive && (
                <p className="text-xs text-center text-amber-600 font-medium pt-1">
                  {t('sharedStayActive')}
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
                <p className="text-sm text-muted-foreground text-center py-4">{t('noLogsYet')}</p>
              ) : (
                <div className="space-y-3">
                  {allItems.map((item: any, i: number) => (
                    <div key={i} className="flex items-start justify-between text-sm">
                      <div className="flex-1 min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          {item.type === 'roomFee' ? (
                            <span className="text-xs text-muted-foreground font-medium">
                              {t('receiptStayFee') || 'Stay fee'}
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

        {/* Hotel notes */}
        {b.notes && (
          <Card className="mt-4 border shadow-sm">
            <CardContent className="py-4 px-5">
              <p className="text-xs text-muted-foreground mb-0.5">{t('notes')}</p>
              <p className="text-sm">{b.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Signup Prompt */}
        <div className="mt-5">
          <SignupPrompt />
        </div>

        <p className="text-xs text-center text-muted-foreground pb-8 mt-4">PetHub</p>
      </div>
    </div>
  )
}
