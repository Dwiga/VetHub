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

        const endDate = booking.checkOut
          ? new Date(booking.checkOut)
          : new Date()
        const daysIn = Math.max(1, Math.ceil((endDate.getTime() - new Date(booking.checkIn).getTime()) / (1000 * 60 * 60 * 24)))
        const dailyFeeNum = booking.dailyFee ? parseFloat(booking.dailyFee) : 0
        const logsCost = booking.dailyLogs.reduce((sum, l) => sum + (parseFloat(l.cost) || 0), 0)
        const totalCost = (dailyFeeNum * daysIn) + logsCost

        return Response.json({
          ...booking,
          petName: booking.pet?.name ?? null,
          petSpecies: booking.pet?.species?.name ?? null,
          ownerName: booking.pet?.owner?.name ?? null,
          ownerPhone: booking.pet?.owner?.phone ?? null,
          totalCost,
          daysIn,
        })
      },
      PATCH: async ({ request, params }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })
        const id = Number(params.bookingId)
        const body = await request.json()
        const updated = await prisma.hotelBooking.update({ where: { id }, data: body })
        return Response.json(updated)
      },
    },
  },
})
