import { createFileRoute, Link } from '@tanstack/react-router'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/shared/PageHeader'
import {
  useGetHotelBooking, useUpdateHotelBooking,
  useListHotelDailyLogs, useAddHotelDailyLog, useDeleteHotelDailyLog,
} from '@/lib/api-client'
import { useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, PawPrint, ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { useLang } from '@/contexts/LangContext'
import { cn } from '@/lib/utils'
import { calculateDaysIn, calculateRoomFee } from '@/lib/hotel-utils'

export const Route = createFileRoute('/vet/hotel/$bookingId')({
  component: HotelDetailPage,
})

const EMPTY_LOG = {
  logDate: new Date().toISOString().split('T')[0],
  type: 'credit' as 'deposit' | 'credit',
  description: '',
  amount: '',
}

function HotelDetailPage() {
  const { bookingId: bookingIdStr } = Route.useParams()
  const bookingId = parseInt(bookingIdStr)
  const { t } = useLang()
  const { toast } = useToast()
  const qc = useQueryClient()

  const bookingQuery = useGetHotelBooking(bookingId)
  const logsQuery = useListHotelDailyLogs(bookingId)
  const updateBooking = useUpdateHotelBooking()
  const addLog = useAddHotelDailyLog()
  const deleteLog = useDeleteHotelDailyLog()

  const [logOpen, setLogOpen] = useState(false)
  const [logForm, setLogForm] = useState(EMPTY_LOG)
  const [checkOutDate, setCheckOutDate] = useState('')

  const b = bookingQuery.data
  const logs = logsQuery.data ?? []

  function handleLogChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setLogForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  function handleTypeChange(value: string) {
    setLogForm(f => ({ ...f, type: value as 'deposit' | 'credit' }))
  }

  async function handleAddLog(e: React.FormEvent) {
    e.preventDefault()
    await addLog.mutateAsync({
      bookingId,
      data: {
        logDate: logForm.logDate,
        type: logForm.type,
        description: logForm.description || undefined,
        amount: logForm.amount ? parseFloat(logForm.amount) : 0,
      },
    })
    await qc.invalidateQueries({ queryKey: ['hotel-daily-logs', bookingId] })
    await qc.invalidateQueries({ queryKey: ['hotel-bookings', bookingId] })
    setLogForm(EMPTY_LOG)
    setLogOpen(false)
    toast({ title: t('logAdded') })
  }

  async function handleDeleteLog(logId: number) {
    if (!confirm('Hapus log harian ini?')) return
    await deleteLog.mutateAsync({ bookingId, logId })
    await qc.invalidateQueries({ queryKey: ['hotel-daily-logs', bookingId] })
    await qc.invalidateQueries({ queryKey: ['hotel-bookings', bookingId] })
  }

  async function handleCheckOut() {
    const date = checkOutDate || new Date().toISOString().split('T')[0]
    await updateBooking.mutateAsync({
      bookingId,
      data: { checkOut: date, status: 'completed' },
    })
    await qc.invalidateQueries({ queryKey: ['hotel-bookings', bookingId] })
    toast({ title: t('visitSaved') })
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
  const daysIn = calculateDaysIn({ checkIn: b.checkIn, checkOut: b.checkOut })
  const roomFeeTotal = calculateRoomFee({ checkIn: b.checkIn, checkOut: b.checkOut, dailyFee: b.dailyFee ? String(b.dailyFee) : undefined }).roomFeeTotal
  const totalDeposits = (b as any).totalDeposits ?? 0
  const totalCredits = (b as any).totalCredits ?? 0
  const balance = (b as any).balance ?? 0

  return (
    <AppShell>
      <PageHeader
        title={b.petName ?? t('hotelBooking')}
        subtitle={(b as any).petSpecies ?? undefined}
        back
        backHref="/vet/hotel"
        action={
          <Button asChild size="sm" variant="ghost">
            <Link to="/pets/$petId" params={{ petId: String(b.petId) }}><PawPrint className="h-4 w-4" /></Link>
          </Button>
        }
      />

      <div className="space-y-5">
        <Card>
          <CardContent className="py-4 space-y-2">
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
            {b.dailyFee != null && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('dailyFee')}</span>
                <span className="font-medium">Rp {(b.dailyFee as number).toLocaleString('id-ID')}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm font-semibold pt-1 border-t">
              <span>{t('totalCostLabel')}</span>
              <span className="text-primary">Rp {(b.totalCost as number).toLocaleString('id-ID')}</span>
            </div>
            {(b as any).ownerName && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Owner</span>
                <span className="font-medium">{(b as any).ownerName} {(b as any).ownerPhone ? `· ${(b as any).ownerPhone}` : ''}</span>
              </div>
            )}
            {b.notes && (
              <p className="text-xs text-muted-foreground italic pt-1">{b.notes}</p>
            )}
          </CardContent>
        </Card>

        {/* Financial Summary */}
        <Card>
          <CardContent className="py-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t('totalDeposits') || 'Total deposits'}</span>
              <span className="font-medium text-green-600">Rp {Number(totalDeposits).toLocaleString('id-ID')}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t('totalCredits') || 'Total credits'}</span>
              <span className="font-medium text-red-500">Rp {Number(totalCredits).toLocaleString('id-ID')}</span>
            </div>
            <div className="flex items-center justify-between text-sm font-semibold pt-1 border-t">
              <span>{t('balance') || 'Balance'}</span>
              <span className={cn(balance >= 0 ? 'text-green-600' : 'text-red-500')}>
                Rp {Number(balance).toLocaleString('id-ID')}
                {balance > 0 ? ` (${t('refundDue') || 'refund'})` : balance < 0 ? ` (${t('paymentDue') || 'owner pays'})` : ''}
              </span>
            </div>
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
                  placeholder={new Date().toISOString().split('T')[0]}
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
                        <Label>{t('type') || 'Type'}</Label>
                        <Select value={logForm.type} onValueChange={handleTypeChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="deposit">{t('depositType') || 'Deposit (payment)'}</SelectItem>
                            <SelectItem value="credit">{t('creditType') || 'Credit (expense)'}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="log-date">{t('logDate')} *</Label>
                        <Input id="log-date" name="logDate" type="date" value={logForm.logDate} onChange={handleLogChange} required />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="log-desc">{t('description') || 'Description'}</Label>
                        <Input id="log-desc" name="description" value={logForm.description} onChange={handleLogChange} placeholder="e.g. Food, Grooming" />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="log-amount">{t('amount') || 'Amount (Rp)'} *</Label>
                        <Input id="log-amount" name="amount" type="number" min="0" value={logForm.amount} onChange={handleLogChange} placeholder="0" required />
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
                  <div key={l.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                    <div className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                      l.type === 'deposit' ? "bg-green-100" : "bg-red-100"
                    )}>
                      {l.type === 'deposit' ? (
                        <ArrowDownLeft className="h-4 w-4 text-green-600" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold">{l.logDate}</p>
                        <span className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded-full font-medium uppercase",
                          l.type === 'deposit' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        )}>
                          {l.type === 'deposit' ? (t('depositType') || 'Deposit') : (t('creditType') || 'Credit')}
                        </span>
                      </div>
                      {l.description && <p className="text-xs text-muted-foreground">{l.description}</p>}
                    </div>
                    <p className={cn(
                      "text-sm font-medium shrink-0",
                      l.type === 'deposit' ? "text-green-600" : "text-red-500"
                    )}>
                      {l.type === 'deposit' ? '+' : '-'}Rp {Number(l.amount).toLocaleString('id-ID')}
                    </p>
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
