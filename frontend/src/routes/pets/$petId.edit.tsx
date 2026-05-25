import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/shared/PageHeader'
import { useGetPet, useUpdatePet, useListSpecies } from '@/lib/api-client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEffect } from 'react'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { useLang } from '@/contexts/LangContext'

const schema = z.object({
  name: z.string().min(1),
  speciesId: z.string().min(1),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'unknown']),
  sterilized: z.boolean(),
  color: z.string().optional(),
  status: z.enum([
    'healthy',
    'sick',
    'hospitalized',
    'need_intensive_care',
    'passed_away',
  ]),
})

export const Route = createFileRoute('/pets/$petId/edit')({
  component: EditPetPage,
})

function EditPetPage() {
  const { petId } = Route.useParams()
  const id = Number(petId)
  const pet = useGetPet(id)
  const updatePet = useUpdatePet()
  const species = useListSpecies()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { t } = useLang()

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
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
    if (pet.data) {
      form.reset({
        name: pet.data.name,
        speciesId: String(pet.data.speciesId),
        dateOfBirth: pet.data.dateOfBirth ?? '',
        gender: (pet.data.gender as 'male' | 'female' | 'unknown') ?? 'unknown',
        sterilized: pet.data.sterilized ?? false,
        color: pet.data.color ?? '',
        status: (pet.data.status as z.infer<typeof schema>['status']) ?? 'healthy',
      })
    }
  }, [pet.data, form])

  async function onSubmit(values: z.infer<typeof schema>) {
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
    navigate({ to: '/pets/$petId', params: { petId } })
  }

  const isPending = updatePet.isPending

  const petStatuses = [
    { value: 'healthy', label: t('statusHealthy') },
    { value: 'sick', label: t('statusSick') },
    { value: 'hospitalized', label: t('statusHospitalized') },
    { value: 'need_intensive_care', label: t('statusNeedsCare') },
    { value: 'passed_away', label: t('statusPassedAway') },
  ] as const

  return (
    <AppShell>
      <PageHeader
        title={t('editPetTitle')}
        back
        backHref="/pets/$petId"
        backParams={{ petId }}
      />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
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
            control={form.control}
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
                    {(species.data ?? []).map((s) => (
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
            control={form.control}
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
                    {petStatuses.map((s) => (
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
            control={form.control}
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
            control={form.control}
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
            control={form.control}
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
            control={form.control}
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
            disabled={isPending}
            data-testid="btn-submit"
          >
            {isPending ? t('saving') : t('save')}
          </Button>
        </form>
      </Form>
    </AppShell>
  )
}
