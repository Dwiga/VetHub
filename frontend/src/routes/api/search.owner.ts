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
        const owner = await prisma.user.findFirst({
          where: { phone: { contains: phone } },
        })
        if (!owner) return Response.json({ error: 'not found' }, { status: 404 })
        const pets = await prisma.pet.findMany({
          where: { ownerId: owner.id },
          include: { species: true },
        })
        return Response.json({
          owner: { id: owner.id, name: owner.name, phone: owner.phone },
          pets: pets.map((p) => ({
            id: p.id,
            name: p.name,
            speciesName: p.species?.name ?? null,
            status: p.status,
            ownerName: owner.name ?? null,
            ownerPhone: owner.phone ?? null,
          })),
        })
      },
    },
  },
})
