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
          where: { id },
          include: { species: true, owner: { select: { id: true, name: true, phone: true } } },
        })
        if (!pet) {
          return Response.json({ error: 'not found' }, { status: 404 })
        }
        return Response.json(pet)
      },
      PATCH: async ({ request, params }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) {
          return Response.json({ error: 'unauthorized' }, { status: 401 })
        }
        const id = Number(params.petId)
        const pet = await prisma.pet.findFirst({
          where: { id },
        })
        if (!pet) {
          return Response.json({ error: 'not found' }, { status: 404 })
        }

        // Allow if: pet owner OR clinic/hotel staff
        const isOwner = pet.ownerId === user.id
        const isStaff = !!user.clinicId || !!user.hotelId
        if (!isOwner && !isStaff) {
          return Response.json({ error: 'forbidden' }, { status: 403 })
        }

        const body = await request.json()
        const updated = await prisma.pet.update({
          where: { id },
          data: body,
        })
        return Response.json(updated)
      },
    },
  },
})
