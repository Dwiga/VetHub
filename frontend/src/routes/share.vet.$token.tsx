import { createFileRoute } from '@tanstack/react-router'
import { useGetSharedVetVisit } from '@/lib/api-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Stethoscope, ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { useLang } from '@/contexts/LangContext'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { SignupPrompt } from '@/components/shared/SignupPrompt'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/share/vet/$token')({
  component: SharedVetPage,
})

function SharedVetPage() {
  const { token } = Route.useParams()
  const { t } = useLang()
  const { data: v, isLoading, isError } = useGetSharedVetVisit(token)

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

  if (isError || !v) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <Stethoscope className="h-12 w-12 text-muted-foreground/40 mx-auto" />
          <p className="text-sm text-muted-foreground">{t('visitNotFound')}</p>
        </div>
      </div>
    )
  }

  const isActive = v.status === 'active'
  const reports: any[] = v.dailyReports ?? []

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-5 pt-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold">{v.petName ?? '—'}</h1>
          </div>
          {v.petSpecies && <p className="text-sm text-muted-foreground ml-7">{v.petSpecies}</p>}
          <div className="ml-7 mt-1">
            <StatusBadge status={v.status} />
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          {isActive ? t('sharedVetVisitActive') || 'Your pet is being treated' : t('sharedVetVisitCompleted') || 'Treatment completed'}
        </p>

        {/* Visit Info */}
        <Card>
          <CardContent className="py-4 space-y-2">
            {v.ownerName && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Owner</span>
                <span className="font-medium">{v.ownerName}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t('visitDate')}</span>
              <span className="font-medium">{v.visitDate}</span>
            </div>
            {v.dischargeDate && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('dischargeDate')}</span>
                <span className="font-medium">{v.dischargeDate}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t('type') || 'Type'}</span>
              <span className="font-medium">{v.type === 'inpatient' ? 'Inpatient' : 'Outpatient'}</span>
            </div>
            {v.dailyFee != null && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('dailyFee')}</span>
                <span className="font-medium">Rp {Number(v.dailyFee).toLocaleString('id-ID')}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm font-semibold pt-1 border-t">
              <span>{t('totalCostLabel')}</span>
              <span className="text-primary">Rp {Number(v.totalCredits ?? 0).toLocaleString('id-ID')}</span>
            </div>
          </CardContent>
        </Card>

        {/* Financial Summary */}
        <Card>
          <CardContent className="py-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t('totalDeposits') || 'Total deposits'}</span>
              <span className="font-medium text-green-600">Rp {Number(v.totalDeposits ?? 0).toLocaleString('id-ID')}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t('totalCredits') || 'Total credits'}</span>
              <span className="font-medium text-red-500">Rp {Number(v.totalCredits ?? 0).toLocaleString('id-ID')}</span>
            </div>
            {v.type === 'inpatient' && v.roomFeeTotal > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground text-xs">{'Room fee'}</span>
                <span className="font-medium text-xs text-red-400">Rp {Number(v.roomFeeTotal).toLocaleString('id-ID')}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm font-semibold pt-1 border-t">
              <span>{t('balance') || 'Balance'}</span>
              <span className={cn((v.balance ?? 0) >= 0 ? 'text-green-600' : 'text-red-500')}>
                Rp {Number(v.balance ?? 0).toLocaleString('id-ID')}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Clinical notes */}
        {(v.anamnesis || v.therapy) && (
          <Card>
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm">{t('clinicalNotes')}</CardTitle>
            </CardHeader>
            <CardContent className="pb-4 space-y-3">
              {v.anamnesis && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t('anamnesis')}</p>
                  <p className="text-sm">{v.anamnesis}</p>
                </div>
              )}
              {v.therapy && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t('therapy')}</p>
                  <p className="text-sm">{v.therapy}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Daily Reports */}
        <Card>
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-sm">{t('dailyReports')}</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            {reports.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{t('noReportsYet')}</p>
            ) : (
              <div className="space-y-2">
                {reports.map((r: any) => (
                  <div key={r.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                    <div className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                      r.type === 'deposit' ? "bg-green-100" : "bg-red-100"
                    )}>
                      {r.type === 'deposit' ? (
                        <ArrowDownLeft className="h-4 w-4 text-green-600" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold">{r.reportDate}</p>
                        <span className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded-full font-medium uppercase",
                          r.type === 'deposit' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        )}>
                          {r.type === 'deposit' ? (t('depositType') || 'Deposit') : (t('creditType') || 'Credit')}
                        </span>
                      </div>
                      {r.description && <p className="text-xs text-muted-foreground">{r.description}</p>}
                    </div>
                    <p className={cn(
                      "text-sm font-medium shrink-0",
                      r.type === 'deposit' ? "text-green-600" : "text-red-500"
                    )}>
                      {r.type === 'deposit' ? '+' : '-'}Rp {Number(r.amount).toLocaleString('id-ID')}
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
