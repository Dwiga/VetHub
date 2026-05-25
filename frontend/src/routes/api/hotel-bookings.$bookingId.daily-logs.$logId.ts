import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '@/lib/db'
import { getOrCreateLocalUser } from '@/lib/clerk-server'

export const Route = createFileRoute('/api/hotel-bookings/$bookingId/daily-logs/$logId')({
  server: {
    handlers: {
      DELETE: async ({ params }) => {
        const logId = Number(params.logId)
        await prisma.hotelDailyLog.delete({ where: { id: logId } })
        return new Response(null, { status: 204 })
      },
    },
  },
})
