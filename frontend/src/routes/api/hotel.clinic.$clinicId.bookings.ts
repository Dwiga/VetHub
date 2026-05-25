import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '@/lib/db'
import { getOrCreateLocalUser } from '@/lib/clerk-server'

export const Route = createFileRoute('/api/hotel/clinic/$clinicId/bookings')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })
        const clinicId = Number(params.clinicId)
        const url = new URL(request.url)
        const status = url.searchParams.get('status')
        const where: Record<string, any> = { clinicId }
        if (status) where.status = status
        const bookings = await prisma.hotelBooking.findMany({ where, orderBy: { checkIn: 'desc' } })
        return Response.json(bookings)
      },
    },
  },
})
