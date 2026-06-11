import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '@/lib/db'
import { getOrCreateLocalUser } from '@/lib/clerk-server'

export const Route = createFileRoute('/api/hotel/rooms/$roomId')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })
        const roomId = Number(params.roomId)
        const room = await prisma.room.findUnique({
          where: { id: roomId },
          include: {
            bookings: {
              where: { status: { in: ['active', 'reserved'] } },
              select: { id: true, checkIn: true, checkOut: true, expectedCheckOut: true, status: true },
            },
          },
        })
        if (!room) return Response.json({ error: 'not found' }, { status: 404 })
        return Response.json(room)
      },
      PATCH: async ({ request, params }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })
        const roomId = Number(params.roomId)
        const body = await request.json()
        const data: Record<string, any> = {}
        if (body.name !== undefined) data.name = body.name
        if (body.type !== undefined) data.type = body.type
        if (body.capacity !== undefined) data.capacity = body.capacity ? parseInt(body.capacity) : null
        if (body.dailyFee !== undefined) data.dailyFee = body.dailyFee ? String(body.dailyFee) : null
        if (body.status !== undefined) data.status = body.status
        if (body.isActive !== undefined) data.isActive = body.isActive
        const room = await prisma.room.update({ where: { id: roomId }, data })
        return Response.json(room)
      },
      DELETE: async ({ request, params }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })
        const roomId = Number(params.roomId)
        await prisma.room.update({ where: { id: roomId }, data: { isActive: false } })
        return new Response(null, { status: 204 })
      },
    },
  },
})
