import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '@/lib/db'
import { getOrCreateLocalUser } from '@/lib/clerk-server'

export const Route = createFileRoute('/api/clinic/$clinicId/staff')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })
        const clinicId = Number(params.clinicId)
        const staff = await prisma.staff.findMany({
          where: { clinicId },
        })
        return Response.json(staff)
      },
      POST: async ({ request, params }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })
        const clinicId = Number(params.clinicId)
        const body = await request.json()
        const existing = await prisma.user.findFirst({ where: { phone: body.phone } })
        const userId = existing?.id ?? user.id
        const staff = await prisma.staff.create({
          data: { clinicId, userId, role: 'vet', status: 'active' },
        })
        return Response.json(staff, { status: 201 })
      },
    },
  },
})
