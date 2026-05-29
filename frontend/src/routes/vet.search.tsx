import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/shared/PageHeader'
import { OwnerSearch } from '@/components/shared/OwnerSearch'
import { useGetMe } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { useLang } from '@/contexts/LangContext'

export const Route = createFileRoute('/vet/search')({
  component: VetSearchPage,
  validateSearch: (search: Record<string, string>) => ({
    q: search.q ?? '',
  }),
})

function VetSearchPage() {
  const { q } = Route.useSearch()
  const navigate = useNavigate()
  const me = useGetMe()
  const { t } = useLang()

  return (
    <AppShell>
      <PageHeader title={t('search')} back backHref="/vet" />
      <OwnerSearch
        backHref="/vet"
        addPetPath="/vet/add-pet"
        initialQ={q}
        actionButton={(pet) =>
          me.data?.clinicId ? (
            <Button
              size="sm"
              variant="outline"
              onClick={e => { e.preventDefault(); navigate({ to: '/vet/visits/new/$petId', params: { petId: String(pet.id) } }) }}
              data-testid={`btn-new-visit-${pet.id}`}
            >
              {t('visitBtn')}
            </Button>
          ) : null
        }
      />
    </AppShell>
  )
}
