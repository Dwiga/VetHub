import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
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
import { useToast } from '@/hooks/use-toast'
import { useLang } from '@/contexts/LangContext'
import { Separator } from '@/components/ui/separator'

export const Route = createFileRoute('/hotel/new')({
  component: HotelNewGuestPage,
})

const schema = z.object({
  guestName: z.string().min(1),
  guestPhone: z.string().optional(),
  petNameRaw: z.string().min(1),
  petTypeRaw: z.string().optional(),
  checkIn: z.string().min(1),
  deposit: z.string().optional(),
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

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      guestName: '',
      guestPhone: '',
      petNameRaw: '',
      petTypeRaw: '',
      checkIn: '',
      deposit: '',
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
          guestName: values.guestName,
          guestPhone: values.guestPhone || undefined,
          petNameRaw: values.petNameRaw,
          petTypeRaw: values.petTypeRaw || undefined,
          checkIn: values.checkIn,
          deposit: values.deposit ? String(values.deposit) : undefined,
          roomType: values.roomType || undefined,
          dailyFee: values.dailyFee ? parseFloat(values.dailyFee) : undefined,
          notes: values.notes || undefined,
        },
      })
      toast({ title: t('guestCheckedIn') })
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
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-3">{t('guestName')}</p>
            <div className="space-y-4">
              <FormField control={form.control} name="guestName" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('guestName')} *</FormLabel>
                  <FormControl><Input placeholder="Budi Santoso" {...field} data-testid="input-guest-name" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="guestPhone" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('guestPhone')}</FormLabel>
                  <FormControl><Input type="tel" placeholder="08xx-xxxx-xxxx" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-3">{t('petNameRaw')}</p>
            <div className="space-y-4">
              <FormField control={form.control} name="petNameRaw" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('petNameRaw')} *</FormLabel>
                  <FormControl><Input placeholder="Mochi" {...field} data-testid="input-pet-name" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="petTypeRaw" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('petTypeRaw')}</FormLabel>
                  <FormControl><Input placeholder="Kucing Persia" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <FormField control={form.control} name="checkIn" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('checkIn')} *</FormLabel>
                <FormControl><Input type="date" {...field} data-testid="input-check-in" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="deposit" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('depositLabel')}</FormLabel>
                <FormControl><Input type="number" min="0" placeholder="0" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
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
            {createBooking.isPending ? t('checkingIn') : t('checkIn')}
          </Button>
        </form>
      </Form>
    </AppShell>
  )
}
