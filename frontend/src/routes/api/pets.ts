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
        // If ownerPhone is provided (vet/hotel staff adding a pet for a walk-in owner),
        // look up the owner by phone. If not found, store ownerPhone on the pet instead
        // of creating a placeholder user — the owner can claim the pet when they sign up.
        let ownerId: number | null = user.id
        let ownerPhone: string | null = null
        if (body.ownerPhone) {
          const normalizedPhone = normalizePhone(body.ownerPhone)
          const existingOwner = await prisma.user.findFirst({
            where: { phone: normalizedPhone },
          })
          if (existingOwner) {
            ownerId = existingOwner.id
          } else {
            ownerId = null
            ownerPhone = normalizedPhone
            // Save guest contact info for future lookups (global, not tied to a specific hotel)
            if (body.ownerName || body.ownerAddress) {
              await prisma.guestContact.upsert({
                where: { phone: normalizedPhone },
                create: {
                  phone: normalizedPhone,
                  name: body.ownerName || undefined,
                  address: body.ownerAddress || undefined,
                },
                update: {
                  name: body.ownerName || undefined,
                  address: body.ownerAddress || undefined,
                },
              })
            }
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
            ownerPhone,
          },
        })
        return Response.json(pet)
      },
    },
  },
})
