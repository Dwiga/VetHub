import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '@/lib/db'
import { getOrCreateLocalUser } from '@/lib/clerk-server'

export const Route = createFileRoute('/api/hotel-bookings/$bookingId/daily-logs')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })
        const bookingId = Number(params.bookingId)
        const logs = await prisma.hotelDailyLog.findMany({
          where: { bookingId },
          orderBy: { logDate: 'desc' },
        })
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
            logDate: body.logDate,
            condition: body.condition,
            feeding: body.feeding,
            notes: body.notes,
            cost: body.cost ?? 0,
          },
        })
        return Response.json(log, { status: 201 })
      },
    },
  },
})
