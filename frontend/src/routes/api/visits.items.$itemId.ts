import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '@/lib/db'
import { getOrCreateLocalUser } from '@/lib/clerk-server'

export const Route = createFileRoute('/api/visits/items/$itemId')({
  server: {
    handlers: {
      PATCH: async ({ request, params }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })
        const itemId = Number(params.itemId)
        const body = await request.json()
        const data: Record<string, any> = { ...body }
        if (body.quantity !== undefined || body.unitPrice !== undefined) {
          const existing = await prisma.visitItem.findUnique({ where: { id: itemId } })
          if (existing) {
            data.totalPrice = (body.quantity ?? existing.quantity) * (body.unitPrice ?? existing.unitPrice)
          }
        }
        const updated = await prisma.visitItem.update({ where: { id: itemId }, data })
        return Response.json(updated)
      },
      DELETE: async ({ params }) => {
        const itemId = Number(params.itemId)
        await prisma.visitItem.delete({ where: { id: itemId } })
        return new Response(null, { status: 204 })
      },
    },
  },
})
