import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/shared/PageHeader'
import { OwnerSearch } from '@/components/shared/OwnerSearch'
import { useGetMe } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { useLang } from '@/contexts/LangContext'

export const Route = createFileRoute('/hotel/search')({
  component: HotelSearchPage,
  validateSearch: (search: Record<string, string>) => ({
    q: search.q ?? '',
  }),
})

function HotelSearchPage() {
  const { q } = Route.useSearch()
  const navigate = useNavigate()
  const me = useGetMe()
  const { t } = useLang()

  return (
    <AppShell>
      <PageHeader title={t('search')} back backHref="/hotel" />
      <OwnerSearch
        backHref="/hotel"
        addPetPath="/hotel/add-pet"
        initialQ={q}
        actionButton={(pet) =>
          me.data?.hotelId ? (
            <Button
              size="sm"
              variant="outline"
              onClick={e => { e.preventDefault(); navigate({ to: '/hotel/new/$petId', params: { petId: String(pet.id) } }) }}
              data-testid={`btn-check-in-${pet.id}`}
            >
              {t('checkIn')}
            </Button>
          ) : null
        }
      />
    </AppShell>
  )
}
