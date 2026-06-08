import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/shared/PageHeader'
import { useGetMe, useCreateStandaloneHotelBooking } from '@/lib/api-client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { useLang } from '@/contexts/LangContext'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/hotel/new/')({
  component: HotelNewGuestPage,
})

const schema = z.object({
  checkIn: z.string().min(1),
  expectedCheckOut: z.string().optional(),
  roomType: z.string().optional(),
  dailyFee: z.string().optional(),
  notes: z.string().optional(),
})

function HotelNewGuestPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { t } = useLang()
  const me = useGetMe()
  const createBooking = useCreateStandaloneHotelBooking()
  const [reservationMode, setReservationMode] = useState(false)

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      checkIn: '',
      expectedCheckOut: '',
      roomType: '',
      dailyFee: '',
      notes: '',
    },
  })

  useEffect(() => {
    if (!form.getValues('checkIn')) {
      form.setValue('checkIn', new Date().toISOString().split('T')[0])
    }
  }, [])

  async function onSubmit(values: z.infer<typeof schema>) {
    const hotelId = me.data?.hotelId
    if (!hotelId) return
    try {
      const booking = await createBooking.mutateAsync({
        data: {
          clinicId: hotelId,
          checkIn: values.checkIn,
          expectedCheckOut: values.expectedCheckOut || undefined,
          roomType: values.roomType || undefined,
          dailyFee: values.dailyFee ? String(values.dailyFee) : undefined,
          notes: values.notes || undefined,
          status: reservationMode ? 'reserved' : 'active',
        },
      })
      toast({ title: reservationMode ? t('reservationCreated') : t('guestCheckedIn') })
      navigate({ to: '/hotel/$bookingId', params: { bookingId: String((booking as any).id) } })
    } catch {
      toast({ title: 'Error', description: 'Failed to create booking', variant: 'destructive' })
    }
  }

  return (
    <AppShell>
      <PageHeader title={t('newGuest')} back backHref="/hotel" />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className={cn(
            "flex items-center justify-between p-3 rounded-lg border",
            reservationMode ? "bg-primary/5 border-primary/30" : "bg-muted/50"
          )}>
            <div>
              <p className="text-sm font-medium">{t('reservationMode')}</p>
              <p className="text-xs text-muted-foreground">{t('reservationModeHint')}</p>
            </div>
            <Switch
              checked={reservationMode}
              onCheckedChange={setReservationMode}
              data-testid="switch-reservation-mode"
            />
          </div>

          <div className="space-y-4">
            <FormField control={form.control} name="checkIn" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('checkIn')} *</FormLabel>
                <FormControl><Input type="date" {...field} data-testid="input-check-in" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            {reservationMode && (
              <FormField control={form.control} name="expectedCheckOut" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('expectedCheckOut')}</FormLabel>
                  <FormControl><Input type="date" {...field} data-testid="input-expected-check-out" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            )}
            <FormField control={form.control} name="roomType" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('roomTypeLabel')}</FormLabel>
                <FormControl><Input placeholder="e.g. Small cage, VIP room" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="dailyFee" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('dailyFee')}</FormLabel>
                <FormControl><Input type="number" min="0" placeholder="0" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('notes')}</FormLabel>
                <FormControl><Textarea rows={2} placeholder="..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          <Button type="submit" className="w-full" disabled={createBooking.isPending} data-testid="btn-submit">
            {createBooking.isPending
              ? t('saving')
              : reservationMode
                ? t('reservationMode')
                : t('checkIn')
            }
          </Button>
        </form>
      </Form>
    </AppShell>
  )
}
