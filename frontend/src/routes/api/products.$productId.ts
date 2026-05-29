import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '@/lib/db'

export const Route = createFileRoute('/api/products/$productId')({
  server: {
    handlers: {
      DELETE: async ({ params }) => {
        const id = Number(params.productId)
        await prisma.product.update({ where: { id }, data: { isActive: false } })
        return new Response(null, { status: 204 })
      },
    },
  },
})
