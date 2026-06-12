import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '@/lib/db'
import { getOrCreateLocalUser } from '@/lib/clerk-server'

export const Route = createFileRoute('/api/product-reports')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })
        const url = new URL(request.url)
        const clinicId = Number(url.searchParams.get('clinicId') ?? '0')
        const period = url.searchParams.get('period') ?? 'monthly'
        const date = url.searchParams.get('date') ?? new Date().toISOString().split('T')[0]
        const startDate = url.searchParams.get('startDate')
        const endDate = url.searchParams.get('endDate')

        const products = await prisma.product.findMany({
          where: { clinicId, isActive: true },
          orderBy: { name: 'asc' },
        })

        let saleWhere: Record<string, unknown> = { clinicId }
        if (startDate || endDate) {
          saleWhere.saleDate = {
            ...(startDate ? { gte: startDate } : {}),
            ...(endDate ? { lte: endDate } : {}),
          }
        }

        const sales = await prisma.productSale.findMany({
          where: saleWhere,
          include: { items: true },
          orderBy: { saleDate: 'asc' },
        })

        let totalRevenue = 0
        let totalSales = sales.length
        for (const s of sales) {
          totalRevenue += parseFloat(s.total || '0')
        }

        const productSalesMap = new Map<number, { name: string; quantity: number; revenue: number }>()
        for (const p of products) {
          productSalesMap.set(p.id, { name: p.name, quantity: 0, revenue: 0 })
        }
        for (const s of sales) {
          for (const item of s.items) {
            const entry = productSalesMap.get(item.productId)
            if (entry) {
              entry.quantity += item.quantity
              entry.revenue += parseFloat(item.subtotal || '0')
            }
          }
        }

        const topProducts = [...productSalesMap.values()]
          .filter(p => p.quantity > 0)
          .sort((a, b) => b.revenue - a.revenue)

        const dailyMap = new Map<string, { sales: number; revenue: number }>()
        for (const s of sales) {
          const key = s.saleDate || 'unknown'
          if (!dailyMap.has(key)) dailyMap.set(key, { sales: 0, revenue: 0 })
          const entry = dailyMap.get(key)!
          entry.sales++
          entry.revenue += parseFloat(s.total || '0')
        }

        const sortedLabels = [...dailyMap.keys()].sort()
        const reportLabels: string[] = []
        const salesCounts: number[] = []
        const revenues: number[] = []
        for (const label of sortedLabels) {
          const d = dailyMap.get(label)!
          reportLabels.push(label)
          salesCounts.push(d.sales)
          revenues.push(d.revenue)
        }

        const stockSummary = products.map(p => ({
          id: p.id,
          name: p.name,
          stock: p.stock ?? 0,
          unit: p.unit ?? '',
          price: p.price,
          barcode: p.barcode,
          category: p.category,
        }))

        return Response.json({
          totalRevenue,
          totalSales,
          topProducts,
          stockSummary,
          labels: reportLabels,
          salesCounts,
          revenues,
        })
      },
    },
  },
})
