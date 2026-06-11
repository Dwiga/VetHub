import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '@/lib/db'
import { getOrCreateLocalUser } from '@/lib/clerk-server'

export const Route = createFileRoute('/api/product-sales')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })
        const url = new URL(request.url)
        const clinicId = Number(url.searchParams.get('clinicId') ?? '0')
        const startDate = url.searchParams.get('startDate')
        const endDate = url.searchParams.get('endDate')

        const where: Record<string, unknown> = {}
        if (clinicId) where.clinicId = clinicId
        if (startDate || endDate) {
          where.saleDate = {
            ...(startDate ? { gte: startDate } : {}),
            ...(endDate ? { lte: endDate } : {}),
          }
        }

        const sales = await prisma.productSale.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          include: { items: true },
          take: 200,
        })
        return Response.json(sales)
      },
      POST: async ({ request }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })
        const body = await request.json()

        const sale = await prisma.productSale.create({
          data: {
            clinicId: body.clinicId,
            buyerId: body.buyerId || null,
            buyerName: body.buyerName || null,
            buyerPhone: body.buyerPhone || null,
            total: String(body.total ?? 0),
            paid: String(body.paid ?? 0),
            saleDate: body.saleDate || new Date().toISOString().split('T')[0],
            items: {
              create: body.items.map((item: any) => ({
                productId: item.productId,
                productName: item.productName,
                price: String(item.price ?? 0),
                quantity: item.quantity ?? 1,
                subtotal: String(item.subtotal ?? 0),
              })),
            },
          },
          include: { items: true },
        })

        for (const item of body.items) {
          if (item.productId) {
            await prisma.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: item.quantity ?? 1 } },
            })
          }
        }

        return Response.json(sale, { status: 201 })
      },
    },
  },
})
