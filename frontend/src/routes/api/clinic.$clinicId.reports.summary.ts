import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '@/lib/db'
import { getOrCreateLocalUser } from '@/lib/clerk-server'

export const Route = createFileRoute('/api/clinic/$clinicId/reports/summary')({
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
          include: { dailyReports: true },
        })
        const totalVisits = visits.length
        const inpatientVisits = visits.filter(v => v.type === 'inpatient').length
        const outpatientVisits = visits.filter(v => v.type === 'outpatient').length

        // Revenue from deposit entries in daily reports
        const totalRevenue = visits.reduce((s, v) => {
          const deposits = (v.dailyReports || [])
            .filter(r => r.type === 'deposit')
            .reduce((sum, r) => sum + (parseFloat(r.amount || '0')), 0)
          return s + deposits
        }, 0)

        const completedInpatient = visits.filter(v => v.type === 'inpatient' && v.status === 'completed')
        const survivedCount = completedInpatient.length
        const diedCount = 0
        const earlyDischargeCount = visits.filter(v => v.status === 'cancelled').length

        return Response.json({
          totalRevenue,
          totalVisits,
          inpatientVisits,
          outpatientVisits,
          survivedCount,
          diedCount,
          earlyDischargeCount,
          topServices: [],
        })
      },
    },
  },
})
