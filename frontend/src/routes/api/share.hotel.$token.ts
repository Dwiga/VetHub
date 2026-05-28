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
        const roomFeeTotal = dailyFeeNum * daysIn
        const totalCredits = booking.dailyLogs
          .filter(l => l.type === 'credit')
          .reduce((sum, l) => sum + (parseFloat(l.amount) || 0), 0) + roomFeeTotal
        const totalDeposits = booking.dailyLogs
          .filter(l => l.type === 'deposit')
          .reduce((sum, l) => sum + (parseFloat(l.amount) || 0), 0)
        const balance = totalDeposits - totalCredits

        return Response.json({
          id: booking.id,
          petName: booking.pet?.name ?? null,
          petSpecies: booking.pet?.species?.name ?? null,
          ownerName: booking.pet?.owner?.name ?? null,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          status: booking.status,
          dailyFee: booking.dailyFee ? parseFloat(booking.dailyFee) : null,
          roomType: booking.roomType,
          notes: booking.notes,
          daysIn,
          roomFeeTotal,
          totalDeposits,
          totalCredits,
          balance,
          dailyLogs: booking.dailyLogs.map(l => ({
            id: l.id,
            type: l.type,
            description: l.description,
            amount: parseFloat(l.amount) || 0,
            logDate: l.logDate,
          })),
        })
      },
    },
  },
})
