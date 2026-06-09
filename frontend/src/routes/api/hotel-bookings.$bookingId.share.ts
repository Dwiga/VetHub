import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '@/lib/db'
import { getOrCreateLocalUser } from '@/lib/clerk-server'
import { nanoid } from 'nanoid'

export const Route = createFileRoute('/api/hotel-bookings/$bookingId/share')({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })
        const id = Number(params.bookingId)
        const booking = await prisma.hotelBooking.findUnique({ where: { id } })
        if (!booking) return Response.json({ error: 'not found' }, { status: 404 })
        const userHotelId = user.hotelId ?? user.clinicId
        if (!userHotelId || booking.hotelId !== userHotelId) {
          return Response.json({ error: 'forbidden' }, { status: 403 })
        }

        let token = booking.shareToken
        if (!token) {
          token = nanoid(10)
          await prisma.hotelBooking.update({
            where: { id },
            data: { shareToken: token },
          })
        }

        return Response.json({ token })
      },
    },
  },
})
