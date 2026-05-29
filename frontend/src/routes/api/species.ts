import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '@/lib/db'

export const Route = createFileRoute('/api/species')({
  server: {
    handlers: {
      GET: async () => {
        const species = await prisma.species.findMany({
          orderBy: { name: 'asc' },
        })
        return Response.json(species)
      },
    },
  },
})
