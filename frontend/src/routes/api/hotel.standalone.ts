import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '@/lib/db'
import { getOrCreateLocalUser } from '@/lib/clerk-server'

export const Route = createFileRoute('/api/hotel/standalone')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })
        const userHotelId = user.hotelId ?? user.clinicId
        const body = await request.json()
        const hotelId = userHotelId ?? body.clinicId ?? body.hotelId
        if (!hotelId) return Response.json({ error: 'missing hotelId' }, { status: 400 })
        const booking = await prisma.hotelBooking.create({
          data: {
            hotelId,
            checkIn: body.checkIn,
            expectedCheckOut: body.expectedCheckOut,
            roomType: body.roomType,
            dailyFee: body.dailyFee ? String(body.dailyFee) : undefined,
            notes: body.notes,
            status: body.status ?? 'active',
          },
        })
        return Response.json(booking, { status: 201 })
      },
    },
  },
})
