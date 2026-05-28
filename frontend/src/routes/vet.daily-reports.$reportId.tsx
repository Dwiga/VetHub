import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/shared/PageHeader'
import { useGetDailyReport, useUpdateDailyReport } from '@/lib/api-client'
import { useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEffect } from 'react'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useLang } from '@/contexts/LangContext'

export const Route = createFileRoute('/vet/daily-reports/$reportId')({
  component: DailyReportPage,
})

const schema = z.object({
  type: z.enum(['deposit', 'credit']),
  description: z.string().optional(),
  amount: z.string().optional(),
  reportDate: z.string().min(1),
})

function DailyReportPage() {
  const { reportId } = Route.useParams()
  const id = parseInt(reportId)
  const report = useGetDailyReport(id)
  const updateReport = useUpdateDailyReport()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { t } = useLang()
  const navigate = useNavigate()

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'credit', description: '', amount: '', reportDate: '' },
  })

  useEffect(() => {
    if (report.data) {
      form.reset({
        type: report.data.type ?? 'credit',
        description: report.data.description ?? '',
        amount: String(report.data.amount ?? 0),
        reportDate: report.data.reportDate ?? '',
      })
    }
  }, [report.data])

  async function onSubmit(values: z.infer<typeof schema>) {
    await updateReport.mutateAsync({
      reportId: id,
      data: {
        type: values.type,
        description: values.description || undefined,
        amount: values.amount ? parseFloat(values.amount) : 0,
        reportDate: values.reportDate,
      },
    })
    queryClient.invalidateQueries({ queryKey: ['daily-reports', id] })
    toast({ title: 'Report updated' })
  }

  const r = report.data

  return (
    <AppShell>
      <PageHeader title={`Daily report — ${r?.reportDate ?? '...'}`} back />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField control={form.control} name="type" render={({ field }) => (
            <FormItem>
              <FormLabel>{t('type') || 'Type'}</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deposit">{t('depositType') || 'Deposit (payment)'}</SelectItem>
                  <SelectItem value="credit">{t('creditType') || 'Credit (expense)'}</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )} />
          <FormField control={form.control} name="description" render={({ field }) => (
            <FormItem>
              <FormLabel>{t('description') || 'Description'}</FormLabel>
              <FormControl><Input {...field} placeholder="e.g. Food, Medicine, Deposit" /></FormControl>
            </FormItem>
          )} />
          <FormField control={form.control} name="amount" render={({ field }) => (
            <FormItem>
              <FormLabel>{t('amount') || 'Amount (Rp)'}</FormLabel>
              <FormControl><Input type="number" min="0" {...field} /></FormControl>
            </FormItem>
          )} />
          <FormField control={form.control} name="reportDate" render={({ field }) => (
            <FormItem>
              <FormLabel>{t('logDate') || 'Report date'} *</FormLabel>
              <FormControl><Input type="date" {...field} required /></FormControl>
            </FormItem>
          )} />
          <Button type="submit" className="w-full" disabled={updateReport.isPending}>
            {updateReport.isPending ? 'Saving...' : 'Save report'}
          </Button>
        </form>
      </Form>
    </AppShell>
  )
}
