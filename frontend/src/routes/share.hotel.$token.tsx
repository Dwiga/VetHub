import { createFileRoute } from '@tanstack/react-router'
import { useGetSharedHotelBooking } from '@/lib/api-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PawPrint, Building2 } from 'lucide-react'
import { useLang } from '@/contexts/LangContext'
import { StatusBadge } from '@/components/shared/StatusBadge'

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
            {b.deposit != null && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('depositLabel')}</span>
                <span className="font-medium">Rp {Number(b.deposit).toLocaleString('id-ID')}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm font-semibold pt-1 border-t">
              <span>{t('totalCostLabel')}</span>
              <span className="text-primary">Rp {Number(b.totalCost ?? 0).toLocaleString('id-ID')}</span>
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
                  <div key={l.id} className="flex items-start gap-3 py-2 border-b last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold">{l.logDate}</p>
                      {l.condition && <p className="text-xs text-muted-foreground">{t('condition')}: {l.condition}</p>}
                      {l.feeding && <p className="text-xs text-muted-foreground">{t('feeding')}: {l.feeding}</p>}
                      {l.notes && <p className="text-xs text-muted-foreground italic">{l.notes}</p>}
                      {l.cost > 0 && <p className="text-xs text-muted-foreground">Rp {Number(l.cost).toLocaleString('id-ID')}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-center text-muted-foreground pb-8">PetHub</p>
      </div>
    </div>
  )
}
