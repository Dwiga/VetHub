import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '@/lib/db'
import { getOrCreateLocalUser } from '@/lib/clerk-server'

export const Route = createFileRoute('/api/users/register-for-hotel')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) {
          return Response.json({ error: 'unauthorized' }, { status: 401 })
        }
        
        const body = await request.json()
        
        const hotel = await prisma.clinic.create({
          data: {
            name: body.name,
            address: body.address,
            phone: body.phone,
            ownerId: user.id,
            type: 'hotel',
          },
        })

        const updatedUser = await prisma.user.update({
          where: { id: user.id },
          data: {
            isHotelOwner: true,
            hotelId: hotel.id,
          },
        })

        return Response.json({ user: updatedUser, hotel })
      },
    },
  },
})
