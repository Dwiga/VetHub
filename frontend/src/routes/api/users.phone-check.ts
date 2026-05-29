import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '@/lib/db'
import { normalizePhone } from '@/lib/phone'

export const Route = createFileRoute('/api/users/phone-check')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const phone = new URL(request.url).searchParams.get('phone')
        if (!phone) {
          return Response.json({ exists: false })
        }
        const normalized = normalizePhone(phone)
        const existing = await prisma.user.findFirst({
          where: { phone: normalized },
          select: { id: true },
        })
        return Response.json({ exists: !!existing })
      },
    },
  },
})
