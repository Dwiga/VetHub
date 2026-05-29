import { createFileRoute } from '@tanstack/react-router'
import { Phone } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useUpdateMe } from '@/lib/api-client'
import { useAuth } from '@/lib/auth'
import { useQueryClient } from '@tanstack/react-query'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useNavigate } from '@tanstack/react-router'
import { useLang } from '@/contexts/LangContext'
import { normalizePhone } from '@/lib/phone'
import { useState, useEffect, useCallback } from 'react'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z
    .string()
    .min(9, 'Phone number is too short')
    .regex(/^[0-9+\-\s()]+$/, 'Invalid phone number'),
})

export const Route = createFileRoute('/onboarding/')({
  component: OnboardingPage,
})

function OnboardingPage() {
  const { isSignedIn } = useAuth()
  const updateMe = useUpdateMe()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const navigate = useNavigate()
  const { t } = useLang()

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      phone: '',
    },
  })

  const [phoneError, setPhoneError] = useState<string | null>(null)

  // Check phone uniqueness on blur
  const handlePhoneBlur = useCallback(() => {
    const raw = form.getValues('phone')
    if (!raw || raw.replace(/[\s\-().]/g, '').length < 9) return
    const normalized = normalizePhone(raw)
    ;(async () => {
      try {
        const res = await fetch(`/api/users/phone-check?phone=${encodeURIComponent(normalized)}`, {
          credentials: 'include',
        })
        if (res.ok) {
          const data = await res.json()
          if (data.exists) {
            setPhoneError(t('phoneAlreadyUsed'))
            form.setError('phone', { message: t('phoneAlreadyUsed') })
          } else {
            setPhoneError(null)
            if (form.formState.errors.phone?.message === t('phoneAlreadyUsed')) {
              form.clearErrors('phone')
            }
          }
        }
      } catch {
        // ignore — don't block if check fails
      }
    })()
  }, [form, t])

  async function onSubmit(values: z.infer<typeof schema>) {
    try {
      await updateMe.mutateAsync({
        data: { name: values.name, phone: normalizePhone(values.phone) },
      })
      await queryClient.invalidateQueries({ queryKey: ['me'] })
      navigate({ to: '/dashboard' })
    } catch (e: any) {
      toast({ title: 'Something went wrong', variant: 'destructive' })
      const msg = e.response?.data?.error || e.message || 'Failed to update profile'
      form.setError('root', { message: msg })
    }
  }

  // Redirect unauthenticated users
  useEffect(() => {
    if (isSignedIn === false) {
      navigate({ to: '/sign-in/$', params: { _splat: '' } })
    }
  }, [isSignedIn, navigate])

  if (isSignedIn === false) {
    return null
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Phone className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('onboardingTitle')}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t('onboardingSubtitle')}
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('yourName')}</FormLabel>
                  <FormControl>
                    <Input {...field} autoComplete="name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('yourPhone')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="tel"
                      placeholder="+62 812 3456 7890"
                      autoComplete="tel"
                      onBlur={handlePhoneBlur}
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">
                    Include country code, e.g. +62 for Indonesia.
                  </p>
                  {phoneError && (
                    <p className="text-xs font-medium text-destructive">{phoneError}</p>
                  )}
                </FormItem>
              )}
            />
            {form.formState.errors.root && (
              <p className="text-sm font-medium text-destructive">
                {form.formState.errors.root.message}
              </p>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={updateMe.isPending}
            >
              {updateMe.isPending ? t('gettingStarted') : t('getStarted')}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  )
}
