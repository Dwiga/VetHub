import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '@/lib/db'
import { getOrCreateLocalUser } from '@/lib/clerk-server'

export const Route = createFileRoute('/api/pets/$petId/vaccinations/$vaccinationId')({
  server: {
    handlers: {
      DELETE: async ({ request, params }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) {
          return Response.json({ error: 'unauthorized' }, { status: 401 })
        }
        const petId = Number(params.petId)
        const vaccinationId = Number(params.vaccinationId)
        
        const pet = await prisma.pet.findFirst({
          where: { id: petId },
        })
        if (!pet) {
          return Response.json({ error: 'not found' }, { status: 404 })
        }
        // Allow if: pet owner OR clinic staff (vet)
        if (pet.ownerId !== user.id && !user.clinicId) {
          return Response.json({ error: 'forbidden' }, { status: 403 })
        }

        await prisma.vaccination.delete({
          where: { id: vaccinationId, petId },
        })
        return new Response(null, { status: 204 })
      },
    },
  },
})
