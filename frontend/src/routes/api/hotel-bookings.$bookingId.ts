import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '@/lib/db'
import { getOrCreateLocalUser } from '@/lib/clerk-server'
import { enrichHotelBooking, computeDaysIn, computeRoomFee, roomFeeDescription } from '@/lib/hotel-enrichment'

export const Route = createFileRoute('/api/hotel-bookings/$bookingId')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })
        const id = Number(params.bookingId)
        const booking = await prisma.hotelBooking.findUnique({
          where: { id },
          include: {
            pet: { include: { species: true, owner: true } },
            clinic: true,
            dailyLogs: true,
          },
        })
        if (!booking) return Response.json({ error: 'not found' }, { status: 404 })

        const userHotelId = user.hotelId ?? user.clinicId
        if (!userHotelId || booking.hotelId !== userHotelId) {
          return Response.json({ error: 'forbidden' }, { status: 403 })
        }

        return Response.json(enrichHotelBooking(booking))
      },
      PATCH: async ({ request, params }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })
        const id = Number(params.bookingId)
        const booking = await prisma.hotelBooking.findUnique({ where: { id } })
        if (!booking) return Response.json({ error: 'not found' }, { status: 404 })
        const userHotelId = user.hotelId ?? user.clinicId
        if (!userHotelId || booking.hotelId !== userHotelId) {
          return Response.json({ error: 'forbidden' }, { status: 403 })
        }
        const body = await request.json()

        // If "Mulai": convert reserved → active, set checkIn to today if it was in the future
        if (body.status === 'active') {
          const current = await prisma.hotelBooking.findUnique({ where: { id } })
          if (current && current.status === 'reserved') {
            const checkInDate = new Date(current.checkIn)
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            if (checkInDate > today) {
              body.checkIn = new Date().toISOString().split('T')[0]
            }
          }
        }

        if (body.status === 'completed' || body.checkOut) {
          const current = await prisma.hotelBooking.findUnique({
            where: { id },
            include: { dailyLogs: true },
          })
          if (current) {
            const bookingForCalc = {
              checkIn: current.checkIn,
              checkOut: body.checkOut ?? current.checkOut,
              dailyFee: current.dailyFee,
            }
            const { dailyFeeNum, roomFeeTotal } = computeRoomFee(bookingForCalc)
            const daysIn = computeDaysIn(bookingForCalc)
            if (dailyFeeNum > 0) {
              const existingFee = current.dailyLogs.find(l => l.description?.startsWith('Room fee'))
              if (!existingFee) {
                await prisma.hotelDailyLog.create({
                  data: {
                    bookingId: id,
                    type: 'credit',
                    description: roomFeeDescription(dailyFeeNum, daysIn),
                    amount: String(roomFeeTotal),
                    logDate: body.checkOut || current.checkIn,
                  },
                })
              }
            }
          }
        }

        const updated = await prisma.hotelBooking.update({ where: { id }, data: body })
        return Response.json(updated)
      },
      DELETE: async ({ request, params }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })
        const id = Number(params.bookingId)
        const booking = await prisma.hotelBooking.findUnique({ where: { id } })
        if (!booking) return Response.json({ error: 'not found' }, { status: 404 })
        const userHotelId = user.hotelId ?? user.clinicId
        if (!userHotelId || booking.hotelId !== userHotelId) {
          return Response.json({ error: 'forbidden' }, { status: 403 })
        }
        await prisma.hotelBooking.delete({ where: { id } })
        return new Response(null, { status: 204 })
      },
    },
  },
})
