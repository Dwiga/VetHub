import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
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
  Heart,
  UserX,
} from 'lucide-react'
import { format } from 'date-fns'
import { useState, useEffect } from 'react'
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
  useUpdatePet,
  useListSpecies,
  useListMonitoring,
  useAddMonitoring,
} from '@/lib/api-client'
import { useRole } from '@/contexts/RoleContext'
import { useLang } from '@/contexts/LangContext'

export const Route = createFileRoute('/pets/$petId')({
  component: PetDetailPage,
})

function PetDetailPage() {
  const { petId } = Route.useParams()
  const id = Number(petId)
  const navigate = useNavigate()
  const pet = useGetPet(id)
  const { t } = useLang()
  const p = pet.data
  const hotelBookings = useListHotelBookingsByPet(p?.id)
  const activeHotel = (hotelBookings.data ?? []).find((b: any) => b.status === 'active')
  const [editOpen, setEditOpen] = useState(false)
  const qc = useQueryClient()
  const updatePet = useUpdatePet()
  const species = useListSpecies()
  const { toast } = useToast()

  const editSchema = z.object({
    name: z.string().min(1),
    speciesId: z.string().min(1),
    dateOfBirth: z.string().optional(),
    gender: z.enum(['male', 'female', 'unknown']),
    sterilized: z.boolean(),
    color: z.string().optional(),
    status: z.enum(['healthy', 'sick', 'hospitalized', 'need_intensive_care', 'passed_away']),
  })

  const editForm = useForm<z.infer<typeof editSchema>>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: '',
      speciesId: '',
      gender: 'unknown',
      sterilized: false,
      color: '',
      dateOfBirth: '',
      status: 'healthy',
    },
  })

  useEffect(() => {
    if (p) {
      editForm.reset({
        name: p.name,
        speciesId: String(p.speciesId),
        dateOfBirth: p.dateOfBirth ?? '',
        gender: (p.gender as 'male' | 'female' | 'unknown') ?? 'unknown',
        sterilized: p.sterilized ?? false,
        color: p.color ?? '',
        status: (p.status as any) ?? 'healthy',
      })
    }
  }, [p, editForm])

  async function onEditSubmit(values: z.infer<typeof editSchema>) {
    await updatePet.mutateAsync({
      petId: id,
      data: {
        name: values.name,
        speciesId: parseInt(values.speciesId),
        dateOfBirth: values.dateOfBirth || undefined,
        gender: values.gender,
        sterilized: values.sterilized,
        color: values.color || undefined,
        status: values.status,
      },
    })
    toast({ title: t('petUpdated') })
    setEditOpen(false)
    qc.invalidateQueries({ queryKey: ['pets', id] })
  }

  async function handlePassedAway() {
    await updatePet.mutateAsync({
      petId: id,
      data: { status: 'passed_away' as const },
    })
    toast({ title: t('petUpdated') })
    qc.invalidateQueries({ queryKey: ['pets', id] })
  }

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
    ...(p.ownerPhone ? [['Owner', `${p.ownerPhone} (not registered)`]] : []),
  ].filter(([, v]) => v) as [string, string][]

  return (
    <AppShell>
      <PageHeader
        title={p.name}
        subtitle={p.species?.name ?? undefined}
        back
        backHref="/pets"
        action={
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setEditOpen(true)}
              data-testid="btn-edit-pet"
            >
              <Edit className="h-4 w-4" />
            </Button>
            {p.status !== 'passed_away' && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    data-testid="btn-passed-away"
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('passedAwayTitle') || 'Mark as Passed Away?'}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('passedAwayDesc') || `This will mark ${p.name} as passed away. You can change this later from the edit form.`}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('cancel') || 'Cancel'}</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-500 hover:bg-red-600"
                      onClick={handlePassedAway}
                    >
                      {t('confirm') || 'Confirm'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
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

        <MonitoringSection petId={petId} />

        {/* Edit Pet Modal */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-sm mx-auto max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('editPetTitle')}</DialogTitle>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('petName')}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-pet-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="speciesId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('species')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-species">
                            <SelectValue placeholder={t('selectSpecies')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(species.data ?? []).map((s: any) => (
                            <SelectItem key={s.id} value={String(s.id)}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('petStatus')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-status">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[
                            { value: 'healthy', label: t('statusHealthy') },
                            { value: 'sick', label: t('statusSick') },
                            { value: 'hospitalized', label: t('statusHospitalized') },
                            { value: 'need_intensive_care', label: t('statusNeedsCare') },
                            { value: 'passed_away', label: t('statusPassedAway') },
                          ].map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('dateOfBirth')}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-dob" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('gender')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-gender">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">{t('male')}</SelectItem>
                          <SelectItem value="female">{t('female')}</SelectItem>
                          <SelectItem value="unknown">{t('unknown')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('colorMarkings')}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-color" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="sterilized"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <FormLabel className="mb-0">{t('sterilized')}</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-sterilized"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={updatePet.isPending}
                  data-testid="btn-submit"
                >
                  {updatePet.isPending ? t('saving') : t('save')}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

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
  const canAdd = true // Both pet owners and vets can add vaccinations
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
    const data: any = {
      vaccineName: form.vaccineName,
      brand: form.brand || undefined,
      date: form.date,
      nextDueDate: form.nextDueDate || undefined,
      notes: form.notes || undefined,
    }
    // Vets can submit extra fields; owners only send basic fields (API strips the rest anyway)
    if (isVet) {
      data.batchNumber = form.batchNumber || undefined
      data.administeredBy = form.administeredBy || undefined
      data.cost = form.cost || undefined
    }
    await addMutation.mutateAsync({ petId: id, data })
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
        {canAdd && (
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
                {isVet && (
                  <>
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
                  </>
                )}
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
            <p className="text-xs text-muted-foreground text-center">
              {t('vaccinationTip')}
            </p>
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

function MonitoringSection({ petId }: { petId: string }) {
  const id = Number(petId)
  const { t } = useLang()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    weight: '',
    height: '',
    temperature: '',
    notes: '',
  })

  const monitoringQuery = useListMonitoring(id)
  const addMutation = useAddMonitoring()
  const records = monitoringQuery.data ?? []

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const data: any = {}
    if (form.weight) data.weight = parseFloat(form.weight)
    if (form.height) data.height = parseFloat(form.height)
    if (form.temperature) data.temperature = parseFloat(form.temperature)
    if (form.notes) data.notes = form.notes
    if (!data.weight && !data.height && !data.temperature) return
    await addMutation.mutateAsync({ petId: id, data })
    setForm({ weight: '', height: '', temperature: '', notes: '' })
    setOpen(false)
    toast({ title: t('monitoringRecordAdded') })
  }

  if (monitoringQuery.isLoading) {
    return <div className="h-32 bg-muted animate-pulse rounded-xl" />
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-foreground text-sm">
          {t('healthMonitoring')}
        </h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" data-testid="btn-add-monitoring">
              <Plus className="h-4 w-4 mr-1" />
              {t('addRecord')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm mx-auto">
            <DialogHeader>
              <DialogTitle>{t('addMonitoringRecord')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3 pt-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="mon-weight">{t('weightKg')}</Label>
                  <Input
                    id="mon-weight"
                    name="weight"
                    type="number"
                    step="0.01"
                    value={form.weight}
                    onChange={handleChange}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="mon-height">{t('heightCm')}</Label>
                  <Input
                    id="mon-height"
                    name="height"
                    type="number"
                    step="0.1"
                    value={form.height}
                    onChange={handleChange}
                    placeholder="0.0"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="mon-temp">{t('temperatureC')}</Label>
                <Input
                  id="mon-temp"
                  name="temperature"
                  type="number"
                  step="0.1"
                  value={form.temperature}
                  onChange={handleChange}
                  placeholder="0.0"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="mon-notes">{t('notes')}</Label>
                <Textarea
                  id="mon-notes"
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
                {addMutation.isPending ? t('saving') : t('saveRecord')}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {records.length === 0 ? (
        <Card>
          <CardContent className="py-8 flex flex-col items-center gap-2">
            <Activity className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">{t('noMonitoringRecords')}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {(() => {
            const weightData = records.filter((r) => r.weight != null).reverse().map((r) => ({ date: format(new Date(r.recordedAt), 'MM/dd'), weight: r.weight }))
            if (weightData.length === 0) return null
            return (
              <Card>
                <CardHeader className="pb-2 pt-4"><CardTitle className="text-sm">{t('weightKg')}</CardTitle></CardHeader>
                <CardContent className="pb-4">
                  <ResponsiveContainer width="100%" height={140}>
                    <LineChart data={weightData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} width={32} />
                      <Tooltip />
                      <Line type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )
          })()}

          {(() => {
            const tempData = records.filter((r) => r.temperature != null).reverse().map((r) => ({ date: format(new Date(r.recordedAt), 'MM/dd'), temperature: r.temperature }))
            if (tempData.length === 0) return null
            return (
              <Card>
                <CardHeader className="pb-2 pt-4"><CardTitle className="text-sm">{t('temperatureC')}</CardTitle></CardHeader>
                <CardContent className="pb-4">
                  <ResponsiveContainer width="100%" height={140}>
                    <LineChart data={tempData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} width={32} />
                      <Tooltip />
                      <Line type="monotone" dataKey="temperature" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )
          })()}

          {(() => {
            const heightData = records.filter((r) => r.height != null).reverse().map((r) => ({ date: format(new Date(r.recordedAt), 'MM/dd'), height: r.height }))
            if (heightData.length === 0) return null
            return (
              <Card>
                <CardHeader className="pb-2 pt-4"><CardTitle className="text-sm">{t('heightCm')}</CardTitle></CardHeader>
                <CardContent className="pb-4">
                  <ResponsiveContainer width="100%" height={140}>
                    <LineChart data={heightData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} width={32} />
                      <Tooltip />
                      <Line type="monotone" dataKey="height" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )
          })()}
        </>
      )}
    </div>
  )
}
