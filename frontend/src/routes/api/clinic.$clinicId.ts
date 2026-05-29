import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '@/lib/db'
import { getOrCreateLocalUser } from '@/lib/clerk-server'

export const Route = createFileRoute('/api/clinic/$clinicId')({
  server: {
    handlers: {
      PATCH: async ({ request, params }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })
        const clinicId = Number(params.clinicId)
        const clinic = await prisma.clinic.findFirst({ where: { id: clinicId, ownerId: user.id } })
        if (!clinic) return Response.json({ error: 'not found' }, { status: 404 })
        const body = await request.json()
        const updated = await prisma.clinic.update({ where: { id: clinicId }, data: body })
        return Response.json(updated)
      },
    },
  },
})
