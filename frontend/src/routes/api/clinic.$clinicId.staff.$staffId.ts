import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '@/lib/db'
import { getOrCreateLocalUser } from '@/lib/clerk-server'

export const Route = createFileRoute('/api/clinic/$clinicId/staff/$staffId')({
  server: {
    handlers: {
      DELETE: async ({ params }) => {
        const staffId = Number(params.staffId)
        await prisma.staff.delete({ where: { id: staffId } })
        return new Response(null, { status: 204 })
      },
    },
  },
})
