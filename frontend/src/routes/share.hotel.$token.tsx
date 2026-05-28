import { createFileRoute } from '@tanstack/react-router'
import { useGetSharedHotelBooking } from '@/lib/api-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PawPrint, Building2, ArrowDownLeft, ArrowUpRight } from 'lucide-react'
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
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto space-y-4 pt-8">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="h-32 bg-muted animate-pulse rounded-xl" />
        </div>
      </div>
    )
  }

  if (isError || !b) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <Building2 className="h-12 w-12 text-muted-foreground/40 mx-auto" />
          <p className="text-sm text-muted-foreground">{t('visitNotFound')}</p>
        </div>
      </div>
    )
  }

  const isActive = b.status === 'active'
  const logs: any[] = b.dailyLogs ?? []

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-5 pt-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <PawPrint className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold">{b.petName ?? '—'}</h1>
          </div>
          {b.petSpecies && <p className="text-sm text-muted-foreground ml-7">{b.petSpecies}</p>}
          <div className="ml-7 mt-1">
            <StatusBadge status={b.status} />
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          {isActive ? t('sharedStayActive') : t('sharedStayCompleted')}
        </p>

        <Card>
          <CardContent className="py-4 space-y-2">
            {b.ownerName && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Owner</span>
                <span className="font-medium">{b.ownerName}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t('checkInLabel')}</span>
              <span className="font-medium">{b.checkIn}</span>
            </div>
            {b.checkOut && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('checkOutLabel')}</span>
                <span className="font-medium">{b.checkOut}</span>
              </div>
            )}
            {b.roomType && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('roomTypeLabel')}</span>
                <span className="font-medium">{b.roomType}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t('daysLabel')}</span>
              <span className="font-medium">{b.daysIn}</span>
            </div>
            {b.dailyFee != null && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('dailyFee')}</span>
                <span className="font-medium">Rp {Number(b.dailyFee).toLocaleString('id-ID')}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm font-semibold pt-1 border-t">
              <span>{t('totalCostLabel')}</span>
              <span className="text-primary">Rp {Number(b.totalCost ?? 0).toLocaleString('id-ID')}</span>
            </div>
          </CardContent>
        </Card>

        {/* Financial Summary */}
        <Card>
          <CardContent className="py-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t('totalDeposits') || 'Total deposits'}</span>
              <span className="font-medium text-green-600">Rp {Number(b.totalDeposits ?? 0).toLocaleString('id-ID')}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t('totalCredits') || 'Total credits'}</span>
              <span className="font-medium text-red-500">Rp {Number(b.totalCredits ?? 0).toLocaleString('id-ID')}</span>
            </div>
            <div className="flex items-center justify-between text-sm font-semibold pt-1 border-t">
              <span>{t('balance') || 'Balance'}</span>
              <span className={cn((b.balance ?? 0) >= 0 ? 'text-green-600' : 'text-red-500')}>
                Rp {Number(b.balance ?? 0).toLocaleString('id-ID')}
              </span>
            </div>
          </CardContent>
        </Card>

        {b.notes && (
          <Card>
            <CardContent className="py-4">
              <p className="text-xs text-muted-foreground">{t('notes')}</p>
              <p className="text-sm mt-1">{b.notes}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-sm">{t('dailyLog')}</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{t('noLogsYet')}</p>
            ) : (
              <div className="space-y-2">
                {logs.map((l: any) => (
                  <div key={l.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                    <div className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                      l.type === 'deposit' ? "bg-green-100" : "bg-red-100"
                    )}>
                      {l.type === 'deposit' ? (
                        <ArrowDownLeft className="h-4 w-4 text-green-600" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold">{l.logDate}</p>
                        <span className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded-full font-medium uppercase",
                          l.type === 'deposit' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        )}>
                          {l.type === 'deposit' ? (t('depositType') || 'Deposit') : (t('creditType') || 'Credit')}
                        </span>
                      </div>
                      {l.description && <p className="text-xs text-muted-foreground">{l.description}</p>}
                    </div>
                    <p className={cn(
                      "text-sm font-medium shrink-0",
                      l.type === 'deposit' ? "text-green-600" : "text-red-500"
                    )}>
                      {l.type === 'deposit' ? '+' : '-'}Rp {Number(l.amount).toLocaleString('id-ID')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Signup Prompt */}
        <SignupPrompt />

        <p className="text-xs text-center text-muted-foreground pb-8">PetHub</p>
      </div>
    </div>
  )
}
