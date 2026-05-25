import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '@/lib/db'
import { getOrCreateLocalUser } from '@/lib/clerk-server'

export const Route = createFileRoute('/api/visits/$visitId/daily-reports')({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })
        const visitId = Number(params.visitId)
        const body = await request.json()
        const report = await prisma.dailyReport.create({
          data: {
            visitId,
            reportDate: body.reportDate,
            condition: body.condition,
            treatment: body.treatment,
            notes: body.notes,
            cost: body.cost ?? 0,
          },
        })
        return Response.json(report, { status: 201 })
      },
    },
  },
})
