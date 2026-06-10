import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '@/lib/db'
import { getOrCreateLocalUser } from '@/lib/clerk-server'
import { enrichHotelBooking } from '@/lib/hotel-enrichment'

export const Route = createFileRoute('/api/hotel-bookings')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })
        const userHotelId = user.hotelId ?? user.clinicId
        const url = new URL(request.url)
        const status = url.searchParams.get('status') ?? undefined
        const clinicId = url.searchParams.get('clinicId') ?? undefined
        const petId = url.searchParams.get('petId') ?? undefined
        const where: Record<string, any> = {}
        if (status) where.status = status
        if (clinicId) {
          const requestedHotelId = Number(clinicId)
          if (!userHotelId || requestedHotelId !== userHotelId) {
            return Response.json({ error: 'forbidden' }, { status: 403 })
          }
          where.hotelId = requestedHotelId
        } else if (userHotelId) {
          where.hotelId = userHotelId
        }
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
        const ownerPhones = bookings
          .filter((b) => !b.pet.owner && b.pet.ownerPhone)
          .map((b) => b.pet.ownerPhone!)
        const uniquePhones = [...new Set(ownerPhones)]
        const guestContacts = uniquePhones.length > 0
          ? await prisma.guestContact.findMany({ where: { phone: { in: uniquePhones } } })
          : []
        const guestMap = new Map(guestContacts.map((g) => [g.phone, g]))

        const enriched = bookings.map((b) => {
          const petOwnerPhone = (b.pet as any).ownerPhone as string | null | undefined
          const guestContact = (!b.pet.owner && petOwnerPhone) ? (guestMap.get(petOwnerPhone) ?? null) : null
          return enrichHotelBooking(b, guestContact)
        })
        return Response.json(enriched)
      },
      POST: async ({ request }) => {
        const user = await getOrCreateLocalUser(request)
        if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })
        const userHotelId = user.hotelId ?? user.clinicId
        const url = new URL(request.url)
        const body = await request.json()

        const petId = Number(url.searchParams.get('petId') || body.petId) || undefined
        const hotelId = userHotelId ?? body.hotelId ?? body.clinicId
        if (!hotelId) return Response.json({ error: 'missing hotelId' }, { status: 400 })

        const booking = await prisma.hotelBooking.create({
          data: {
            petId,
            hotelId,
            checkIn: body.checkIn,
            expectedCheckOut: body.expectedCheckOut,
            roomType: body.roomType,
            dailyFee: body.dailyFee ? String(body.dailyFee) : undefined,
            notes: body.notes,
            status: body.status ?? 'active',
          },
        })
        return Response.json(booking, { status: 201 })
      },
    },
  },
})
