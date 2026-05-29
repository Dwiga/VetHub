import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '@/lib/db'
import { getOrCreateLocalUser } from '@/lib/clerk-server'

export const Route = createFileRoute('/api/users/me/register-pet-owner')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) {
          return Response.json({ error: 'unauthorized' }, { status: 401 })
        }
        const updated = await prisma.user.update({
          where: { id: user.id },
          data: { isPetOwner: true },
        })
        return Response.json(updated)
      },
    },
  },
})
