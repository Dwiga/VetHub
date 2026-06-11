import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '@/lib/db'
import { getOrCreateLocalUser } from '@/lib/clerk-server'

export const Route = createFileRoute('/api/hotel/rooms/available')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })
        const userHotelId = user.hotelId ?? user.clinicId
        if (!userHotelId) return Response.json({ error: 'no hotel assigned' }, { status: 400 })

        const url = new URL(request.url)
        const checkIn = url.searchParams.get('checkIn')
        const checkOut = url.searchParams.get('checkOut')
        const bookingId = url.searchParams.get('bookingId')
        if (!checkIn || !checkOut) return Response.json({ error: 'checkIn and checkOut required' }, { status: 400 })

        const rooms = await prisma.room.findMany({
          where: { hotelId: userHotelId, isActive: true, status: { not: 'maintenance' } },
          orderBy: { name: 'asc' },
          include: {
            bookings: {
              where: {
                status: { in: ['active', 'reserved'] },
                id: bookingId ? { not: Number(bookingId) } : undefined,
              },
              select: { id: true, checkIn: true, checkOut: true, expectedCheckOut: true, status: true },
            },
          },
        })

        const availableRooms = rooms
          .map((room) => {
            const conflictingCount = room.bookings.filter((booking) => {
              const bCheckIn = new Date(booking.checkIn)
              const bCheckOut = booking.checkOut
                ? new Date(booking.checkOut)
                : booking.expectedCheckOut
                  ? new Date(booking.expectedCheckOut)
                  : new Date('2099-12-31')
              const reqCheckIn = new Date(checkIn)
              const reqCheckOut = new Date(checkOut)
              return reqCheckIn < bCheckOut && reqCheckOut > bCheckIn
            }).length
            const availableSlots = room.capacity - conflictingCount
            return { ...room, conflictingCount, availableSlots }
          })
          .filter((room) => room.availableSlots > 0)

        return Response.json(availableRooms)
      },
    },
  },
})
