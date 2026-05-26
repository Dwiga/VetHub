import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/shared/PageHeader'
import { useAddPetForOwner, useListSpecies } from '@/lib/api-client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useLang } from '@/contexts/LangContext'

export const Route = createFileRoute('/hotel/add-pet')({
  component: AddPetForOwnerPage,
  validateSearch: (search: Record<string, string>) => ({
    phone: search.phone ?? '',
  }),
})

const schema = z.object({
  ownerPhone: z.string().min(1, 'Owner phone is required'),
  name: z.string().min(1, 'Pet name is required'),
  speciesId: z.string().min(1, 'Species is required'),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'unknown']),
  sterilized: z.boolean(),
  color: z.string().optional(),
})

function AddPetForOwnerPage() {
  const { phone: initialPhone } = Route.useSearch()
  const addPet = useAddPetForOwner()
  const species = useListSpecies()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { t } = useLang()

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { ownerPhone: initialPhone, name: '', speciesId: '', dateOfBirth: '', gender: 'unknown', sterilized: false, color: '' },
  })

  async function onSubmit(values: z.infer<typeof schema>) {
    const pet = await addPet.mutateAsync({
      data: {
        ownerPhone: values.ownerPhone,
        name: values.name,
        speciesId: parseInt(values.speciesId),
        dateOfBirth: values.dateOfBirth || undefined,
        gender: values.gender,
        sterilized: values.sterilized,
        color: values.color || undefined,
      },
    })
    toast({ title: `${(pet as any).name} registered` })
    navigate({ to: '/hotel/search', search: { q: values.ownerPhone } })
  }

  return (
    <AppShell>
      <PageHeader title={t('addPetForOwner') || 'Add pet for owner'} back backHref="/hotel/search" />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField control={form.control} name="ownerPhone" render={({ field }) => (
            <FormItem>
              <FormLabel>{t('ownerPhone') || 'Owner phone number'}</FormLabel>
              <FormControl><Input {...field} placeholder="+62 812..." data-testid="input-owner-phone" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel>{t('petName')}</FormLabel>
              <FormControl><Input {...field} data-testid="input-pet-name" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="speciesId" render={({ field }) => (
            <FormItem>
              <FormLabel>{t('species')}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-species"><SelectValue placeholder={t('selectSpecies')} /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(species.data ?? []).map((s: any) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="gender" render={({ field }) => (
            <FormItem>
              <FormLabel>{t('gender')}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-gender"><SelectValue /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="male">{t('male')}</SelectItem>
                  <SelectItem value="female">{t('female')}</SelectItem>
                  <SelectItem value="unknown">{t('unknown')}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="dateOfBirth" render={({ field }) => (
            <FormItem>
              <FormLabel>{t('dateOfBirth')}</FormLabel>
              <FormControl><Input type="date" {...field} data-testid="input-dob" /></FormControl>
            </FormItem>
          )} />
          <FormField control={form.control} name="color" render={({ field }) => (
            <FormItem>
              <FormLabel>{t('colorMarkings')}</FormLabel>
              <FormControl><Input {...field} data-testid="input-color" /></FormControl>
            </FormItem>
          )} />
          <Button type="submit" className="w-full" disabled={addPet.isPending} data-testid="btn-submit">
            {addPet.isPending ? t('addingPet') : t('addPetTitle')}
          </Button>
        </form>
      </Form>
    </AppShell>
  )
}
