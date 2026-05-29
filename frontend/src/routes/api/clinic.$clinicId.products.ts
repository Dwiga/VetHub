import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '@/lib/db'
import { getOrCreateLocalUser } from '@/lib/clerk-server'

export const Route = createFileRoute('/api/clinic/$clinicId/products')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })
        const clinicId = Number(params.clinicId)
        const products = await prisma.product.findMany({
          where: { clinicId, isActive: true },
          orderBy: { name: 'asc' },
        })
        return Response.json(products)
      },
      POST: async ({ request, params }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })
        const clinicId = Number(params.clinicId)
        const body = await request.json()
        const product = await prisma.product.create({
          data: {
            clinicId,
            name: body.name,
            category: body.category,
            description: body.description,
            price: String(body.price ?? 0),
            stock: body.stock ? parseInt(body.stock) : undefined,
            unit: body.unit,
          },
        })
        return Response.json(product, { status: 201 })
      },
    },
  },
})
