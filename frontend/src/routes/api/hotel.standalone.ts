import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '@/lib/db'
import { getOrCreateLocalUser } from '@/lib/clerk-server'

export const Route = createFileRoute('/api/hotel/standalone')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })
        const body = await request.json()
        const booking = await prisma.hotelBooking.create({
          data: {
            clinicId: body.clinicId,
            guestName: body.guestName,
            guestPhone: body.guestPhone,
            petNameRaw: body.petNameRaw,
            petTypeRaw: body.petTypeRaw,
            checkIn: body.checkIn,
            deposit: body.deposit ? String(body.deposit) : undefined,
            roomType: body.roomType,
            dailyFee: body.dailyFee ? String(body.dailyFee) : undefined,
            notes: body.notes,
            status: 'active',
          },
        })
        return Response.json(booking, { status: 201 })
      },
    },
  },
})
