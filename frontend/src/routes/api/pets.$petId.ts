import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '@/lib/db'
import { getOrCreateLocalUser } from '@/lib/clerk-server'

export const Route = createFileRoute('/api/pets/$petId')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) {
          return Response.json({ error: 'unauthorized' }, { status: 401 })
        }
        const id = Number(params.petId)
        if (!Number.isFinite(id)) {
          return Response.json({ error: 'invalid id' }, { status: 400 })
        }
        const pet = await prisma.pet.findFirst({
          where: { id, ownerId: user.id },
          include: { species: true },
        })
        if (!pet) {
          return Response.json({ error: 'not found' }, { status: 404 })
        }
        return Response.json(pet)
      },
    },
  },
})
