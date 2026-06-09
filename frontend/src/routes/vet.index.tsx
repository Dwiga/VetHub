import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Stethoscope, PawPrint, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { useGetMe, useListActiveVisits, useListVetVisits } from '@/lib/api-client'
import { useLang } from '@/contexts/LangContext'
import { useAuth } from '@/lib/auth'
import { useEffect } from 'react'

export const Route = createFileRoute('/vet/')({
  component: VetPage,
})

function monthLabel(ym: string): string {
  const [year, month] = ym.split('-')
  const d = new Date(parseInt(year), parseInt(month) - 1, 1)
  return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
}

function groupByMonth(visits: any[]): [string, any[]][] {
  const map = new Map<string, any[]>()
  for (const v of visits) {
    const ym = v.visitDate ? v.visitDate.substring(0, 7) : 'unknown'
    if (!map.has(ym)) map.set(ym, [])
    map.get(ym)!.push(v)
  }
  return [...map.entries()].sort((a, b) => (b[0] > a[0] ? 1 : -1))
}

function ActiveVisitsList({ clinicId }: { clinicId: number }) {
  const visits = useListActiveVisits()
  const list = (visits.data ?? []).filter((v: any) => v.status === 'active')
  const { t } = useLang()

  if (visits.isLoading) return (
    <div className="space-y-3">
      {[1, 2].map(i => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}
    </div>
  )

  if (list.length === 0) return (
    <Card>
      <CardContent className="py-10 flex flex-col items-center gap-4">
        <Stethoscope className="h-10 w-10 text-muted-foreground/30" />
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">{t('noActivePatientsShort')}</p>
          <p className="text-xs text-muted-foreground/70 max-w-xs leading-relaxed">{t('howToAddNewVisit')}</p>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-3">
      {list.map((v: any) => (
        <Link key={v.id} to="/vet/visits/$visitId" params={{ visitId: String(v.id) }}>
          <Card className="hover:border-primary/50 transition-colors cursor-pointer" data-testid={`card-visit-${v.id}`}>
            <CardContent className="py-4 flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                <PawPrint className="h-5 w-5 text-primary/60" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-sm text-foreground" data-testid={`text-pet-name-${v.id}`}>{v.petName || `Visit #${v.id}`}</p>
                  <StatusBadge status={v.type ?? 'outpatient'} />
                </div>
                <p className="text-xs text-muted-foreground">{v.visitDate}{v.ownerName ? ` · ${v.ownerName}` : v.ownerPhone ? ` · ${v.ownerPhone}` : ''}</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}

function VisitHistoryList({ clinicId }: { clinicId: number }) {
  const visits = useListVetVisits({ clinicId })
  const { t } = useLang()
  const [expanded, setExpanded] = useState(false)

  const all = (visits.data ?? []).filter((v: any) => v.status !== 'active')
  const groups = groupByMonth(all)

  if (visits.isLoading) return (
    <div className="space-y-2">
      {[1, 2].map(i => <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />)}
    </div>
  )

  return (
    <div>
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between py-2 text-sm font-semibold text-foreground"
        data-testid="btn-toggle-history"
      >
        <span>{t('vetVisitHistory')} {all.length > 0 && `(${all.length})`}</span>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="space-y-4 mt-2">
          {groups.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">{t('noVisitHistory')}</p>
          )}
          {groups.map(([ym, monthVisits]) => (
            <div key={ym}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                {monthLabel(ym)}
              </p>
              <div className="space-y-2">
                {monthVisits.map((v: any) => (
                  <Link key={v.id} to="/vet/visits/$visitId" params={{ visitId: String(v.id) }}>
                    <Card className="hover:border-primary/50 transition-colors cursor-pointer" data-testid={`card-history-${v.id}`}>
                      <CardContent className="py-3 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm text-foreground truncate">{v.petName || `Visit #${v.id}`}</p>
                            <StatusBadge status={v.type ?? 'outpatient'} />
                            <StatusBadge status={v.status ?? 'completed'} />
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {v.visitDate}
                            {v.ownerName ? ` · ${v.ownerName}` : v.ownerPhone ? ` · ${v.ownerPhone}` : ''}
                            {v.vetName ? ` · drh. ${v.vetName}` : ''}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-medium text-foreground">
                            {(v as any).totalCost > 0 ? `Rp ${(v as any).totalCost.toLocaleString('id-ID')}` : '—'}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function VetPage() {
  const me = useGetMe()
  const navigate = useNavigate()
  const [searchInput, setSearchInput] = useState('')
  const { t } = useLang()
  const { isLoaded, isSignedIn } = useAuth()

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate({ to: '/sign-in/$', params: { _splat: '' } })
    }
  }, [isLoaded, isSignedIn, navigate])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (searchInput.trim()) navigate({ to: '/vet/search', search: { q: searchInput.trim() } })
  }

  const user = me.data

  if (!user?.isVet && !user?.isVetOwner && !me.isLoading) {
    return (
      <AppShell>
        <div className="pt-12 flex flex-col items-center gap-4">
          <Stethoscope className="h-16 w-16 text-muted-foreground/30" />
          <p className="text-muted-foreground text-center">{t('notRegisteredVet')}</p>
          <Button asChild variant="outline" size="sm" data-testid="btn-go-settings">
            <Link to="/settings">{t('goToSettings')}</Link>
          </Button>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <PageHeader title={t('nav_clinic')} subtitle={t('activePatients')} />
      <div className="space-y-5">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder={t('searchPlaceholder')}
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            data-testid="input-search"
          />
          <Button type="submit" size="icon" variant="outline" data-testid="btn-search">
            <Search className="h-4 w-4" />
          </Button>
        </form>

        {user?.clinicId && <ActiveVisitsList clinicId={user.clinicId} />}

        {user?.clinicId && (
          <div className="border-t border-border pt-3">
            <VisitHistoryList clinicId={user.clinicId} />
          </div>
        )}
      </div>
    </AppShell>
  )
}
