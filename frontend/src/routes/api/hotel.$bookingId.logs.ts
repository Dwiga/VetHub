import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '@/lib/db'
import { getOrCreateLocalUser } from '@/lib/clerk-server'

export const Route = createFileRoute('/api/hotel/$bookingId/logs')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })
        const bookingId = Number(params.bookingId)
        const logs = await prisma.hotelDailyLog.findMany({ where: { bookingId }, orderBy: { logDate: 'desc' } })
        return Response.json(logs)
      },
      POST: async ({ request, params }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })
        const bookingId = Number(params.bookingId)
        const body = await request.json()
        const log = await prisma.hotelDailyLog.create({
          data: {
            bookingId,
            type: body.type ?? 'credit',
            description: body.description ?? null,
            amount: body.amount != null ? String(body.amount) : '0',
            logDate: body.logDate,
          },
        })
        return Response.json(log, { status: 201 })
      },
    },
  },
})
