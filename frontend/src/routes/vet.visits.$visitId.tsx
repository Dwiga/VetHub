import { createFileRoute, Link } from '@tanstack/react-router'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import {
  useGetVisit, useUpdateVisit,
  useCreateDailyReport, useGetMe,
  useAddVaccination, useListVaccinations, useUpdatePetStatus, useShareVisit,
} from '@/lib/api-client'
import { useRole } from '@/contexts/RoleContext'
import { useLang } from '@/contexts/LangContext'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useToast } from '@/hooks/use-toast'
import { Printer, Plus, Trash2, CheckCircle2, Circle, Banknote, Share2, AlertTriangle, ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/vet/visits/$visitId')({
  component: VisitDetailPage,
})

const itemSchema = z.object({
  itemDate: z.string().min(1),
  category: z.enum(['service', 'medicine', 'supporting', 'other']),
  name: z.string().min(1),
  description: z.string().optional(),
  quantity: z.string().min(1),
  unitPrice: z.string().min(1),
})

const reportSchema = z.object({
  reportDate: z.string().min(1),
  type: z.enum(['deposit', 'credit']),
  description: z.string().optional(),
  amount: z.string().optional(),
})

const visitSchema = z.object({
  anamnesis: z.string().optional(),
  therapy: z.string().optional(),
  status: z.enum(['active', 'completed', 'cancelled']).optional(),
  dischargeDate: z.string().optional(),
  dailyFee: z.string().optional(),
})

const vaccinationSchema = z.object({
  vaccineName: z.string().min(1),
  brand: z.string().optional(),
  date: z.string().min(1),
  nextDueDate: z.string().optional(),
  cost: z.string().optional(),
  notes: z.string().optional(),
})

function formatDate(dateStr: string) {
  if (!dateStr) return '—'
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

function BillingSummary({ v }: { v: any }) {
  const { t } = useLang()
  const totalDeposits = v.totalDeposits ?? 0
  const totalCredits = v.totalCredits ?? 0
  const balance = v.balance ?? 0
  const roomFeeTotal = v.roomFeeTotal ?? 0
  // totalCredits already includes roomFeeTotal on the backend,
  // so we subtract it here to avoid double-counting in the display
  const serviceCredits = totalCredits - roomFeeTotal

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Banknote className="h-4 w-4 text-primary" />
          {t('billingSummary')}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4 space-y-1.5">
        {serviceCredits > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('receiptCredit') || 'Biaya'}</span>
            <span className="text-red-500">Rp {serviceCredits.toLocaleString('id-ID')}</span>
          </div>
        )}
        {roomFeeTotal > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('autoRoomFee') || 'Room fee'}</span>
            <span className="text-red-500">Rp {roomFeeTotal.toLocaleString('id-ID')}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t('totalDeposits') || 'Pembayaran'}</span>
          <span className="text-green-600">Rp {totalDeposits.toLocaleString('id-ID')}</span>
        </div>
        <div className={cn(
          "flex justify-between text-sm font-semibold border-t border-border pt-1.5 mt-1.5",
          balance < 0 ? 'text-red-500' : balance === 0 ? 'text-green-600' : 'text-blue-600',
        )}>
          <span>{balance < 0 ? t('paymentDue') || 'Kekurangan' : balance > 0 ? t('refundToOwner') || 'Kelebihan' : t('settled') || 'Lunas'}</span>
          <span>Rp {Math.abs(balance).toLocaleString('id-ID')}</span>
        </div>
      </CardContent>
    </Card>
  )
}

function VisitDetailPage() {
  const { visitId } = Route.useParams()
  const id = parseInt(visitId)
  const visit = useGetVisit(id)
  const me = useGetMe()
  const updateVisit = useUpdateVisit()
  const createReport = useCreateDailyReport()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { t } = useLang()
  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const shareVisit = useShareVisit()
  const addVaccination = useAddVaccination()
  const updatePetStatus = useUpdatePetStatus()
  const [vaccinationDialogOpen, setVaccinationDialogOpen] = useState(false)
  const vaccinations = useListVaccinations(visit.data?.petId)

  async function handleShare() {
    setIsSharing(true)
    try {
      const result = await shareVisit.mutateAsync({ visitId: id })
      const url = (result as any).shareUrl
      await navigator.clipboard.writeText(url)
      toast({
        title: 'Link disalin',
        description: (
          <div className="flex flex-col gap-2 mt-1">
            <span className="text-xs break-all text-muted-foreground">{url}</span>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Lihat ringkasan kunjungan: ${url}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-green-600 font-medium hover:underline"
            >
              Bagikan lewat WhatsApp
            </a>
          </div>
        ),
      })
    } catch {
      toast({ title: 'Gagal membuat link', variant: 'destructive' })
    } finally {
      setIsSharing(false)
    }
  }

  const v = visit.data
  const { activeRole } = useRole()
  const isVet = activeRole === 'vet'
  const today = new Date().toISOString().split('T')[0]

  const visitForm = useForm<z.infer<typeof visitSchema>>({
    resolver: zodResolver(visitSchema),
    values: {
      anamnesis: v?.anamnesis ?? '',
      therapy: v?.therapy ?? '',
      status: (v?.status as 'active' | 'completed' | 'cancelled' | undefined) ?? 'active',
      dischargeDate: v?.dischargeDate ?? '',
      dailyFee: v?.dailyFee != null ? String(v.dailyFee) : '',
    },
  })

  const reportForm = useForm<z.infer<typeof reportSchema>>({
    resolver: zodResolver(reportSchema),
    defaultValues: { reportDate: today, type: 'credit', description: '', amount: '' },
  })

  const vaccinationForm = useForm<z.infer<typeof vaccinationSchema>>({
    resolver: zodResolver(vaccinationSchema),
    defaultValues: { vaccineName: '', brand: '', date: today, nextDueDate: '', cost: '', notes: '' },
  })

  async function saveVisit(values: z.infer<typeof visitSchema>) {
    const dailyFeeVal = values.dailyFee && values.dailyFee.trim() !== '' ? String(values.dailyFee) : null
    await updateVisit.mutateAsync({
      visitId: id,
      data: {
        anamnesis: values.anamnesis,
        therapy: values.therapy,
        status: values.status,
        dischargeDate: values.dischargeDate,
        dailyFee: dailyFeeVal,
      },
    })
    queryClient.invalidateQueries({ queryKey: ['visits', id] })
    toast({ title: t('visitSaved') })
  }

  async function addDailyReport(values: z.infer<typeof reportSchema>) {
    await createReport.mutateAsync({
      visitId: id,
      data: {
        reportDate: values.reportDate,
        type: values.type,
        description: values.description || undefined,
        amount: values.amount ? parseFloat(values.amount) : 0,
      },
    })
    queryClient.invalidateQueries({ queryKey: ['visits', id] })
    setReportDialogOpen(false)
    reportForm.reset({ reportDate: today, type: 'credit', description: '', amount: '' })
    toast({ title: t('reportAdded') })
  }

  async function addVaccinationRecord(values: z.infer<typeof vaccinationSchema>) {
    if (!v?.petId) return
    await addVaccination.mutateAsync({
      petId: v.petId,
      data: {
        vaccineName: values.vaccineName,
        brand: values.brand || undefined,
        date: values.date,
        nextDueDate: values.nextDueDate || undefined,
        cost: values.cost || undefined,
        notes: values.notes || undefined,
      },
    })
    vaccinationForm.reset({ vaccineName: '', brand: '', date: today, nextDueDate: '', cost: '', notes: '' })
    setVaccinationDialogOpen(false)
    toast({ title: t('vaccinationAdded') })
  }

  async function markDeceased() {
    if (!v?.petId) return
    await updatePetStatus.mutateAsync({ petId: v.petId, data: { status: 'passed_away' } })
    toast({ title: t('deceasedDone') })
  }

  if (visit.isLoading) return (
    <AppShell>
      <div className="space-y-4 pt-4">
        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />)}
      </div>
    </AppShell>
  )

  if (!v) return <AppShell><p className="text-center text-muted-foreground pt-8">{t('visitNotFound')}</p></AppShell>

  const reports = v.dailyReports ?? []

  const categoryLabels: Record<string, string> = {
    service: t('catService'),
    medicine: t('catMedicine'),
    supporting: t('catSupporting'),
    other: t('catOther'),
  }

  return (
    <AppShell>
      <PageHeader
        title={`${t('newVisit').split(' ')[0]} — ${(v as any).petName ?? ''}`}
        subtitle={[v.visitDate, v.vetName ? `drh. ${v.vetName}` : null].filter(Boolean).join(' · ')}
        back
        action={
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={handleShare} disabled={isSharing} title="Bagikan kunjungan">
              <Share2 className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => window.print()} data-testid="btn-print">
              <Printer className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      <div className="space-y-5 print:space-y-4">
        <div className="flex items-center gap-2">
          <StatusBadge status={v.type ?? 'outpatient'} />
          <StatusBadge status={v.status ?? 'active'} />
          <span className="text-sm text-muted-foreground flex-1 text-right">
            {t('balance') || 'Balance'}: <span className={cn('font-semibold', (v as any).balance < 0 ? 'text-red-500' : (v as any).balance > 0 ? 'text-blue-600' : 'text-foreground')}>
              Rp {((v as any).balance ?? 0).toLocaleString('id-ID')}
            </span>
          </span>
        </div>

        {isVet && (
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">{t('clinicalNotes')}</CardTitle></CardHeader>
            <CardContent>
              <Form {...visitForm}>
                <form onSubmit={visitForm.handleSubmit(saveVisit)} className="space-y-3">
                  <FormField control={visitForm.control} name="anamnesis" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('anamnesis')}</FormLabel>
                      <FormControl><Textarea {...field} rows={3} placeholder={t('anamnesisPlaceholderShort')} data-testid="input-anamnesis" /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={visitForm.control} name="therapy" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('therapy')}</FormLabel>
                      <FormControl><Textarea {...field} rows={3} placeholder={t('therapyPlaceholderShort')} data-testid="input-therapy" /></FormControl>
                    </FormItem>
                  )} />
                  <div className="flex gap-3">
                    <FormField control={visitForm.control} name="status" render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>{t('statusLabel')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? ''}>
                          <FormControl><SelectTrigger data-testid="select-status"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="active">{t('statusActive')}</SelectItem>
                            <SelectItem value="completed">{t('statusCompleted')}</SelectItem>
                            <SelectItem value="cancelled">{t('statusCancelled')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    <FormField control={visitForm.control} name="dischargeDate" render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>{t('dischargeDate')}</FormLabel>
                        <FormControl><Input type="date" {...field} data-testid="input-discharge" /></FormControl>
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={visitForm.control} name="dailyFee" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('dailyFee')}</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" placeholder="0" {...field} data-testid="input-daily-fee" />
                      </FormControl>
                    </FormItem>
                  )} />
                  <Button type="submit" size="sm" className="w-full" disabled={updateVisit.isPending} data-testid="btn-save-visit">
                    {updateVisit.isPending ? t('saving') : t('saveNotes')}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Daily Reports - for all visit types */}
        <Card>
          <CardHeader className="pb-3 flex-row items-center justify-between">
            <CardTitle className="text-sm">{t('dailyReports')}</CardTitle>
            {isVet && (
              <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" data-testid="btn-add-report"><Plus className="h-4 w-4 mr-1" />{t('add')}</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>{t('addDailyReport')}</DialogTitle></DialogHeader>
                  <Form {...reportForm}>
                    <form onSubmit={reportForm.handleSubmit(addDailyReport)} className="space-y-4 pt-2">
                      <FormField control={reportForm.control} name="type" render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('type') || 'Type'}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="deposit">{t('depositType') || 'Deposit (payment)'}</SelectItem>
                              <SelectItem value="credit">{t('creditType') || 'Credit (expense)'}</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )} />
                      <FormField control={reportForm.control} name="reportDate" render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('date')}</FormLabel>
                          <FormControl><Input type="date" {...field} data-testid="input-report-date" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={reportForm.control} name="description" render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('description') || 'Description'}</FormLabel>
                          <FormControl><Input {...field} placeholder="e.g. Food, Grooming, Medicine" data-testid="input-description" /></FormControl>
                        </FormItem>
                      )} />
                      <FormField control={reportForm.control} name="amount" render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('amount') || 'Amount (Rp)'}</FormLabel>
                          <FormControl><Input type="number" min="0" {...field} data-testid="input-amount" /></FormControl>
                        </FormItem>
                      )} />
                      <Button type="submit" className="w-full" disabled={createReport.isPending} data-testid="btn-submit-report">
                        {createReport.isPending ? t('addingReport') : t('addReport')}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
          </CardHeader>
          <CardContent className="pb-4">
            {reports.length === 0 && <p className="text-sm text-muted-foreground text-center py-3">{t('noReportsYet')}</p>}
            <div className="space-y-3">
              {reports.map((r: any) => (
                isVet ? (
                  <Link key={r.id} to="/vet/daily-reports/$reportId" params={{ reportId: String(r.id) }}>
                    <Card className="hover:border-primary/50 cursor-pointer" data-testid={`card-report-${r.id}`}>
                      <CardContent className="py-3 flex items-center gap-3">
                        <div className={cn("h-8 w-8 rounded-full flex items-center justify-center shrink-0", r.type === 'deposit' ? "bg-green-100" : "bg-red-100")}>
                          {r.type === 'deposit' ? <ArrowDownLeft className="h-4 w-4 text-green-600" /> : <ArrowUpRight className="h-4 w-4 text-red-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-semibold">{formatDate(r.reportDate)}</p>
                            <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium uppercase", r.type === 'deposit' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                              {r.type === 'deposit' ? (t('depositType') || 'Deposit') : (t('creditType') || 'Credit')}
                            </span>
                          </div>
                          {r.description && <p className="text-xs text-muted-foreground">{r.description}</p>}
                        </div>
                        <p className={cn("text-sm font-medium shrink-0", r.type === 'deposit' ? "text-green-600" : "text-red-500")}>
                          {r.type === 'deposit' ? '+' : '-'}Rp {(r.amount ?? 0).toLocaleString('id-ID')}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ) : (
                  <Card key={r.id} data-testid={`card-report-${r.id}`}>
                    <CardContent className="py-3">
                      <p className="text-xs font-semibold text-primary">{formatDate(r.reportDate)}</p>
                      {r.description && <p className="text-sm mt-1">{r.description}</p>}
                      {r.amount > 0 && <p className={cn("text-xs mt-1", r.type === 'deposit' ? "text-green-600" : "text-red-500")}>
                        {r.type === 'deposit' ? '+' : '-'}Rp {(r.amount ?? 0).toLocaleString('id-ID')}
                      </p>}
                    </CardContent>
                  </Card>
                )
              ))}
            </div>
          </CardContent>
        </Card>

        {isVet && (
          <Card>
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <CardTitle className="text-sm">{t('vaccinationRecords')}</CardTitle>
              <Dialog open={vaccinationDialogOpen} onOpenChange={setVaccinationDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" data-testid="btn-add-vaccination">
                    <Plus className="h-4 w-4 mr-1" />{t('add')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>{t('addVaccination')}</DialogTitle></DialogHeader>
                  <Form {...vaccinationForm}>
                    <form onSubmit={vaccinationForm.handleSubmit(addVaccinationRecord)} className="space-y-4 pt-2">
                      <FormField control={vaccinationForm.control} name="vaccineName" render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('vaccineName')}</FormLabel>
                          <FormControl><Input {...field} data-testid="input-vaccine-name" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <div className="flex gap-3">
                        <FormField control={vaccinationForm.control} name="date" render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>{t('dateGiven')}</FormLabel>
                            <FormControl><Input type="date" {...field} data-testid="input-vaccine-date" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={vaccinationForm.control} name="nextDueDate" render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>{t('nextDueDateLabel')}</FormLabel>
                            <FormControl><Input type="date" {...field} data-testid="input-vaccine-next-date" /></FormControl>
                          </FormItem>
                        )} />
                      </div>
                      <FormField control={vaccinationForm.control} name="brand" render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('brand')}</FormLabel>
                          <FormControl><Input {...field} data-testid="input-vaccine-brand" /></FormControl>
                        </FormItem>
                      )} />
                      <FormField control={vaccinationForm.control} name="cost" render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('costLabel')}</FormLabel>
                          <FormControl><Input type="number" min="0" {...field} data-testid="input-vaccine-cost" /></FormControl>
                        </FormItem>
                      )} />
                      <FormField control={vaccinationForm.control} name="notes" render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('notes')}</FormLabel>
                          <FormControl><Textarea {...field} rows={2} data-testid="input-vaccine-notes" /></FormControl>
                        </FormItem>
                      )} />
                      <Button type="submit" className="w-full" disabled={addVaccination.isPending} data-testid="btn-submit-vaccination">
                        {addVaccination.isPending ? t('saving') : t('saveVaccination')}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="pb-4">
              {vaccinations.isLoading ? (
                <p className="text-xs text-muted-foreground text-center py-2">Loading...</p>
              ) : vaccinations.data && vaccinations.data.length > 0 ? (
                <div className="space-y-2">
                  {vaccinations.data.map((vac: any) => (
                    <div key={vac.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{vac.vaccineName}</p>
                        <p className="text-xs text-muted-foreground">{vac.date}{vac.brand ? ` · ${vac.brand}` : ''}</p>
                        {vac.nextDueDate && <p className="text-xs text-muted-foreground">Next: {vac.nextDueDate}</p>}
                      </div>
                      {vac.cost && <p className="text-xs text-muted-foreground shrink-0">Rp {Number(vac.cost).toLocaleString('id-ID')}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-2">{t('noVaccinationRecords')}</p>
              )}
            </CardContent>
          </Card>
        )}

        {isVet && (
          <div className="rounded-xl border border-destructive/20 p-4">
            <p className="text-xs text-muted-foreground mb-2">{t('statusPassedAway')}</p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="w-full text-destructive border-destructive/40 hover:bg-destructive/10"
              onClick={markDeceased}
              disabled={updatePetStatus.isPending}
              data-testid="btn-mark-deceased"
            >
              <AlertTriangle className="h-3.5 w-3.5 mr-1" />{t('markDeceased')}
            </Button>
          </div>
        )}

        <BillingSummary v={v} />
      </div>
    </AppShell>
  )
}
