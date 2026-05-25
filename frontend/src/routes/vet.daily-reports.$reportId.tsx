import { createFileRoute } from '@tanstack/react-router'
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
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

export const Route = createFileRoute('/vet/daily-reports/$reportId')({
  component: DailyReportPage,
})

const schema = z.object({
  condition: z.string().optional(),
  treatment: z.string().optional(),
  notes: z.string().optional(),
  cost: z.string().optional(),
})

function DailyReportPage() {
  const { reportId } = Route.useParams()
  const id = parseInt(reportId)
  const report = useGetDailyReport(id)
  const updateReport = useUpdateDailyReport()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { condition: '', treatment: '', notes: '', cost: '0' },
  })

  useEffect(() => {
    if (report.data) {
      form.reset({
        condition: report.data.condition ?? '',
        treatment: report.data.treatment ?? '',
        notes: report.data.notes ?? '',
        cost: String(report.data.cost ?? 0),
      })
    }
  }, [report.data])

  async function onSubmit(values: z.infer<typeof schema>) {
    await updateReport.mutateAsync({
      reportId: id,
      data: {
        condition: values.condition,
        treatment: values.treatment,
        notes: values.notes,
        cost: values.cost ? parseFloat(values.cost) : 0,
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
          <FormField control={form.control} name="condition" render={({ field }) => (
            <FormItem>
              <FormLabel>Condition</FormLabel>
              <FormControl><Textarea {...field} rows={3} placeholder="Patient's condition..." data-testid="input-condition" /></FormControl>
            </FormItem>
          )} />
          <FormField control={form.control} name="treatment" render={({ field }) => (
            <FormItem>
              <FormLabel>Treatment</FormLabel>
              <FormControl><Textarea {...field} rows={3} placeholder="Treatments administered..." data-testid="input-treatment" /></FormControl>
            </FormItem>
          )} />
          <FormField control={form.control} name="notes" render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl><Textarea {...field} rows={3} data-testid="input-notes" /></FormControl>
            </FormItem>
          )} />
          <FormField control={form.control} name="cost" render={({ field }) => (
            <FormItem>
              <FormLabel>Cost (Rp)</FormLabel>
              <FormControl><Input type="number" min="0" {...field} data-testid="input-cost" /></FormControl>
            </FormItem>
          )} />
          <Button type="submit" className="w-full" disabled={updateReport.isPending} data-testid="btn-save">
            {updateReport.isPending ? 'Saving...' : 'Save report'}
          </Button>
        </form>
      </Form>
    </AppShell>
  )
}
