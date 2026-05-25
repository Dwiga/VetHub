import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '@/lib/db'
import { getOrCreateLocalUser } from '@/lib/clerk-server'

export const Route = createFileRoute('/api/visits')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) {
          return Response.json({ error: 'unauthorized' }, { status: 401 })
        }
        const url = new URL(request.url)
        const status = url.searchParams.get('status') ?? undefined
        const petId = url.searchParams.get('petId') ?? undefined

        // Pet owners see visits of their own pets; vets see visits of their clinic.
        const where: Record<string, any> = {}
        if (status) where.status = status
        if (petId) where.petId = Number(petId)

        if (user.clinicId) {
          where.clinicId = user.clinicId
        } else {
          // restrict to owner's pets
          const ownedPets = await prisma.pet.findMany({
            where: { ownerId: user.id },
            select: { id: true },
          })
          const ownedPetIds = ownedPets.map((p) => p.id)
          
          if (petId) {
            if (!ownedPetIds.includes(Number(petId))) {
               return Response.json({ error: 'forbidden' }, { status: 403 })
            }
          } else {
            where.petId = { in: ownedPetIds }
          }
        }

        const visits = await prisma.visit.findMany({
          where,
          orderBy: { createdAt: 'desc' },
        })
        return Response.json(visits)
      },
      POST: async ({ request }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })
        const url = new URL(request.url)
        const petId = Number(url.searchParams.get('petId'))
        const body = await request.json()
        const visit = await prisma.visit.create({
          data: {
            petId,
            clinicId: body.clinicId ?? user.clinicId,
            vetId: body.vetId,
            type: body.type,
            status: body.status ?? 'active',
            visitDate: body.visitDate,
            anamnesis: body.anamnesis,
            therapy: body.therapy,
          },
        })
        return Response.json(visit, { status: 201 })
      },
    },
  },
})
