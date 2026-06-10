import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '@/lib/db'
import { getOrCreateLocalUser } from '@/lib/clerk-server'
import { normalizePhone } from '@/lib/phone'

export const Route = createFileRoute('/api/search/owner')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })
        const url = new URL(request.url)
        const rawPhone = url.searchParams.get('phone') ?? ''
        const phone = normalizePhone(rawPhone)

        // 1. Look up registered user by phone
        const owner = await prisma.user.findFirst({
          where: { phone },
        })

        // 2. Look up guest contact (for unregistered owners, global across all hotels/vets)
        const guestContact = await prisma.guestContact.findUnique({
          where: { phone },
        })

        // Determine best owner name: User name first, then guest contact name
        const guestOwnerName = owner?.name ?? guestContact?.name ?? null

        // 3. Collect pets — from registered owner AND from unowned pets with matching ownerPhone
        const ownedPets = owner
          ? await prisma.pet.findMany({
              where: { ownerId: owner.id },
              include: { species: true },
            })
          : []

        const unownedPets = await prisma.pet.findMany({
          where: {
            ownerId: null,
            ownerPhone: phone,
          },
          include: { species: true },
        })

        const allPets = [
          ...ownedPets.map(p => ({
            id: p.id,
            name: p.name,
            speciesName: p.species?.name ?? null,
            status: p.status,
            ownerName: owner?.name ?? null,
            ownerPhone: owner?.phone ?? null,
          })),
          ...unownedPets.map(p => ({
            id: p.id,
            name: p.name,
            speciesName: p.species?.name ?? null,
            status: p.status,
            ownerName: guestContact?.name ?? null,
            ownerPhone: p.ownerPhone,
          })),
        ]

        return Response.json({
          owner: owner
            ? { id: owner.id, name: owner.name ?? guestContact?.name ?? null, phone: owner.phone, address: guestContact?.address ?? null }
            : guestContact
              ? { id: 0, name: guestContact.name, phone, address: guestContact.address }
              : null,
          pets: allPets,
        })
      },
    },
  },
})
