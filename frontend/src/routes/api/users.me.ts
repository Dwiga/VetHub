import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '@/lib/db'
import { getOrCreateLocalUser } from '@/lib/clerk-server'

export const Route = createFileRoute('/api/users/me')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) {
          return Response.json({ error: 'unauthorized' }, { status: 401 })
        }
        return Response.json(user)
      },
      PATCH: async ({ request }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) {
          return Response.json({ error: 'unauthorized' }, { status: 401 })
        }
        const body = await request.json()
        const updated = await prisma.user.update({
          where: { id: user.id },
          data: {
            name: body.name,
            phone: body.phone,
          },
        })
        return Response.json(updated)
      },
    },
  },
})
