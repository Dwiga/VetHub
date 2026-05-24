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

        // Pet owners see visits of their own pets; vets see visits of their clinic.
        const where: Record<string, unknown> = {}
        if (status) where.status = status

        if (user.clinicId) {
          where.clinicId = user.clinicId
        } else {
          // restrict to owner's pets
          const ownedPets = await prisma.pet.findMany({
            where: { ownerId: user.id },
            select: { id: true },
          })
          where.petId = { in: ownedPets.map((p) => p.id) }
        }

        const visits = await prisma.visit.findMany({
          where,
          orderBy: { createdAt: 'desc' },
        })
        return Response.json(visits)
      },
    },
  },
})
