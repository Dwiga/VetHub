import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/shared/PageHeader'
import { useGetPet, useGetMe, useCreateVisit } from '@/lib/api-client'
import { useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { useLang } from '@/contexts/LangContext'

export const Route = createFileRoute('/vet/visits/new/$petId')({
  component: NewVisitPage,
})

const schema = z.object({
  type: z.enum(['inpatient', 'outpatient']),
  visitDate: z.string().min(1),
  anamnesis: z.string().optional(),
  therapy: z.string().optional(),
})

function NewVisitPage() {
  const { petId } = Route.useParams()
  const id = parseInt(petId)
  const pet = useGetPet(id)
  const me = useGetMe()
  const createVisit = useCreateVisit()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { t } = useLang()

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'outpatient',
      visitDate: new Date().toISOString().split('T')[0],
      anamnesis: '',
      therapy: '',
    },
  })

  async function onSubmit(values: z.infer<typeof schema>) {
    const clinicId = me.data?.clinicId
    if (!clinicId) {
      toast({ title: t('noClinicAssigned'), variant: 'destructive' })
      return
    }
    try {
      const visit = await createVisit.mutateAsync({
        petId: id,
        data: {
          clinicId,
          vetId: me.data?.id ?? undefined,
          type: values.type,
          visitDate: values.visitDate,
          anamnesis: values.anamnesis || undefined,
          therapy: values.therapy || undefined,
        },
      })
      queryClient.invalidateQueries({ queryKey: ['visits', 'pet', id] })
      toast({ title: t('visitSaved') })
      navigate({ to: '/vet/visits/$visitId', params: { visitId: String((visit as any).id) } })
    } catch {
      toast({ title: t('errorCreatingVisit') || 'Failed to create visit', variant: 'destructive' })
    }
  }

  const p = pet.data

  return (
    <AppShell>
      <PageHeader
        title={t('newVisit')}
        subtitle={p ? `${p.name} — ${p.species?.name}` : '...'}
        back
      />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField control={form.control} name="type" render={({ field }) => (
            <FormItem>
              <FormLabel>{t('visitType')}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger data-testid="select-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="outpatient">{t('outpatient')}</SelectItem>
                  <SelectItem value="inpatient">{t('inpatient')}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="visitDate" render={({ field }) => (
            <FormItem>
              <FormLabel>{t('visitDate')}</FormLabel>
              <FormControl><Input type="date" {...field} data-testid="input-date" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="anamnesis" render={({ field }) => (
            <FormItem>
              <FormLabel>{t('anamnesis')}</FormLabel>
              <FormControl><Textarea {...field} rows={3} placeholder={t('anamnesisPlaceholder')} data-testid="input-anamnesis" /></FormControl>
            </FormItem>
          )} />
          <FormField control={form.control} name="therapy" render={({ field }) => (
            <FormItem>
              <FormLabel>{t('initialTherapy')}</FormLabel>
              <FormControl><Textarea {...field} rows={3} placeholder={t('therapyPlaceholder')} data-testid="input-therapy" /></FormControl>
            </FormItem>
          )} />
          <Button type="submit" className="w-full" disabled={createVisit.isPending || me.isLoading} data-testid="btn-submit">
            {createVisit.isPending ? t('creatingVisit') : t('createVisit')}
          </Button>
        </form>
      </Form>
    </AppShell>
  )
}
