import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '@/lib/db'
import { getOrCreateLocalUser } from '@/lib/clerk-server'
import { normalizePhone } from '@/lib/phone'

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

        // Validate uniqueness before updating
        if (body.phone) {
          const normalizedPhone = normalizePhone(body.phone)
          const existing = await prisma.user.findFirst({
            where: {
              phone: normalizedPhone,
              id: { not: user.id },
            },
            select: { id: true },
          })
          if (existing) {
            return Response.json(
              { error: 'Nomor hp sudah terdaftar' },
              { status: 409 },
            )
          }
        }

        if (body.email) {
          const existing = await prisma.user.findFirst({
            where: {
              email: body.email,
              id: { not: user.id },
            },
            select: { id: true },
          })
          if (existing) {
            return Response.json(
              { error: 'Email sudah terdaftar' },
              { status: 409 },
            )
          }
        }

        const updated = await prisma.user.update({
          where: { id: user.id },
          data: {
            name: body.name,
            phone: body.phone,
            email: body.email,
          },
        })
        return Response.json(updated)
      },
    },
  },
})
