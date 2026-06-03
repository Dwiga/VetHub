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
        const pet = await prisma.pet.findFirst({ where: { id: petId } })
        if (!pet) {
          return Response.json({ error: 'not found' }, { status: 404 })
        }
        // Allow if: pet owner OR clinic staff (vet)
        if (pet.ownerId !== user.id && !user.clinicId) {
          return Response.json({ error: 'forbidden' }, { status: 403 })
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
        const pet = await prisma.pet.findFirst({ where: { id: petId } })
        if (!pet) {
          return Response.json({ error: 'not found' }, { status: 404 })
        }
        // Allow if: pet owner OR clinic staff (vet)
        if (pet.ownerId !== user.id && !user.clinicId) {
          return Response.json({ error: 'forbidden' }, { status: 403 })
        }

        const body = await request.json()
        const isVet = !!(user.clinicId)

        // Pet owners can only add basic info (no cost, batch, vet details)
        const ownerFields = {
          vaccineName: body.vaccineName,
          brand: body.brand || null,
          date: body.date,
          nextDueDate: body.nextDueDate || null,
          notes: body.notes || null,
        }

        const vetFields = {
          ...ownerFields,
          batchNumber: body.batchNumber || null,
          administeredBy: body.administeredBy || user.name || null,
          cost: body.cost || null,
          vetId: user.id,
        }

        const data = isVet ? vetFields : ownerFields

        const vaccination = await prisma.vaccination.create({
          data: {
            ...data,
            petId,
          },
        })
        return Response.json(vaccination)
      },
    },
  },
})
