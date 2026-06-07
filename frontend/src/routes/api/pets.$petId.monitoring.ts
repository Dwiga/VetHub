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
        const pet = await prisma.pet.findFirst({
          where: { id: petId },
        })
        if (!pet) {
          return Response.json({ error: 'not found' }, { status: 404 })
        }
        if (pet.ownerId !== user.id && !user.isVet) {
          return Response.json({ error: 'not found' }, { status: 404 })
        }

        const records = await prisma.monitoring.findMany({
          where: { petId },
          orderBy: { recordedAt: 'desc' },
          take: 10,
        })
        return Response.json(records)
      },
      POST: async ({ request, params }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) {
          return Response.json({ error: 'unauthorized' }, { status: 401 })
        }
        const petId = Number(params.petId)
        const pet = await prisma.pet.findFirst({
          where: { id: petId },
        })
        if (!pet) {
          return Response.json({ error: 'not found' }, { status: 404 })
        }
        if (pet.ownerId !== user.id && !user.isVet) {
          return Response.json({ error: 'not found' }, { status: 404 })
        }

        const body = await request.json()
        const { weight, height, temperature, notes } = body

        const record = await prisma.monitoring.create({
          data: {
            petId,
            weight: weight !== undefined ? weight : undefined,
            height: height !== undefined ? height : undefined,
            temperature: temperature !== undefined ? temperature : undefined,
            notes: notes || undefined,
            recordedBy: user.name ?? user.email ?? user.clerkId,
          },
        })
        return Response.json(record)
      },
    },
  },
})
