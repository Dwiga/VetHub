import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '@/lib/db'
import { getOrCreateLocalUser } from '@/lib/clerk-server'

export const Route = createFileRoute('/api/hotel/rooms')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })
        const userHotelId = user.hotelId ?? user.clinicId
        if (!userHotelId) return Response.json({ error: 'no hotel assigned' }, { status: 400 })

        const url = new URL(request.url)
        const hotelId = url.searchParams.get('hotelId') ? Number(url.searchParams.get('hotelId')) : userHotelId
        const status = url.searchParams.get('status') ?? undefined
        const where: Record<string, any> = { hotelId, isActive: true }
        if (status) where.status = status

        const rooms = await prisma.room.findMany({
          where,
          orderBy: { name: 'asc' },
          include: {
            bookings: {
              where: { status: { in: ['active', 'reserved'] } },
              select: { id: true, checkIn: true, checkOut: true, expectedCheckOut: true, status: true },
            },
          },
        })
        return Response.json(rooms)
      },
      POST: async ({ request }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })
        const userHotelId = user.hotelId ?? user.clinicId
        if (!userHotelId) return Response.json({ error: 'no hotel assigned' }, { status: 400 })

        const body = await request.json()
        const room = await prisma.room.create({
          data: {
            name: body.name,
            capacity: body.capacity ? parseInt(body.capacity) : 1,
            dailyFee: body.dailyFee ? String(body.dailyFee) : undefined,
            hotelId: userHotelId,
          },
        })
        return Response.json(room, { status: 201 })
      },
    },
  },
})
