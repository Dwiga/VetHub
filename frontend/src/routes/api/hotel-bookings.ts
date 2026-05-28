import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '@/lib/db'
import { getOrCreateLocalUser } from '@/lib/clerk-server'

export const Route = createFileRoute('/api/hotel-bookings')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })
        const url = new URL(request.url)
        const status = url.searchParams.get('status') ?? undefined
        const clinicId = url.searchParams.get('clinicId') ?? undefined
        const petId = url.searchParams.get('petId') ?? undefined
        const where: Record<string, any> = {}
        if (status) where.status = status
        if (clinicId) where.hotelId = Number(clinicId)
        if (petId) where.petId = Number(petId)
        const bookings = await prisma.hotelBooking.findMany({
          where,
          orderBy: { checkIn: 'desc' },
          include: {
            pet: {
              include: {
                owner: true,
                species: true,
              },
            },
            clinic: true,
            dailyLogs: true,
          },
        })
        const enriched = bookings.map((b) => {
          const endDate = b.checkOut ? new Date(b.checkOut) : new Date()
          const daysIn = Math.max(1, Math.ceil((endDate.getTime() - new Date(b.checkIn).getTime()) / (1000 * 60 * 60 * 24)))
          const dailyFeeNum = b.dailyFee ? parseFloat(b.dailyFee) : 0
          const roomFeeTotal = dailyFeeNum * daysIn
          const creditTotal = (b as any).dailyLogs
            ? ((b as any).dailyLogs as any[]).filter((l: any) => l.type === 'credit').reduce((s: number, l: any) => s + (parseFloat(l.amount) || 0), 0)
            : 0
          return {
            ...b,
            petName: b.pet?.name ?? null,
            petSpecies: b.pet?.species?.name ?? null,
            ownerName: b.pet?.owner?.name ?? null,
            ownerPhone: b.pet?.owner?.phone ?? null,
            clinicName: b.clinic?.name ?? null,
            daysIn,
            roomFeeTotal,
            totalCost: roomFeeTotal + creditTotal,
          }
        })
        return Response.json(enriched)
      },
      POST: async ({ request }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })
        const url = new URL(request.url)
        const petId = Number(url.searchParams.get('petId'))
        const body = await request.json()
        const booking = await prisma.hotelBooking.create({
          data: {
            petId,
            hotelId: user.hotelId ?? body.hotelId,
            checkIn: body.checkIn,
            roomType: body.roomType,
            dailyFee: body.dailyFee,
            notes: body.notes,
            status: 'active',
          },
        })
        return Response.json(booking, { status: 201 })
      },
    },
  },
})
