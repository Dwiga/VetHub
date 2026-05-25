import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '@/lib/db'
import { getOrCreateLocalUser } from '@/lib/clerk-server'

export const Route = createFileRoute('/api/daily-reports/$reportId')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })
        const id = Number(params.reportId)
        const report = await prisma.dailyReport.findUnique({ where: { id } })
        if (!report) return Response.json({ error: 'not found' }, { status: 404 })
        return Response.json(report)
      },
      PATCH: async ({ request, params }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })
        const id = Number(params.reportId)
        const body = await request.json()
        const updated = await prisma.dailyReport.update({ where: { id }, data: body })
        return Response.json(updated)
      },
    },
  },
})
