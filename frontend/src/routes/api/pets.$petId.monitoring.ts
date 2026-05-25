import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '@/lib/db'
import { getOrCreateLocalUser } from '@/lib/clerk-server'

export const Route = createFileRoute('/api/pets/$petId/monitoring')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) {
          return Response.json({ error: 'unauthorized' }, { status: 401 })
        }
        const petId = Number(params.petId)
        // Verify ownership
        const pet = await prisma.pet.findFirst({
          where: { id: petId, ownerId: user.id },
        })
        if (!pet) {
          return Response.json({ error: 'not found' }, { status: 404 })
        }

        const monitoring = await prisma.monitoring.findMany({
          where: { petId },
          orderBy: { recordedAt: 'desc' },
        })
        return Response.json(monitoring)
      },
      POST: async ({ request, params }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) {
          return Response.json({ error: 'unauthorized' }, { status: 401 })
        }
        const petId = Number(params.petId)
        const pet = await prisma.pet.findFirst({
          where: { id: petId, ownerId: user.id },
        })
        if (!pet) {
          return Response.json({ error: 'not found' }, { status: 404 })
        }

        const body = await request.json()
        const record = await prisma.monitoring.create({
          data: {
            ...body,
            petId,
          },
        })
        return Response.json(record)
      },
    },
  },
})
