import { createFileRoute, Link } from '@tanstack/react-router'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Edit } from 'lucide-react'
import { useGetPet } from '@/lib/api-client'
import { useLang } from '@/contexts/LangContext'

export const Route = createFileRoute('/pets/$petId')({
  component: PetDetailPage,
})

function PetDetailPage() {
  const { petId } = Route.useParams()
  const id = Number(petId)
  const pet = useGetPet(id)
  const { t } = useLang()
  const p = pet.data

  if (pet.isLoading) {
    return (
      <AppShell>
        <div className="space-y-4 pt-4">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="h-32 bg-muted animate-pulse rounded-xl" />
        </div>
      </AppShell>
    )
  }

  if (!p) {
    return (
      <AppShell>
        <p className="text-center text-muted-foreground pt-8" data-testid="pet-not-found">
          {t('petNotFound')}
        </p>
      </AppShell>
    )
  }

  const age = p.dateOfBirth
    ? `${Math.floor(
        (Date.now() - new Date(p.dateOfBirth).getTime()) /
          (365.25 * 24 * 60 * 60 * 1000),
      )} ${t('ageUnit')}`
    : null

  const infoRows = [
    [t('gender'), p.gender],
    [t('dateOfBirth'), age],
    [t('colorMarkings'), p.color],
  ].filter(([, v]) => v) as [string, string][]

  return (
    <AppShell>
      <PageHeader
        title={p.name}
        subtitle={p.species?.name ?? undefined}
        back
        backHref="/pets"
        action={
          <Button asChild size="sm" variant="ghost" data-testid="btn-edit-pet">
            <Link to="/pets/$petId" params={{ petId }}>
              <Edit className="h-4 w-4" />
            </Link>
          </Button>
        }
      />

      <div className="space-y-5">
        <Card>
          <CardContent className="py-4">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center shrink-0 overflow-hidden">
                {p.photoUrl ? (
                  <img src={p.photoUrl} alt={p.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-3xl" aria-hidden>
                    🐾
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <StatusBadge status={p.status ?? 'healthy'} />
                  {p.sterilized && (
                    <span className="text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5">
                      {t('sterilized')}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-y-1 text-sm">
                  {infoRows.map(([label, value]) => (
                    <div key={label}>
                      <span className="text-muted-foreground text-xs">{label}</span>
                      <p className="font-medium text-xs truncate">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-6 text-center text-muted-foreground text-sm">
            {/* First-iteration stub — vaccinations, monitoring & health events come next */}
            {t('healthMonitoring')} — coming soon
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
