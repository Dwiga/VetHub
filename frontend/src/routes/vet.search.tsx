import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useSearchPetOwner, useSearchPet } from '@/lib/api-client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PawPrint, Phone, User, Plus } from 'lucide-react'
import { useState } from 'react'
import { useGetMe } from '@/lib/api-client'
import { normalizePhone } from '@/lib/phone'
import { useLang } from '@/contexts/LangContext'

export const Route = createFileRoute('/vet/search')({
  component: VetSearchPage,
  validateSearch: (search: Record<string, string>) => ({
    q: search.q ?? '',
  }),
})

function VetSearchPage() {
  const { q: initialQ } = Route.useSearch()
  const [phone, setPhone] = useState(initialQ)
  const [petName, setPetName] = useState(initialQ)
  const [tab, setTab] = useState('phone')
  const navigate = useNavigate()
  const me = useGetMe()
  const { t } = useLang()

  const [submittedPhone, setSubmittedPhone] = useState(initialQ)
  const [submittedPetName, setSubmittedPetName] = useState('')

  const ownerResult = useSearchPetOwner({ phone: submittedPhone })
  const petResults = useSearchPet({ name: submittedPetName })

  function handlePhoneSearch(e: React.FormEvent) {
    e.preventDefault()
    setSubmittedPhone(normalizePhone(phone.trim()))
    navigate({ to: '/vet/search', search: { q: phone.trim() } })
  }

  function handlePetSearch(e: React.FormEvent) {
    e.preventDefault()
    setSubmittedPetName(petName.trim())
    navigate({ to: '/vet/search', search: { q: petName.trim() } })
  }

  const owner = ownerResult.data?.owner
  const ownerPets = ownerResult.data?.pets ?? []

  return (
    <AppShell>
      <PageHeader title={t('search')} back backHref="/vet" />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full mb-5">
          <TabsTrigger value="phone" className="flex-1" data-testid="tab-phone">{t('byPhone')}</TabsTrigger>
          <TabsTrigger value="pet" className="flex-1" data-testid="tab-pet">{t('byPetName')}</TabsTrigger>
        </TabsList>

        <TabsContent value="phone" className="space-y-4">
          <form onSubmit={handlePhoneSearch} className="flex gap-2">
            <Input
              placeholder={t('phonePlaceholder')}
              value={phone}
              onChange={e => setPhone(e.target.value)}
              data-testid="input-phone"
            />
            <Button type="submit" size="sm" disabled={!phone.trim()} data-testid="btn-search-phone">{t('search')}</Button>
          </form>

          {ownerResult.isLoading && <div className="h-24 bg-muted animate-pulse rounded-xl" />}

          {ownerResult.isError && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">{t('noOwnerFound')}</p>
              <Button asChild variant="outline" size="sm" className="w-full" data-testid="btn-add-pet-for-owner">
                <Link to="/vet/add-pet">{t('addPetForNumber')}</Link>
              </Button>
            </div>
          )}

          {owner && (
            <div className="space-y-4">
              <Card>
                <CardContent className="py-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                    <User className="h-5 w-5 text-primary/60" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm" data-testid="text-owner-name">{owner.name ?? 'Unnamed'}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" />{owner.phone}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">{t('petsCount')} ({ownerPets.length})</h3>
                <Button asChild size="sm" variant="outline" data-testid="btn-add-pet">
                  <Link to="/vet/add-pet"><Plus className="h-4 w-4 mr-1" />{t('addPet')}</Link>
                </Button>
              </div>

              <div className="space-y-3">
                {ownerPets.map((pet: any) => (
                  <Link key={pet.id} to="/pets/$petId" params={{ petId: String(pet.id) }}>
                    <Card className="hover:border-primary/50 transition-colors cursor-pointer" data-testid={`card-pet-${pet.id}`}>
                      <CardContent className="py-3 flex items-center gap-3">
                        <PawPrint className="h-4 w-4 text-primary/60 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{pet.name}</p>
                          <p className="text-xs text-muted-foreground">{pet.speciesName}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={pet.status ?? 'healthy'} />
                          {me.data?.clinicId && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={e => { e.preventDefault(); navigate({ to: '/vet/visits/new/$petId', params: { petId: String(pet.id) } }) }}
                              data-testid={`btn-new-visit-${pet.id}`}
                            >
                              {t('visitBtn')}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="pet" className="space-y-4">
          <form onSubmit={handlePetSearch} className="flex gap-2">
            <Input
              placeholder={t('petNameSearchPlaceholder')}
              value={petName}
              onChange={e => setPetName(e.target.value)}
              data-testid="input-pet-name"
            />
            <Button type="submit" size="sm" disabled={!petName.trim()} data-testid="btn-search-pet">{t('search')}</Button>
          </form>

          {petResults.isLoading && <div className="h-24 bg-muted animate-pulse rounded-xl" />}

          {petResults.data && petResults.data.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">{t('noPetsFound')}</p>
          )}

          <div className="space-y-3">
            {(petResults.data ?? []).map((pet: any) => (
              <Link key={pet.id} to="/pets/$petId" params={{ petId: String(pet.id) }}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer" data-testid={`card-pet-${pet.id}`}>
                  <CardContent className="py-3 flex items-center gap-3">
                    <PawPrint className="h-4 w-4 text-primary/60 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{pet.name}</p>
                      <p className="text-xs text-muted-foreground">{pet.speciesName} · {pet.ownerName} · {pet.ownerPhone}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={pet.status ?? 'healthy'} />
                      {me.data?.clinicId && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={e => { e.preventDefault(); navigate({ to: '/vet/visits/new/$petId', params: { petId: String(pet.id) } }) }}
                          data-testid={`btn-new-visit-${pet.id}`}
                        >
                          {t('visitBtn')}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </AppShell>
  )
}
