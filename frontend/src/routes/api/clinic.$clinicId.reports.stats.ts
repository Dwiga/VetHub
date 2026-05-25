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

        const visits = await prisma.visit.findMany({
          where: { clinicId },
          orderBy: { visitDate: 'asc' },
        })
        const items = await prisma.visitItem.findMany({
          where: { visit: { clinicId } },
        })

        const dateMap = new Map<string, { visits: number; revenue: number }>()
        for (const v of visits) {
          const key = v.visitDate ? v.visitDate.substring(0, 7) : 'unknown'
          if (!dateMap.has(key)) dateMap.set(key, { visits: 0, revenue: 0 })
          dateMap.get(key)!.visits++
        }
        for (const item of items) {
          const key = item.itemDate ? item.itemDate.substring(0, 7) : 'unknown'
          if (!dateMap.has(key)) dateMap.set(key, { visits: 0, revenue: 0 })
          dateMap.get(key)!.revenue += parseFloat(item.quantity || '1') * parseFloat(item.unitPrice || '0')
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
