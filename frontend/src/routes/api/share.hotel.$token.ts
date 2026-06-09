import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '@/lib/db'
import { computeFinancials, computeDaysIn } from '@/lib/hotel-enrichment'

export const Route = createFileRoute('/api/share/hotel/$token')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const token = params.token as string
        const booking = await prisma.hotelBooking.findUnique({
          where: { shareToken: token },
          include: {
            pet: { include: { species: true, owner: true } },
            clinic: { select: { name: true, phone: true, address: true } },
            dailyLogs: { orderBy: { logDate: 'asc' } },
          },
        })
        if (!booking) return Response.json({ error: 'not found' }, { status: 404 })

        const financials = computeFinancials(booking)
        const daysIn = computeDaysIn(booking)

        const roomFeeLineItem = financials.dailyFeeNum > 0 ? {
          date: booking.checkIn,
          type: 'roomFee',
          description: `${financials.dailyFeeNum.toLocaleString('id-ID')}/hari × ${daysIn} hari`,
          amount: -financials.roomFeeTotal,
        } : null

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
          daysIn: financials.daysIn,
          roomFeeTotal: financials.roomFeeTotal,
          totalDeposits: financials.totalDeposits,
          totalCredits: financials.totalCredits,
          balance: financials.balance,
          clinicName: booking.clinic.name,
          clinicPhone: booking.clinic.phone,
          clinicAddress: booking.clinic.address,
          roomFeeLineItem,
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
