import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '@/lib/db'
import { getOrCreateLocalUser } from '@/lib/clerk-server'

export const Route = createFileRoute('/api/visits/$visitId/share')({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })
        const visitId = Number(params.visitId)
        const visit = await prisma.visit.findUnique({
          where: { id: visitId },
          include: { pet: { include: { species: true, owner: true } } },
        })
        if (!visit) return Response.json({ error: 'not found' }, { status: 404 })
        const shareUrl = `${request.headers.get('origin') || ''}/pets/${visit.petId}?visit=${visitId}`
        return Response.json({ shareUrl })
      },
    },
  },
})
