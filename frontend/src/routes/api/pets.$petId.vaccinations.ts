import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '@/lib/db'
import { getOrCreateLocalUser } from '@/lib/clerk-server'

export const Route = createFileRoute('/api/pets/$petId/vaccinations')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
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

        const vaccinations = await prisma.vaccination.findMany({
          where: { petId },
          orderBy: { date: 'desc' },
        })
        return Response.json(vaccinations)
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
        const vaccination = await prisma.vaccination.create({
          data: {
            ...body,
            petId,
          },
        })
        return Response.json(vaccination)
      },
    },
  },
})
