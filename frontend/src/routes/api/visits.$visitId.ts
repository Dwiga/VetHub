import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '@/lib/db'
import { getOrCreateLocalUser } from '@/lib/clerk-server'

export const Route = createFileRoute('/api/visits/$visitId')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })
        const id = Number(params.visitId)
        const visit = await prisma.visit.findFirst({
          where: { id },
          include: {
            items: true,
            dailyReports: { orderBy: { reportDate: 'desc' } },
          },
        })
        if (!visit) return Response.json({ error: 'not found' }, { status: 404 })
        return Response.json(visit)
      },
      PATCH: async ({ request, params }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })
        const id = Number(params.visitId)
        const body = await request.json()
        const updated = await prisma.visit.update({
          where: { id },
          data: body,
        })
        return Response.json(updated)
      },
    },
  },
})
