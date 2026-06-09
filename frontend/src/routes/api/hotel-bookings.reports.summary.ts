import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '@/lib/db'
import { getOrCreateLocalUser } from '@/lib/clerk-server'
import { computeFinancials } from '@/lib/hotel-enrichment'

export const Route = createFileRoute('/api/hotel-bookings/reports/summary')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })
        const hotelId = user.hotelId ?? user.clinicId
        if (!hotelId) return Response.json({ error: 'forbidden' }, { status: 403 })

        const url = new URL(request.url)
        const startDate = url.searchParams.get('startDate') ?? null
        const endDate = url.searchParams.get('endDate') ?? null

        let dateFilter: Record<string, unknown> = {}
        if (startDate || endDate) {
          const from = startDate || '1970-01-01'
          const to = endDate || '2099-12-31'
          dateFilter = { checkIn: { gte: from, lte: to } }
        }

        const bookings = await prisma.hotelBooking.findMany({
          where: {
            hotelId,
            ...dateFilter,
          },
          include: {
            pet: {
              include: {
                owner: true,
              },
            },
            dailyLogs: true,
          },
          orderBy: { checkIn: 'desc' },
        })

        const totalGuests = bookings.length
        const activeStays = bookings.filter(b => b.status === 'active').length

        // Total revenue: sum of all deposit amounts
        const totalRevenue = bookings.reduce((s, b) => {
          const deposits = (b.dailyLogs || [])
            .filter(l => l.type === 'deposit')
            .reduce((sum, l) => sum + (parseFloat(l.amount || '0')), 0)
          return s + deposits
        }, 0)

        // Top services: group credit daily logs by description
        const serviceMap = new Map<string, { count: number; revenue: number }>()
        for (const b of bookings) {
          for (const log of b.dailyLogs || []) {
            if (log.type === 'credit' && log.description) {
              const existing = serviceMap.get(log.description) || { count: 0, revenue: 0 }
              existing.count += 1
              existing.revenue += parseFloat(log.amount || '0')
              serviceMap.set(log.description, existing)
            }
          }
        }
        const topServices = Array.from(serviceMap.entries())
          .map(([name, val]) => ({ name, count: val.count, revenue: val.revenue }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 10)

        // Guest list
        const guests = bookings.map(b => {
          const financials = computeFinancials({ checkIn: b.checkIn, checkOut: b.checkOut, dailyFee: b.dailyFee, dailyLogs: b.dailyLogs as any })
          return {
            bookingId: b.id,
            petName: b.pet?.name ?? 'Unknown',
            ownerPhone: (b.pet as any)?.owner?.phone ?? '-',
            checkIn: b.checkIn,
            checkOut: b.checkOut,
            totalCost: financials.totalDeposits,
            balance: financials.balance,
            status: b.status,
          }
        })

        return Response.json({
          totalGuests,
          activeStays,
          totalRevenue,
          topServices,
          guests,
        })
      },
    },
  },
})
