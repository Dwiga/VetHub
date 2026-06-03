import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '@/lib/db'
import { getOrCreateLocalUser } from '@/lib/clerk-server'

export const Route = createFileRoute('/api/users/register-for-vet')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) {
          return Response.json({ error: 'unauthorized' }, { status: 401 })
        }
        
        const body = await request.json()
        
        const clinic = await prisma.clinic.create({
          data: {
            name: body.name,
            address: body.address,
            phone: body.phone,
            email: body.email,
            ownerId: user.id,
            type: 'vet',
          },
        })

        await prisma.staff.create({
          data: {
            clinicId: clinic.id,
            userId: user.id,
            role: 'owner',
            status: 'active',
          },
        })

        const updatedUser = await prisma.user.update({
          where: { id: user.id },
          data: {
            isPetOwner: true,
            isVet: true,
            isVetOwner: true,
            clinicId: clinic.id,
            vetStatus: 'approved',
          },
        })

        return Response.json({ user: updatedUser, clinic })
      },
    },
  },
})
