import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '@/lib/db'
import { getOrCreateLocalUser } from '@/lib/clerk-server'

export const Route = createFileRoute('/api/products/$productId')({
  server: {
    handlers: {
      PATCH: async ({ request, params }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })
        const id = Number(params.productId)
        const body = await request.json()
        const data: Record<string, unknown> = {}
        if (body.name !== undefined) data.name = body.name
        if (body.barcode !== undefined) data.barcode = body.barcode
        if (body.category !== undefined) data.category = body.category
        if (body.description !== undefined) data.description = body.description
        if (body.price !== undefined) data.price = String(body.price)
        if (body.stock !== undefined) data.stock = body.stock !== null ? parseInt(String(body.stock)) : null
        if (body.unit !== undefined) data.unit = body.unit
        const product = await prisma.product.update({ where: { id }, data })
        return Response.json(product)
      },
      DELETE: async ({ params }) => {
        const id = Number(params.productId)
        await prisma.product.update({ where: { id }, data: { isActive: false } })
        return new Response(null, { status: 204 })
      },
    },
  },
})
