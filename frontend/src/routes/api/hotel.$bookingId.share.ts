import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '@/lib/db'
import { getOrCreateLocalUser } from '@/lib/clerk-server'
import crypto from 'node:crypto'

export const Route = createFileRoute('/api/hotel/$bookingId/share')({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })
        const bookingId = Number(params.bookingId)

        const booking = await prisma.hotelBooking.findUnique({
          where: { id: bookingId },
          include: { pet: { include: { species: true, owner: true } } },
        })
        if (!booking) return Response.json({ error: 'not found' }, { status: 404 })

        let shareToken = booking.shareToken
        if (!shareToken) {
          shareToken = crypto.randomBytes(16).toString('hex')
          await prisma.hotelBooking.update({
            where: { id: bookingId },
            data: { shareToken },
          })
        }

        const origin = request.headers.get('origin') || ''
        const petName = booking.pet?.name ?? booking.petNameRaw ?? 'Pet'
        const shareUrl = `${origin}/share/hotel/${shareToken}`
        return Response.json({ shareUrl, petName })
      },
    },
  },
})
