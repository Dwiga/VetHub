import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '@/lib/db'
import { getOrCreateLocalUser } from '@/lib/clerk-server'

export const Route = createFileRoute('/api/species')({
  server: {
    handlers: {
      GET: async () => {
        const species = await prisma.species.findMany({
          orderBy: { name: 'asc' },
        })
        return Response.json(species)
      },
      POST: async ({ request }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })
        if (!user.isAdmin) return Response.json({ error: 'forbidden' }, { status: 403 })

        const body = await request.json()
        const name = body?.name?.trim()
        if (!name) return Response.json({ error: 'name required' }, { status: 400 })

        try {
          const species = await prisma.species.create({ data: { name } })
          return Response.json(species, { status: 201 })
        } catch (err: any) {
          if (err.code === 'P2002') {
            return Response.json({ error: 'Species already exists' }, { status: 409 })
          }
          throw err
        }
      },
    },
  },
})
