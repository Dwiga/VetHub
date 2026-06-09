import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '@/lib/db'
import { getOrCreateLocalUser } from '@/lib/clerk-server'

export const Route = createFileRoute('/api/hotel/$hotelId/reports/summary')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })
        const hotelId = Number(params.hotelId)
        const userHotelId = user.hotelId ?? user.clinicId
        if (!userHotelId || hotelId !== userHotelId) {
          return Response.json({ error: 'forbidden' }, { status: 403 })
        }
        const url = new URL(request.url)
        const period = url.searchParams.get('period') ?? 'monthly'
        const date = url.searchParams.get('date') ?? new Date().toISOString().split('T')[0]
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
            pet: true,
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
        const guests = bookings.map(b => ({
          bookingId: b.id,
          petName: b.pet?.name ?? 'Unknown',
          ownerPhone: b.pet?.ownerPhone ?? '-',
          checkIn: b.checkIn,
          checkOut: b.checkOut,
          totalCost: (b.dailyLogs || [])
            .filter(l => l.type === 'deposit')
            .reduce((sum, l) => sum + (parseFloat(l.amount || '0')), 0),
          balance: (() => {
            const deposits = (b.dailyLogs || [])
              .filter(l => l.type === 'deposit')
              .reduce((sum, l) => sum + (parseFloat(l.amount || '0')), 0)
            const credits = (b.dailyLogs || [])
              .filter(l => l.type === 'credit')
              .reduce((sum, l) => sum + (parseFloat(l.amount || '0')), 0)
            const roomFee = b.dailyFee
              ? (() => {
                  const daysIn = b.checkOut
                    ? Math.max(1, Math.ceil((new Date(b.checkOut).getTime() - new Date(b.checkIn).getTime()) / (1000 * 60 * 60 * 24)))
                    : Math.max(1, Math.ceil((Date.now() - new Date(b.checkIn).getTime()) / (1000 * 60 * 60 * 24)))
                  return daysIn * parseFloat(b.dailyFee)
                })()
              : 0
            return deposits - (credits + roomFee)
          })(),
          status: b.status,
        }))

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
