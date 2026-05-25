import { createFileRoute } from '@tanstack/react-router'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/shared/PageHeader'
import { useGetHotelBookingStandalone, useUpdateHotelBookingStandalone, useListHotelLogs, useAddHotelLog, useDeleteHotelLog } from '@/lib/api-client'
import { useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { useLang } from '@/contexts/LangContext'

export const Route = createFileRoute('/hotel/$bookingId')({
  component: HotelBookingPage,
})

const EMPTY_LOG = {
  logDate: new Date().toISOString().split('T')[0],
  condition: '',
  feeding: '',
  notes: '',
  cost: '',
}

function HotelBookingPage() {
  const { bookingId: bookingIdStr } = Route.useParams()
  const bookingId = parseInt(bookingIdStr)
  const { t } = useLang()
  const { toast } = useToast()
  const qc = useQueryClient()

  const bookingQuery = useGetHotelBookingStandalone(bookingId)
  const logsQuery = useListHotelLogs(bookingId)
  const updateBooking = useUpdateHotelBookingStandalone()
  const addLog = useAddHotelLog()
  const deleteLog = useDeleteHotelLog()

  const [logOpen, setLogOpen] = useState(false)
  const [logForm, setLogForm] = useState(EMPTY_LOG)
  const [checkOutDate, setCheckOutDate] = useState('')

  const b = bookingQuery.data
  const logs: any[] = logsQuery.data ?? []

  function handleLogChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setLogForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleAddLog(e: React.FormEvent) {
    e.preventDefault()
    await addLog.mutateAsync({
      bookingId,
      data: {
        logDate: logForm.logDate,
        condition: logForm.condition || undefined,
        feeding: logForm.feeding || undefined,
        notes: logForm.notes || undefined,
        cost: logForm.cost ? parseFloat(logForm.cost) : 0,
      },
    })
    setLogForm(EMPTY_LOG)
    setLogOpen(false)
    toast({ title: t('logAdded') })
  }

  async function handleDeleteLog(logId: number) {
    if (!confirm('Hapus log harian ini?')) return
    await deleteLog.mutateAsync({ bookingId, logId })
  }

  async function handleCheckOut() {
    const date = checkOutDate || new Date().toISOString().split('T')[0]
    await updateBooking.mutateAsync({ bookingId, data: { checkOut: date, status: 'completed' } })
    toast({ title: 'Check out completed' })
  }

  if (bookingQuery.isLoading) return (
    <AppShell>
      <div className="space-y-4 pt-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-32 bg-muted animate-pulse rounded-xl" />
      </div>
    </AppShell>
  )

  if (!b) return <AppShell><p className="text-center text-muted-foreground pt-8">{t('visitNotFound')}</p></AppShell>

  const isActive = b.status === 'active'
  const petDisplayName = (b as any).petName ?? (b as any).petNameRaw ?? '—'
  const petDisplayType = (b as any).petSpecies ?? (b as any).petTypeRaw ?? ''
  const ownerDisplayName = (b as any).ownerName ?? (b as any).guestName ?? ''
  const ownerDisplayPhone = (b as any).ownerPhone ?? (b as any).guestPhone ?? ''
  const daysIn = b.checkOut
    ? Math.max(1, Math.ceil((new Date(b.checkOut).getTime() - new Date(b.checkIn).getTime()) / (1000 * 60 * 60 * 24)))
    : Math.max(1, Math.ceil((Date.now() - new Date(b.checkIn).getTime()) / (1000 * 60 * 60 * 24)))

  return (
    <AppShell>
      <PageHeader
        title={petDisplayName}
        subtitle={petDisplayType || undefined}
        back
        backHref="/hotel"
      />

      <div className="space-y-5">
        <Card>
          <CardContent className="py-4 space-y-2">
            {ownerDisplayName && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Owner</span>
                <span className="font-medium">{ownerDisplayName}{ownerDisplayPhone ? ` · ${ownerDisplayPhone}` : ''}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t('checkInLabel')}</span>
              <span className="font-medium">{b.checkIn}</span>
            </div>
            {b.checkOut && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('checkOutLabel')}</span>
                <span className="font-medium">{b.checkOut}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t('daysLabel')}</span>
              <span className="font-medium">{daysIn}</span>
            </div>
            {(b as any).dailyFee != null && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('dailyFee')}</span>
                <span className="font-medium">Rp {Number((b as any).dailyFee).toLocaleString('id-ID')}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm font-semibold pt-1 border-t">
              <span>{t('totalCostLabel')}</span>
              <span className="text-primary">Rp {Number((b as any).totalCost ?? 0).toLocaleString('id-ID')}</span>
            </div>
            {b.notes && <p className="text-xs text-muted-foreground italic pt-1">{b.notes}</p>}
          </CardContent>
        </Card>

        {isActive && (
          <Card>
            <CardContent className="py-4 space-y-3">
              <h3 className="text-sm font-semibold">{t('checkOutBtn')}</h3>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={checkOutDate}
                  onChange={e => setCheckOutDate(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={handleCheckOut}
                  disabled={updateBooking.isPending}
                  size="sm"
                  className="shrink-0"
                >
                  {updateBooking.isPending ? t('saving') : t('checkOutBtn')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">{t('dailyLog')}</CardTitle>
              {isActive && (
                <Dialog open={logOpen} onOpenChange={setLogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-1" />{t('addDailyLog')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm mx-auto">
                    <DialogHeader>
                      <DialogTitle>{t('addDailyLog')}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddLog} className="space-y-3 pt-1">
                      <div className="space-y-1">
                        <Label htmlFor="log-date">{t('logDate')} *</Label>
                        <Input id="log-date" name="logDate" type="date" value={logForm.logDate} onChange={handleLogChange} required />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="log-condition">{t('condition')}</Label>
                        <Input id="log-condition" name="condition" value={logForm.condition} onChange={handleLogChange} placeholder="e.g. Baik, aktif" />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="log-feeding">{t('feeding')}</Label>
                        <Input id="log-feeding" name="feeding" value={logForm.feeding} onChange={handleLogChange} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="log-cost">{t('costLabel')}</Label>
                        <Input id="log-cost" name="cost" type="number" min="0" value={logForm.cost} onChange={handleLogChange} placeholder="0" />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="log-notes">{t('notes')}</Label>
                        <Textarea id="log-notes" name="notes" value={logForm.notes} onChange={handleLogChange} rows={2} />
                      </div>
                      <Button type="submit" className="w-full" disabled={addLog.isPending}>
                        {addLog.isPending ? t('saving') : t('save')}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            {logsQuery.isLoading ? (
              <div className="h-16 bg-muted animate-pulse rounded-xl" />
            ) : logs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{t('noLogsYet')}</p>
            ) : (
              <div className="space-y-2">
                {logs.map((l: any) => (
                  <div key={l.id} className="flex items-start gap-3 py-2 border-b last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold">{l.logDate}</p>
                      {l.condition && <p className="text-xs text-muted-foreground">{t('condition')}: {l.condition}</p>}
                      {l.feeding && <p className="text-xs text-muted-foreground">{t('feeding')}: {l.feeding}</p>}
                      {l.notes && <p className="text-xs text-muted-foreground italic">{l.notes}</p>}
                      {l.cost > 0 && <p className="text-xs text-muted-foreground">Rp {Number(l.cost).toLocaleString('id-ID')}</p>}
                    </div>
                    {isActive && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => handleDeleteLog(l.id)}
                        disabled={deleteLog.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
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
