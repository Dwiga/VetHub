import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '@/lib/db'
import { getOrCreateLocalUser } from '@/lib/clerk-server'

export const Route = createFileRoute('/api/hotel-bookings')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })
        const url = new URL(request.url)
        const status = url.searchParams.get('status') ?? undefined
        const clinicId = url.searchParams.get('clinicId') ?? undefined
        const where: Record<string, any> = {}
        if (status) where.status = status
        if (clinicId) where.clinicId = Number(clinicId)
        const bookings = await prisma.hotelBooking.findMany({
          where,
          orderBy: { checkIn: 'desc' },
        })
        return Response.json(bookings)
      },
      POST: async ({ request }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })
        const url = new URL(request.url)
        const petId = Number(url.searchParams.get('petId'))
        const body = await request.json()
        const booking = await prisma.hotelBooking.create({
          data: {
            petId,
            clinicId: user.clinicId ?? body.clinicId,
            checkIn: body.checkIn,
            deposit: body.deposit ? String(body.deposit) : undefined,
            roomType: body.roomType,
            dailyFee: body.dailyFee,
            notes: body.notes,
            status: 'active',
          },
        })
        return Response.json(booking, { status: 201 })
      },
    },
  },
})
