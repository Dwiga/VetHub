import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '@/lib/db'
import { getOrCreateLocalUser } from '@/lib/clerk-server'
import crypto from 'node:crypto'

export const Route = createFileRoute('/api/visits/$visitId/share')({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })
        const visitId = Number(params.visitId)
        const visit = await prisma.visit.findUnique({
          where: { id: visitId },
          include: { pet: { include: { species: true, owner: true } } },
        })
        if (!visit) return Response.json({ error: 'not found' }, { status: 404 })

        let shareToken = visit.shareToken
        if (!shareToken) {
          shareToken = crypto.randomBytes(16).toString('hex')
          await prisma.visit.update({
            where: { id: visitId },
            data: { shareToken },
          })
        }

        const origin = request.headers.get('origin') || ''
        const petName = visit.pet?.name ?? 'Pet'
        const shareUrl = `${origin}/share/vet/${shareToken}`
        return Response.json({ shareUrl, petName })
      },
    },
  },
})
