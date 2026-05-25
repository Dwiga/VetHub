import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '@/lib/db'
import { getOrCreateLocalUser } from '@/lib/clerk-server'

export const Route = createFileRoute('/api/pets')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) {
          return Response.json({ error: 'unauthorized' }, { status: 401 })
        }
        const pets = await prisma.pet.findMany({
          where: { ownerId: user.id },
          orderBy: { createdAt: 'desc' },
          include: { species: true },
        })
        return Response.json(pets)
      },
      POST: async ({ request }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) {
          return Response.json({ error: 'unauthorized' }, { status: 401 })
        }
        const body = await request.json()
        const pet = await prisma.pet.create({
          data: {
            ...body,
            ownerId: user.id,
          },
        })
        return Response.json(pet)
      },
    },
  },
})
