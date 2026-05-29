import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '@/lib/db'
import { getOrCreateLocalUser } from '@/lib/clerk-server'

export const Route = createFileRoute('/api/clinic/$clinicId/reports/stats')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })
        const clinicId = Number(params.clinicId)
        const url = new URL(request.url)
        const period = url.searchParams.get('period') ?? 'monthly'
        const date = url.searchParams.get('date') ?? new Date().toISOString().split('T')[0]
        const startDate = url.searchParams.get('startDate') ?? null
        const endDate = url.searchParams.get('endDate') ?? null

        let where: Record<string, unknown> = { clinicId }
        if (startDate || endDate) {
          const from = startDate || '1970-01-01'
          const to = endDate || '2099-12-31'
          where.visitDate = { gte: from, lte: to }
        }

        const visits = await prisma.visit.findMany({
          where,
          orderBy: { visitDate: 'asc' },
          include: { dailyReports: true },
        })

        const dateMap = new Map<string, { visits: number; revenue: number }>()
        for (const v of visits) {
          const key = v.visitDate ? v.visitDate.substring(0, 7) : 'unknown'
          if (!dateMap.has(key)) dateMap.set(key, { visits: 0, revenue: 0 })
          dateMap.get(key)!.visits++
        }
        // Revenue from deposit entries in daily reports
        for (const v of visits) {
          if (!v.dailyReports) continue
          for (const r of v.dailyReports) {
            if (r.type === 'deposit') {
              const key = r.reportDate ? r.reportDate.substring(0, 7) : 'unknown'
              if (!dateMap.has(key)) dateMap.set(key, { visits: 0, revenue: 0 })
              dateMap.get(key)!.revenue += parseFloat(r.amount || '0')
            }
          }
        }

        const sortedLabels = [...dateMap.keys()].sort()
        const labels: string[] = []
        const visitCounts: number[] = []
        const revenues: number[] = []
        for (const label of sortedLabels) {
          const d = dateMap.get(label)!
          labels.push(label)
          visitCounts.push(d.visits)
          revenues.push(d.revenue)
        }

        return Response.json({ labels, visitCounts, revenues })
      },
    },
  },
})
