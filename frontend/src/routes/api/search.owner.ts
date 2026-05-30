import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '@/lib/db'
import { getOrCreateLocalUser } from '@/lib/clerk-server'

export const Route = createFileRoute('/api/search/owner')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })
        const url = new URL(request.url)
        const phone = url.searchParams.get('phone') ?? ''

        // 1. Look up registered user by phone
        const owner = await prisma.user.findFirst({
          where: { phone: { contains: phone } },
        })

        // 2. Collect pets — from registered owner AND from unowned pets with matching ownerPhone
        const ownedPets = owner
          ? await prisma.pet.findMany({
              where: { ownerId: owner.id },
              include: { species: true },
            })
          : []

        const unownedPets = await prisma.pet.findMany({
          where: {
            ownerId: null,
            ownerPhone: { contains: phone },
          },
          include: { species: true },
        })

        const allPets = [
          ...ownedPets.map(p => ({
            id: p.id,
            name: p.name,
            speciesName: p.species?.name ?? null,
            status: p.status,
            ownerName: owner!.name ?? null,
            ownerPhone: owner!.phone ?? null,
          })),
          ...unownedPets.map(p => ({
            id: p.id,
            name: p.name,
            speciesName: p.species?.name ?? null,
            status: p.status,
            ownerName: null,
            ownerPhone: p.ownerPhone,
          })),
        ]

        return Response.json({
          owner: owner
            ? { id: owner.id, name: owner.name, phone: owner.phone }
            : null,
          pets: allPets,
        })
      },
    },
  },
})
