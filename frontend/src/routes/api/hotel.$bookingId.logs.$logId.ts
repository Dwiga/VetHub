import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '@/lib/db'

export const Route = createFileRoute('/api/hotel/$bookingId/logs/$logId')({
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
