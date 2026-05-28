import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '@/lib/db'
import { getOrCreateLocalUser } from '@/lib/clerk-server'
import { normalizePhone } from '@/lib/phone'

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

        // Determine the pet ownerId.
        // If ownerPhone is provided (hotel staff adding a pet for a walk-in owner),
        // look up the owner by phone. If not found, create a placeholder user.
        let ownerId = user.id
        if (body.ownerPhone) {
          const normalizedPhone = normalizePhone(body.ownerPhone)
          const existingOwner = await prisma.user.findFirst({
            where: { phone: normalizedPhone },
          })
          if (existingOwner) {
            ownerId = existingOwner.id
          } else {
            const newOwner = await prisma.user.create({
              data: {
                clerkId: `walkin-${normalizedPhone.replace(/[^0-9]/g, '')}-${Date.now()}`,
                phone: normalizedPhone,
                name: body.ownerName || null,
              },
            })
            ownerId = newOwner.id
          }
        }

        const pet = await prisma.pet.create({
          data: {
            name: body.name,
            speciesId: body.speciesId,
            gender: body.gender || 'unknown',
            sterilized: body.sterilized ?? false,
            color: body.color || undefined,
            dateOfBirth: body.dateOfBirth || undefined,
            ownerId,
          },
        })
        return Response.json(pet)
      },
    },
  },
})
