import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '@/lib/db'
import { getOrCreateLocalUser } from '@/lib/clerk-server'

export const Route = createFileRoute('/api/visits/$visitId/items')({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })
        const visitId = Number(params.visitId)
        const body = await request.json()
        const item = await prisma.visitItem.create({
          data: {
            visitId,
            itemDate: body.itemDate,
            category: body.category,
            name: body.name,
            description: body.description,
            quantity: body.quantity,
            unitPrice: body.unitPrice,
          },
        })
        return Response.json(item)
      },
    },
  },
})
