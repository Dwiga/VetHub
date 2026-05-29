import { createFileRoute } from '@tanstack/react-router'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/shared/PageHeader'
import { AddPetForOwnerForm } from '@/components/shared/AddPetForOwnerForm'
import { useLang } from '@/contexts/LangContext'

export const Route = createFileRoute('/hotel/add-pet')({
  component: AddPetForOwnerPage,
  validateSearch: (search: Record<string, string>) => ({
    phone: search.phone ?? '',
  }),
})

function AddPetForOwnerPage() {
  const { phone } = Route.useSearch()
  const { t } = useLang()

  return (
    <AppShell>
      <PageHeader title={t('addPetForOwner') || 'Add pet for owner'} back backHref="/hotel/search" />
      <AddPetForOwnerForm
        initialPhone={phone}
        backHref="/hotel/search"
        successRedirect={(phone) => '/hotel/search'}
      />
    </AppShell>
  )
}
