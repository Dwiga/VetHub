import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/shared/PageHeader'
import { useGetMe, useListSpecies, useAddSpecies } from '@/lib/api-client'
import { useLang } from '@/contexts/LangContext'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState, useEffect } from 'react'
import { Plus, PawPrint, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/admin')({
  component: AdminPage,
})

function AdminPage() {
  const me = useGetMe()
  const { t } = useLang()
  const { toast } = useToast()
  const navigate = useNavigate()
  const speciesQuery = useListSpecies()
  const addSpecies = useAddSpecies()
  const [newSpecies, setNewSpecies] = useState('')

  // Redirect non-admins
  useEffect(() => {
    if (me.data && !me.data.isAdmin) {
      navigate({ to: '/' as never })
    }
  }, [me.data, navigate])

  if (!me.data?.isAdmin) {
    return null
  }

  const speciesList = speciesQuery.data ?? []

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newSpecies.trim()) return
    try {
      await addSpecies.mutateAsync({ name: newSpecies.trim() })
      toast({ title: t('speciesAdded') || 'Species added' })
      setNewSpecies('')
    } catch (err: any) {
      toast({ title: err.message || 'Failed to add species', variant: 'destructive' })
    }
  }

  return (
    <AppShell>
      <PageHeader title={t('nav_admin') || 'Admin'} back />

      <div className="space-y-5">
        {/* Species Management */}
        <Card>
          <CardContent className="py-4">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <PawPrint className="h-4 w-4" />
              Species
            </h2>

            <form onSubmit={handleAdd} className="flex gap-2 mb-4">
              <Input
                value={newSpecies}
                onChange={(e) => setNewSpecies(e.target.value)}
                placeholder="New species name..."
                className="flex-1"
              />
              <Button
                type="submit"
                size="sm"
                disabled={addSpecies.isPending}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </form>

            {speciesQuery.isLoading ? (
              <div className="h-20 bg-muted animate-pulse rounded-lg" />
            ) : speciesList.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No species found
              </p>
            ) : (
              <div className="space-y-1">
                {speciesList.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/50"
                  >
                    <span className="text-sm">{s.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ID: {s.id}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
