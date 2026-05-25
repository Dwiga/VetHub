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

        const visits = await prisma.visit.findMany({ where: { clinicId } })
        const totalVisits = visits.length
        const inpatientVisits = visits.filter(v => v.type === 'inpatient').length
        const outpatientVisits = visits.filter(v => v.type === 'outpatient').length

        const items = await prisma.visitItem.findMany({
          where: { visit: { clinicId } },
        })
        const totalRevenue = items.reduce((s, i) => s + (parseFloat(i.quantity || '1') * parseFloat(i.unitPrice || '0')), 0)

        const completedInpatient = visits.filter(v => v.type === 'inpatient' && v.status === 'completed')
        const survivedCount = completedInpatient.length
        const diedCount = visits.filter(v => v.status === 'completed' && v.type === 'inpatient' && false).length
        const earlyDischargeCount = visits.filter(v => v.status === 'cancelled').length

        const serviceMap = new Map<string, { count: number; revenue: number }>()
        for (const item of items) {
          const key = item.name
          const rev = parseFloat(item.quantity || '1') * parseFloat(item.unitPrice || '0')
          if (serviceMap.has(key)) {
            const existing = serviceMap.get(key)!
            existing.count++
            existing.revenue += rev
          } else {
            serviceMap.set(key, { count: 1, revenue: rev })
          }
        }
        const topServices = [...serviceMap.entries()]
          .map(([name, v]) => ({ name, count: v.count, revenue: v.revenue }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 10)

        return Response.json({
          totalRevenue,
          totalVisits,
          inpatientVisits,
          outpatientVisits,
          survivedCount,
          diedCount,
          earlyDischargeCount,
          averageRevenuePerVisit: totalVisits > 0 ? totalRevenue / totalVisits : 0,
          topServices,
        })
      },
    },
  },
})
