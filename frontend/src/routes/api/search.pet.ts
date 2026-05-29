import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '@/lib/db'
import { getOrCreateLocalUser } from '@/lib/clerk-server'

export const Route = createFileRoute('/api/search/pet')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })
        const url = new URL(request.url)
        const name = url.searchParams.get('name') ?? ''
        const pets = await prisma.pet.findMany({
          where: { name: { contains: name } },
          include: { species: true, owner: true },
          take: 20,
        })
        return Response.json(
          pets.map((p) => ({
            id: p.id,
            name: p.name,
            speciesName: p.species?.name ?? null,
            status: p.status,
            ownerName: p.owner?.name ?? null,
            ownerPhone: p.owner?.phone ?? null,
          })),
        )
      },
    },
  },
})
