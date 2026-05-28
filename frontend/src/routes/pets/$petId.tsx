import { createFileRoute, Link } from '@tanstack/react-router'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  Edit,
  Plus,
  Activity,
  Syringe,
  Trash2,
  ClipboardList,
} from 'lucide-react'
import { format } from 'date-fns'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  useGetPet,
  useListVisits,
  useListVaccinations,
  useAddVaccination,
  useDeleteVaccination,
  useListHealthEvents,
  useAddHealthEvent,
  useDeleteHealthEvent,
  useListHotelBookingsByPet,
} from '@/lib/api-client'
import { useRole } from '@/contexts/RoleContext'
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
  const hotelBookings = useListHotelBookingsByPet(p?.id)
  const activeHotel = (hotelBookings.data ?? []).find((b: any) => b.status === 'active')

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
        <p
          className="text-center text-muted-foreground pt-8"
          data-testid="pet-not-found"
        >
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
            <Link to="/pets/$petId/edit" params={{ petId }}>
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
                  <img
                    src={p.photoUrl}
                    alt={p.name}
                    className="h-full w-full object-cover"
                  />
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

        <VaccinationSection petId={petId} />

        <HealthEventsSection petId={petId} />

        {activeHotel && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="py-4 space-y-2">
              <p className="text-sm font-semibold">
                🏨 {t('petInHotel') || 'Your pet is currently at'} {activeHotel.clinicName ?? 'the hotel'}
              </p>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>{t('checkInLabel')}: {activeHotel.checkIn} · {t('roomTypeLabel')}: {activeHotel.roomType ?? '—'}</p>
                <p>{t('daysLabel')}: {activeHotel.daysIn ?? 0}</p>
                {(activeHotel.totalCredits ?? 0) > 0 && (
                  <p>{t('totalCredits') || 'Total credits'}: Rp {Number(activeHotel.totalCredits ?? 0).toLocaleString('id-ID')}</p>
                )}
                <p className={cn((activeHotel.balance ?? 0) >= 0 ? 'text-green-600' : 'text-red-500', 'font-medium')}>
                  {t('balance') || 'Balance'}: Rp {Number(activeHotel.balance ?? 0).toLocaleString('id-ID')}
                </p>
              </div>
              {activeHotel.shareToken && (
                <Button asChild size="sm" className="w-full mt-1">
                  <a href={`/share/hotel/${activeHotel.shareToken}`}>{t('viewFeeDetails') || 'View fee details'} →</a>
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground text-sm">
            {t('visitHistory')}
          </h2>
        </div>
        <VisitHistory petId={petId} />
      </div>
    </AppShell>
  )
}

function VisitHistory({ petId }: { petId: string }) {
  const id = Number(petId)
  const visits = useListVisits(id)
  const visitList = visits.data ?? []
  const { t } = useLang()

  if (visits.isLoading)
    return <div className="h-20 bg-muted animate-pulse rounded-xl" />
  if (visitList.length === 0)
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        {t('noVisitHistory')}
      </p>
    )

  return (
    <div className="space-y-3">
      {visitList.map((v: any) => {
        const shareLink = v.shareToken ? `/share/vet/${v.shareToken}` : null
        return (
          <div key={v.id}>
            {shareLink ? (
              <a href={shareLink}>
                <VisitCard v={v} t={t} />
              </a>
            ) : (
              <VisitCard v={v} t={t} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function VisitCard({ v, t }: { v: any; t: any }) {
  return (
    <Card
      className={v.shareToken ? 'hover:border-primary/50 transition-colors cursor-pointer' : ''}
      data-testid={`card-visit-${v.id}`}
    >
      <CardContent className="py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">
              {v.visitDate}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {v.vetName ? `Vet: ${v.vetName}` : (t as any)('noVetAssigned')}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <StatusBadge status={v.type ?? 'outpatient'} />
            <StatusBadge status={v.status ?? 'active'} />
          </div>
        </div>
        {(v.totalCredits ?? 0) > 0 && (
          <div className="flex items-center justify-between mt-1.5 gap-2">
            <p className="text-xs text-muted-foreground">
              {(t as any)('totalCredits') || 'Bill'}:{' '}
              <span className="font-semibold text-foreground">
                Rp {(v.totalCredits ?? 0).toLocaleString('id-ID')}
              </span>
            </p>
            {v.balance != null && (
              <p className={cn(
                'text-xs font-medium',
                (v.balance ?? 0) >= 0 ? 'text-green-600' : 'text-red-500'
              )}>
                {(t as any)('balance') || 'Balance'}: Rp {Number(v.balance ?? 0).toLocaleString('id-ID')}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

const EMPTY_FORM = {
  vaccineName: '',
  brand: '',
  date: new Date().toISOString().split('T')[0],
  nextDueDate: '',
  batchNumber: '',
  administeredBy: '',
  cost: '',
  notes: '',
}

function VaccinationSection({ petId }: { petId: string }) {
  const id = Number(petId)
  const { activeRole } = useRole()
  const isVet = activeRole === 'vet'
  const { t } = useLang()
  const vaccinationsQuery = useListVaccinations(id)
  const addMutation = useAddVaccination()
  const deleteMutation = useDeleteVaccination()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const records = vaccinationsQuery.data ?? []

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.vaccineName || !form.date) return
    await addMutation.mutateAsync({
      petId: id,
      data: {
        vaccineName: form.vaccineName,
        brand: form.brand || undefined,
        date: form.date,
        nextDueDate: form.nextDueDate || undefined,
        batchNumber: form.batchNumber || undefined,
        administeredBy: form.administeredBy || undefined,
        cost: form.cost || undefined,
        notes: form.notes || undefined,
      },
    })
    setForm(EMPTY_FORM)
    setOpen(false)
  }

  async function handleDelete(vaccinationId: number) {
    if (!confirm(t('deleteVaccinationConfirm'))) return
    await deleteMutation.mutateAsync({ petId: id, vaccinationId })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-foreground text-sm">
          {t('vaccinationRecords')}
        </h2>
        {isVet && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" data-testid="btn-add-vaccination">
                <Plus className="h-4 w-4 mr-1" />
                {t('add')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm mx-auto">
              <DialogHeader>
                <DialogTitle>{t('addVaccination')}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-3 pt-1">
                <div className="space-y-1">
                  <Label htmlFor="vaccineName">{t('vaccineName')} *</Label>
                  <Input
                    id="vaccineName"
                    name="vaccineName"
                    value={form.vaccineName}
                    onChange={handleChange}
                    placeholder="e.g. Rabies, DHPP"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="brand">{t('brand')}</Label>
                  <Input
                    id="brand"
                    name="brand"
                    value={form.brand}
                    onChange={handleChange}
                    placeholder="e.g. Nobivac"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="date">{t('dateGiven')} *</Label>
                    <Input
                      id="date"
                      name="date"
                      type="date"
                      value={form.date}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="nextDueDate">{t('nextDueDateLabel')}</Label>
                    <Input
                      id="nextDueDate"
                      name="nextDueDate"
                      type="date"
                      value={form.nextDueDate}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="batchNumber">{t('batchNo')}</Label>
                    <Input
                      id="batchNumber"
                      name="batchNumber"
                      value={form.batchNumber}
                      onChange={handleChange}
                      placeholder="Optional"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="cost">{t('costLabel') || 'Cost (Rp)'}</Label>
                    <Input
                      id="cost"
                      name="cost"
                      type="number"
                      min="0"
                      value={form.cost}
                      onChange={handleChange}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="administeredBy">{t('administeredBy')}</Label>
                  <Input
                    id="administeredBy"
                    name="administeredBy"
                    value={form.administeredBy}
                    onChange={handleChange}
                    placeholder="Vet name or clinic"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="notes">{t('notes')}</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    rows={2}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={addMutation.isPending}
                >
                  {addMutation.isPending ? t('saving') : t('saveVaccination')}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {vaccinationsQuery.isLoading ? (
        <div className="h-20 bg-muted animate-pulse rounded-xl" />
      ) : records.length === 0 ? (
        <Card>
          <CardContent className="py-8 flex flex-col items-center gap-2">
            <Syringe className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">{t('noVaccinationRecords')}</p>
            {isVet && (
              <p className="text-xs text-muted-foreground text-center">
                {t('vaccinationTip')}
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {records.map((v) => (
            <Card key={v.id} data-testid={`card-vaccination-${v.id}`}>
              <CardContent className="py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {v.vaccineName}
                    </p>
                    {v.brand && (
                      <p className="text-xs text-muted-foreground">{v.brand}</p>
                    )}
                    <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      <span>
                        {t('givenLabel')}{' '}
                        <span className="text-foreground font-medium">{v.date}</span>
                      </span>
                      {v.nextDueDate && (
                        <span>
                          {t('nextDueLabel')}{' '}
                          <span className="text-foreground font-medium">
                            {v.nextDueDate}
                          </span>
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      {v.administeredBy && (
                        <span>
                          {t('byLabel')} {v.administeredBy}
                        </span>
                      )}
                      {v.batchNumber && (
                        <span>
                          {t('batchLabel')} {v.batchNumber}
                        </span>
                      )}
                      {v.cost != null && parseFloat(v.cost) > 0 && (
                        <span>Rp {parseFloat(v.cost).toLocaleString('id-ID')}</span>
                      )}
                    </div>
                    {v.notes && (
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        {v.notes}
                      </p>
                    )}
                  </div>
                  {isVet && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => handleDelete(v.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`btn-delete-vaccination-${v.id}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function HealthEventsSection({ petId }: { petId: string }) {
  const id = Number(petId)
  const { t } = useLang()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    title: '',
    notes: '',
    eventDate: new Date().toISOString().split('T')[0],
  })

  const eventsQuery = useListHealthEvents(id)
  const addMutation = useAddHealthEvent()
  const deleteMutation = useDeleteHealthEvent()
  const events = eventsQuery.data ?? []

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title) return
    await addMutation.mutateAsync({
      petId: id,
      data: {
        title: form.title,
        notes: form.notes || undefined,
        eventDate: form.eventDate,
      },
    })
    setForm({
      title: '',
      notes: '',
      eventDate: new Date().toISOString().split('T')[0],
    })
    setOpen(false)
  }

  async function handleDelete(eventId: number) {
    if (!confirm(t('deleteHealthEventConfirm'))) return
    await deleteMutation.mutateAsync({ petId: id, eventId })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-foreground text-sm">
          {t('healthEvents')}
        </h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" data-testid="btn-add-health-event">
              <Plus className="h-4 w-4 mr-1" />
              {t('add')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm mx-auto">
            <DialogHeader>
              <DialogTitle>{t('addHealthEvent')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3 pt-1">
              <div className="space-y-1">
                <Label htmlFor="he-title">{t('eventTitle')} *</Label>
                <Input
                  id="he-title"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder={t('healthEventPlaceholder')}
                  required
                  data-testid="input-health-event-title"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="he-date">{t('date')}</Label>
                <Input
                  id="he-date"
                  name="eventDate"
                  type="date"
                  value={form.eventDate}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="he-notes">{t('notes')}</Label>
                <Textarea
                  id="he-notes"
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows={2}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={addMutation.isPending}
                data-testid="btn-save-health-event"
              >
                {addMutation.isPending ? t('saving') : t('save')}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {eventsQuery.isLoading ? (
        <div className="h-16 bg-muted animate-pulse rounded-xl" />
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="py-8 flex flex-col items-center gap-2">
            <ClipboardList className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">{t('noHealthEvents')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {events.map((ev) => (
            <Card key={ev.id}>
              <CardContent className="py-3 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{ev.title}</p>
                  <p className="text-xs text-muted-foreground">{ev.eventDate}</p>
                  {ev.notes && (
                    <p className="text-xs text-muted-foreground italic mt-0.5">
                      {ev.notes}
                    </p>
                  )}
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => handleDelete(ev.id)}
                  disabled={deleteMutation.isPending}
                  data-testid={`btn-delete-health-event-${ev.id}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
