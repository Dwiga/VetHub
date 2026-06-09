import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '@/lib/db'
import { getOrCreateLocalUser } from '@/lib/clerk-server'

export const Route = createFileRoute('/api/hotel/$bookingId')({
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
            dailyLogs: true,
          },
        })
        if (!booking) return Response.json({ error: 'not found' }, { status: 404 })

        const userHotelId = user.hotelId ?? user.clinicId
        if (!userHotelId || booking.hotelId !== userHotelId) {
          return Response.json({ error: 'forbidden' }, { status: 403 })
        }

        const endDate = booking.checkOut
          ? new Date(booking.checkOut)
          : new Date()
        const daysIn = Math.max(1, Math.ceil((endDate.getTime() - new Date(booking.checkIn).getTime()) / (1000 * 60 * 60 * 24)))
        const dailyFeeNum = booking.dailyFee ? parseFloat(booking.dailyFee) : 0
        const roomFeeTotal = dailyFeeNum * daysIn
        const totalCredits = booking.dailyLogs
          .filter(l => l.type === 'credit')
          .reduce((sum, l) => sum + (parseFloat(l.amount) || 0), 0) + roomFeeTotal
        const totalDeposits = booking.dailyLogs
          .filter(l => l.type === 'deposit')
          .reduce((sum, l) => sum + (parseFloat(l.amount) || 0), 0)
        const balance = totalDeposits - totalCredits

        return Response.json({
          ...booking,
          petName: booking.pet?.name ?? null,
          petSpecies: booking.pet?.species?.name ?? null,
          ownerName: booking.pet?.owner?.name ?? null,
          ownerPhone: booking.pet?.owner?.phone ?? null,
          expectedCheckOut: booking.expectedCheckOut,
          daysIn,
          roomFeeTotal,
          totalDeposits,
          totalCredits,
          balance,
        })
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

        // If checking out, auto-create a room fee credit entry
        if (body.status === 'completed' || body.checkOut) {
          const current = await prisma.hotelBooking.findUnique({
            where: { id },
            include: { dailyLogs: true },
          })
          if (current) {
            const endDate = body.checkOut
              ? new Date(body.checkOut)
              : new Date()
            const daysIn = Math.max(1, Math.ceil((endDate.getTime() - new Date(current.checkIn).getTime()) / (1000 * 60 * 60 * 24)))
            const dailyFeeNum = current.dailyFee ? parseFloat(current.dailyFee) : 0
            if (dailyFeeNum > 0) {
              const totalRoomFee = dailyFeeNum * daysIn
              await prisma.hotelDailyLog.create({
                data: {
                  bookingId: id,
                  type: 'credit',
                  description: `Room fee (${daysIn} days × Rp ${dailyFeeNum.toLocaleString('id-ID')})`,
                  amount: String(totalRoomFee),
                  logDate: body.checkOut || current.checkIn,
                },
              })
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
