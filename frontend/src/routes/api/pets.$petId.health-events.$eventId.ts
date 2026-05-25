import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '@/lib/db'
import { getOrCreateLocalUser } from '@/lib/clerk-server'

export const Route = createFileRoute('/api/pets/$petId/health-events/$eventId')({
  server: {
    handlers: {
      DELETE: async ({ request, params }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) {
          return Response.json({ error: 'unauthorized' }, { status: 401 })
        }
        const petId = Number(params.petId)
        const eventId = Number(params.eventId)
        
        const pet = await prisma.pet.findFirst({
          where: { id: petId, ownerId: user.id },
        })
        if (!pet) {
          return Response.json({ error: 'not found' }, { status: 404 })
        }

        await prisma.healthEvent.delete({
          where: { id: eventId, petId },
        })
        return new Response(null, { status: 204 })
      },
    },
  },
})
