import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '@/lib/db'
import { getOrCreateLocalUser } from '@/lib/clerk-server'

export const Route = createFileRoute('/api/clinic/mine')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })
        if (!user.clinicId) return Response.json({ error: 'no clinic' }, { status: 404 })
        const clinic = await prisma.clinic.findUnique({ where: { id: user.clinicId } })
        if (!clinic) return Response.json({ error: 'not found' }, { status: 404 })
        return Response.json(clinic)
      },
    },
  },
})
