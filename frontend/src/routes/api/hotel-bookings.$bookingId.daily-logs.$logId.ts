import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '@/lib/db'
import { getOrCreateLocalUser } from '@/lib/clerk-server'

export const Route = createFileRoute('/api/hotel-bookings/$bookingId/daily-logs/$logId')({
  server: {
    handlers: {
      DELETE: async ({ request, params }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })

        const logId = Number(params.logId)
        const log = await prisma.hotelDailyLog.findUnique({
          where: { id: logId },
          include: { booking: true },
        })
        if (!log) return Response.json({ error: 'not found' }, { status: 404 })

        const userHotelId = user.hotelId ?? user.clinicId
        if (!userHotelId || log.booking.hotelId !== userHotelId) {
          return Response.json({ error: 'forbidden' }, { status: 403 })
        }

        await prisma.hotelDailyLog.delete({ where: { id: logId } })
        return new Response(null, { status: 204 })
      },
    },
  },
})
