import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PawPrint, Plus, Stethoscope, Search } from 'lucide-react'
import { useGetMe, useListMyPets, useListActiveVisits, useRegisterAsPetOwner } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'
import { useRole } from '@/contexts/RoleContext'
import { useLang } from '@/contexts/LangContext'
import { useAuth, useUser } from '@/lib/auth'
import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})

function RoleSelector() {
  const registerAsPetOwner = useRegisterAsPetOwner()
  const { toast } = useToast()
  const { t } = useLang()

  async function becomePetOwner() {
    await registerAsPetOwner.mutateAsync()
    toast({ title: t('registeredPetOwner') })
  }

  return (
    <div className="space-y-4 pt-6">
      <p className="text-muted-foreground text-sm text-center">{t('chooseRole')}</p>
      <Card
        className="cursor-pointer hover:border-primary transition-colors"
        onClick={becomePetOwner}
        data-testid="card-pet-owner"
      >
        <CardContent className="pt-5 pb-5 flex gap-4 items-center">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <PawPrint className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground">{t('petOwner')}</p>
            <p className="text-xs text-muted-foreground">{t('petOwnerDesc')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function PetOwnerDashboard() {
  const pets = useListMyPets()
  const petList = pets.data ?? []
  const { t } = useLang()

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-foreground">{t('myPets')}</h2>
        <Button asChild size="sm" variant="outline" data-testid="btn-add-pet">
          <Link to="/pets">
            <Plus className="h-4 w-4 mr-1" />
            {t('addPet')}
          </Link>
        </Button>
      </div>
      {pets.isLoading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      )}
      {!pets.isLoading && petList.length === 0 && (
        <Card>
          <CardContent className="py-10 flex flex-col items-center gap-3">
            <PawPrint className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm text-center">{t('noPets')}</p>
            <Button asChild size="sm" data-testid="btn-add-first-pet">
              <Link to="/pets">{t('addPet')}</Link>
            </Button>
          </CardContent>
        </Card>
      )}
      {petList.map((pet) => (
        <Link key={pet.id} to="/pets/$petId" params={{ petId: String(pet.id) }}>
          <Card className="hover:border-primary/50 transition-colors cursor-pointer" data-testid={`card-pet-${pet.id}`}>
            <CardContent className="py-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center shrink-0 overflow-hidden">
                {pet.photoUrl ? (
                  <img src={pet.photoUrl} alt={pet.name} className="h-full w-full object-cover" />
                ) : (
                  <PawPrint className="h-6 w-6 text-primary/60" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground" data-testid={`text-pet-name-${pet.id}`}>{pet.name}</p>
                <p className="text-xs text-muted-foreground">{pet.species?.name ?? ''}</p>
              </div>
              <StatusBadge status={pet.status ?? 'healthy'} />
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}

function VetDashboardStub() {
  const visits = useListActiveVisits()
  const list = visits.data ?? []
  const { t } = useLang()
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-foreground">{t('activePatients')}</h2>
        <Button asChild size="sm" variant="outline">
          <Link to="/vet/search" search={{ q: '' }}>
            <Search className="h-4 w-4 mr-1" />
            {t('search')}
          </Link>
        </Button>
      </div>
      {visits.isLoading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      )}
      {!visits.isLoading && list.length === 0 && (
        <Card>
          <CardContent className="py-10 flex flex-col items-center gap-3">
            <Stethoscope className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm text-center">{t('noActivePatientsNow')}</p>
          </CardContent>
        </Card>
      )}
      {list.map((v) => (
        <Card key={v.id} data-testid={`card-visit-${v.id}`}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Visit #{v.id}</p>
                <p className="text-xs text-muted-foreground">{v.type} · {v.visitDate}</p>
              </div>
              <StatusBadge status={v.status} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function DashboardPage() {
  const { isLoaded, isSignedIn } = useAuth()
  const { user: clerkUser } = useUser()
  const me = useGetMe()
  const { activeRole } = useRole()
  const { t } = useLang()
  const navigate = useNavigate()

  // Soft client-side guard: redirect unauthenticated users to /sign-in.
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate({ to: '/sign-in/$', params: { _splat: '' } })
    }
  }, [isLoaded, isSignedIn, navigate])

  const user = me.data

  // Redirect users who haven't completed onboarding (no name or phone set).
  useEffect(() => {
    if (isLoaded && isSignedIn && !me.isLoading && !user?.name && !user?.phone) {
      navigate({ to: '/onboarding' })
    }
  }, [isLoaded, isSignedIn, me.isLoading, user?.name, user?.phone, navigate])

  if (!isLoaded || !isSignedIn) {
    return (
      <AppShell>
        <div className="pt-8 flex justify-center">
          <div className="h-8 w-32 bg-muted rounded animate-pulse" />
        </div>
      </AppShell>
    )
  }
  const isNew = !user?.isPetOwner && !user?.isVet && !user?.isVetOwner
  const isVet = !!(user?.isVet || user?.isVetOwner)
  const greetingName = user?.name ?? clerkUser?.firstName ?? null

  return (
    <AppShell>
      <PageHeader
        title={greetingName ? `${t('welcome')}, ${greetingName.split(' ')[0]}` : t('welcome')}
        subtitle="VetHub"
      />
      {isNew && !me.isLoading && <RoleSelector />}
      {!isNew && activeRole === 'vet' && isVet && user?.clinicId && <VetDashboardStub />}
      {!isNew && activeRole === 'vet' && isVet && !user?.clinicId && (
        <div className="pt-8 flex flex-col items-center gap-3">
          <Stethoscope className="h-12 w-12 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground text-center">{t('vetStaffNote')}</p>
        </div>
      )}
      {!isNew && (activeRole === 'pet-owner' || !isVet) && user?.isPetOwner && <PetOwnerDashboard />}
    </AppShell>
  )
}
