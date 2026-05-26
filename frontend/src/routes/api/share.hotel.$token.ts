import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '@/lib/db'

export const Route = createFileRoute('/api/share/hotel/$token')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const token = params.token as string
        const booking = await prisma.hotelBooking.findUnique({
          where: { shareToken: token },
          include: {
            pet: { include: { species: true, owner: true } },
            dailyLogs: { orderBy: { logDate: 'desc' } },
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
          id: booking.id,
          petName: booking.pet?.name ?? booking.petNameRaw ?? null,
          petSpecies: booking.pet?.species?.name ?? booking.petTypeRaw ?? null,
          ownerName: booking.pet?.owner?.name ?? booking.guestName ?? null,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          status: booking.status,
          dailyFee: booking.dailyFee ? parseFloat(booking.dailyFee) : null,
          deposit: booking.deposit ? parseFloat(booking.deposit) : null,
          roomType: booking.roomType,
          notes: booking.notes,
          totalCost,
          daysIn,
          dailyLogs: booking.dailyLogs.map(l => ({
            id: l.id,
            logDate: l.logDate,
            condition: l.condition,
            feeding: l.feeding,
            notes: l.notes,
            cost: parseFloat(l.cost) || 0,
          })),
        })
      },
    },
  },
})
