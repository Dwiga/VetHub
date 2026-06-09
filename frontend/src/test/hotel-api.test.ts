import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Route as BookingsRoute } from '../routes/api/hotel-bookings'
import { Route as BookingDetailRoute } from '../routes/api/hotel-bookings.$bookingId'
import { Route as DailyLogsRoute } from '../routes/api/hotel-bookings.$bookingId.daily-logs'
import { Route as DailyLogDeleteRoute } from '../routes/api/hotel-bookings.$bookingId.daily-logs.$logId'
import { Route as ShareRoute } from '../routes/api/hotel-bookings.$bookingId.share'
import { Route as SummaryRoute } from '../routes/api/hotel-bookings.reports.summary'
import { prisma } from '../lib/db'
import { getOrCreateLocalUser } from '../lib/clerk-server'

vi.mock('../lib/db', () => ({
  prisma: {
    hotelBooking: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    hotelDailyLog: {
      create: vi.fn(),
      findMany: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    }
  },
}))

vi.mock('../lib/clerk-server', () => ({
  getOrCreateLocalUser: vi.fn(),
}))

describe('Hotel API Routes', () => {
  const mockUser = { id: 1, hotelId: 101, clinicId: 101 }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(getOrCreateLocalUser as any).mockResolvedValue(mockUser)
  })

  // ========== GET /api/hotel-bookings ==========
  describe('GET /api/hotel-bookings', () => {
    it('should return bookings for the user\'s hotel', async () => {
      const mockBookings = [
        { id: 1, hotelId: 101, checkIn: '2026-06-01', pet: { name: 'Fluffy' }, dailyLogs: [] }
      ]
      ;(prisma.hotelBooking.findMany as any).mockResolvedValue(mockBookings)

      const request = new Request('http://localhost/api/hotel-bookings')
      const response = await (BookingsRoute.options.server as any).handlers.GET({ request })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(1)
      expect(data[0].id).toBe(1)
      expect(prisma.hotelBooking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ hotelId: 101 })
        })
      )
    })

    it('should filter by status', async () => {
      ;(prisma.hotelBooking.findMany as any).mockResolvedValue([])
      const request = new Request('http://localhost/api/hotel-bookings?status=active')
      const response = await (BookingsRoute.options.server as any).handlers.GET({ request })

      expect(response.status).toBe(200)
      expect(prisma.hotelBooking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'active', hotelId: 101 })
        })
      )
    })

    it('should filter by petId', async () => {
      ;(prisma.hotelBooking.findMany as any).mockResolvedValue([])
      const request = new Request('http://localhost/api/hotel-bookings?petId=5')
      const response = await (BookingsRoute.options.server as any).handlers.GET({ request })

      expect(response.status).toBe(200)
      expect(prisma.hotelBooking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ hotelId: 101, petId: 5 })
        })
      )
    })

    it('should filter by clinicId matching user hotelId', async () => {
      ;(prisma.hotelBooking.findMany as any).mockResolvedValue([])
      const request = new Request('http://localhost/api/hotel-bookings?clinicId=101')
      const response = await (BookingsRoute.options.server as any).handlers.GET({ request })

      expect(response.status).toBe(200)
      expect(prisma.hotelBooking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ hotelId: 101 })
        })
      )
    })

    it('should return 403 when clinicId differs from user hotelId', async () => {
      const request = new Request('http://localhost/api/hotel-bookings?clinicId=999')
      const response = await (BookingsRoute.options.server as any).handlers.GET({ request })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('forbidden')
    })

    it('should return 401 if unauthorized', async () => {
      ;(getOrCreateLocalUser as any).mockResolvedValue(null)
      const request = new Request('http://localhost/api/hotel-bookings')
      const response = await (BookingsRoute.options.server as any).handlers.GET({ request })
      expect(response.status).toBe(401)
    })
  })

  // ========== POST /api/hotel-bookings ==========
  describe('POST /api/hotel-bookings', () => {
    it('should create a new booking', async () => {
      const newBooking = { checkIn: '2026-06-10', petId: 1 }
      ;(prisma.hotelBooking.create as any).mockResolvedValue({ id: 2, ...newBooking, hotelId: 101 })

      const request = new Request('http://localhost/api/hotel-bookings', {
        method: 'POST',
        body: JSON.stringify(newBooking)
      })
      const response = await (BookingsRoute.options.server as any).handlers.POST({ request })
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.id).toBe(2)
      expect(prisma.hotelBooking.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            checkIn: '2026-06-10',
            hotelId: 101
          })
        })
      )
    })

    it('should create booking with reservation status', async () => {
      const reservation = { checkIn: '2026-07-15', petId: 1, status: 'reserved', expectedCheckOut: '2026-07-20' }
      ;(prisma.hotelBooking.create as any).mockResolvedValue({ id: 3, ...reservation, hotelId: 101 })

      const request = new Request('http://localhost/api/hotel-bookings', {
        method: 'POST',
        body: JSON.stringify(reservation)
      })
      const response = await (BookingsRoute.options.server as any).handlers.POST({ request })
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.status).toBe('reserved')
      expect(prisma.hotelBooking.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'reserved',
            expectedCheckOut: '2026-07-20'
          })
        })
      )
    })

    it('should create booking with room type and daily fee', async () => {
      const booking = { checkIn: '2026-06-10', petId: 1, roomType: 'Deluxe', dailyFee: 150000 }
      ;(prisma.hotelBooking.create as any).mockResolvedValue({ id: 4, ...booking, hotelId: 101 })

      const request = new Request('http://localhost/api/hotel-bookings', {
        method: 'POST',
        body: JSON.stringify(booking)
      })
      const response = await (BookingsRoute.options.server as any).handlers.POST({ request })

      expect(response.status).toBe(201)
      expect(prisma.hotelBooking.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            roomType: 'Deluxe',
            dailyFee: '150000'
          })
        })
      )
    })

    it('should return 400 if no hotelId and user has no hotelId', async () => {
      ;(getOrCreateLocalUser as any).mockResolvedValue({ id: 1 })
      const request = new Request('http://localhost/api/hotel-bookings', {
        method: 'POST',
        body: JSON.stringify({ checkIn: '2026-06-10', petId: 1 })
      })
      const response = await (BookingsRoute.options.server as any).handlers.POST({ request })
      expect(response.status).toBe(400)
    })
  })

  // ========== GET /api/hotel-bookings/$bookingId ==========
  describe('GET /api/hotel-bookings/$bookingId', () => {
    it('should return enriched booking details', async () => {
      const mockBooking = {
        id: 1, hotelId: 101, checkIn: '2026-06-01', checkOut: null, dailyFee: '100000', status: 'active',
        pet: { name: 'Fluffy', species: { name: 'Cat' }, owner: { name: 'Alice', phone: '081' } },
        clinic: { name: 'Pet Hotel' },
        dailyLogs: [{ type: 'deposit', amount: '200000' }]
      }
      ;(prisma.hotelBooking.findUnique as any).mockResolvedValue(mockBooking)

      const request = new Request('http://localhost/api/hotel-bookings/1')
      const response = await (BookingDetailRoute.options.server as any).handlers.GET({
        request, params: { bookingId: '1' }
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.petName).toBe('Fluffy')
      expect(data.petSpecies).toBe('Cat')
      expect(data.ownerName).toBe('Alice')
      expect(data.ownerPhone).toBe('081')
      expect(data.clinicName).toBe('Pet Hotel')
    })

    it('should return 401 if unauthorized', async () => {
      ;(getOrCreateLocalUser as any).mockResolvedValue(null)
      const request = new Request('http://localhost/api/hotel-bookings/1')
      const response = await (BookingDetailRoute.options.server as any).handlers.GET({
        request, params: { bookingId: '1' }
      })
      expect(response.status).toBe(401)
    })

    it('should return 404 if booking not found', async () => {
      ;(prisma.hotelBooking.findUnique as any).mockResolvedValue(null)
      const request = new Request('http://localhost/api/hotel-bookings/999')
      const response = await (BookingDetailRoute.options.server as any).handlers.GET({
        request, params: { bookingId: '999' }
      })
      expect(response.status).toBe(404)
    })

    it('should return 403 if booking belongs to different hotel', async () => {
      ;(prisma.hotelBooking.findUnique as any).mockResolvedValue({ id: 1, hotelId: 999 })
      const request = new Request('http://localhost/api/hotel-bookings/1')
      const response = await (BookingDetailRoute.options.server as any).handlers.GET({
        request, params: { bookingId: '1' }
      })
      expect(response.status).toBe(403)
    })
  })

  // ========== PATCH /api/hotel-bookings/$bookingId ==========
  describe('PATCH /api/hotel-bookings/$bookingId', () => {
    it('should update booking status to active (Mulai) when checkIn is in the future', async () => {
      const existingBooking = { id: 1, hotelId: 101, status: 'reserved', checkIn: '2027-07-01' }
      const updatedBooking = { ...existingBooking, status: 'active', checkIn: expect.any(String) }
      ;(prisma.hotelBooking.findUnique as any).mockResolvedValue(existingBooking)
      ;(prisma.hotelBooking.update as any).mockResolvedValue(updatedBooking)

      const request = new Request('http://localhost/api/hotel-bookings/1', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'active' })
      })
      const response = await (BookingDetailRoute.options.server as any).handlers.PATCH({
        request, params: { bookingId: '1' }
      })

      expect(response.status).toBe(200)
      expect(prisma.hotelBooking.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'active',
            checkIn: expect.any(String)
          })
        })
      )
    })

    it('should NOT override checkIn when Mulai on booking with past checkIn', async () => {
      const pastDate = '2026-01-01'
      const existingBooking = { id: 1, hotelId: 101, status: 'reserved', checkIn: pastDate }
      ;(prisma.hotelBooking.findUnique as any).mockResolvedValue(existingBooking)
      ;(prisma.hotelBooking.update as any).mockResolvedValue({ ...existingBooking, status: 'active' })

      const request = new Request('http://localhost/api/hotel-bookings/1', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'active' })
      })
      const response = await (BookingDetailRoute.options.server as any).handlers.PATCH({
        request, params: { bookingId: '1' }
      })

      expect(response.status).toBe(200)
      const updateCall = (prisma.hotelBooking.update as any).mock.calls[0][0]
      expect(updateCall.data.status).toBe('active')
      expect(updateCall.data.checkIn).toBeUndefined()
    })

    it('should calculate room fee on checkout', async () => {
      const existingBooking = {
        id: 1, hotelId: 101, status: 'active',
        checkIn: '2026-06-01', dailyFee: '100000', dailyLogs: []
      }
      ;(prisma.hotelBooking.findUnique as any).mockResolvedValue(existingBooking)
      ;(prisma.hotelBooking.update as any).mockResolvedValue({ ...existingBooking, status: 'completed' })

      const request = new Request('http://localhost/api/hotel-bookings/1', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'completed', checkOut: '2026-06-03' })
      })
      const response = await (BookingDetailRoute.options.server as any).handlers.PATCH({
        request, params: { bookingId: '1' }
      })

      expect(response.status).toBe(200)
      expect(prisma.hotelDailyLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'credit',
            amount: '200000',
            bookingId: 1
          })
        })
      )
    })

    it('should NOT create room fee if dailyFee is 0', async () => {
      const existingBooking = {
        id: 1, hotelId: 101, status: 'active',
        checkIn: '2026-06-01', dailyFee: '0', dailyLogs: []
      }
      ;(prisma.hotelBooking.findUnique as any).mockResolvedValue(existingBooking)
      ;(prisma.hotelBooking.update as any).mockResolvedValue({ ...existingBooking, status: 'completed' })

      const request = new Request('http://localhost/api/hotel-bookings/1', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'completed', checkOut: '2026-06-05' })
      })
      const response = await (BookingDetailRoute.options.server as any).handlers.PATCH({
        request, params: { bookingId: '1' }
      })

      expect(response.status).toBe(200)
      expect(prisma.hotelDailyLog.create).not.toHaveBeenCalled()
    })

    it('should NOT create duplicate room fee if already exists', async () => {
      const existingBooking = {
        id: 1, hotelId: 101, status: 'active',
        checkIn: '2026-06-01', dailyFee: '100000',
        dailyLogs: [{ type: 'credit', description: 'Room fee (2 days × Rp 100.000)', amount: '200000' }]
      }
      ;(prisma.hotelBooking.findUnique as any).mockResolvedValue(existingBooking)
      ;(prisma.hotelBooking.update as any).mockResolvedValue({ ...existingBooking, status: 'completed' })

      const request = new Request('http://localhost/api/hotel-bookings/1', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'completed', checkOut: '2026-06-03' })
      })
      const response = await (BookingDetailRoute.options.server as any).handlers.PATCH({
        request, params: { bookingId: '1' }
      })

      expect(response.status).toBe(200)
      expect(prisma.hotelDailyLog.create).toHaveBeenCalledTimes(0)
    })

    it('should trigger completion when only checkOut is provided', async () => {
      const existingBooking = {
        id: 1, hotelId: 101, status: 'active',
        checkIn: '2026-06-01', dailyFee: '50000', dailyLogs: []
      }
      ;(prisma.hotelBooking.findUnique as any).mockResolvedValue(existingBooking)
      ;(prisma.hotelBooking.update as any).mockResolvedValue({ ...existingBooking, checkOut: '2026-06-02' })

      const request = new Request('http://localhost/api/hotel-bookings/1', {
        method: 'PATCH',
        body: JSON.stringify({ checkOut: '2026-06-02' })
      })
      const response = await (BookingDetailRoute.options.server as any).handlers.PATCH({
        request, params: { bookingId: '1' }
      })

      expect(response.status).toBe(200)
      expect(prisma.hotelDailyLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'credit',
            amount: '50000',
            bookingId: 1
          })
        })
      )
    })

    it('should return 401 for unauthorized', async () => {
      ;(getOrCreateLocalUser as any).mockResolvedValue(null)
      const request = new Request('http://localhost/api/hotel-bookings/1', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'active' })
      })
      const response = await (BookingDetailRoute.options.server as any).handlers.PATCH({
        request, params: { bookingId: '1' }
      })
      expect(response.status).toBe(401)
    })

    it('should return 404 if booking not found', async () => {
      ;(prisma.hotelBooking.findUnique as any).mockResolvedValue(null)
      const request = new Request('http://localhost/api/hotel-bookings/999', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'active' })
      })
      const response = await (BookingDetailRoute.options.server as any).handlers.PATCH({
        request, params: { bookingId: '999' }
      })
      expect(response.status).toBe(404)
    })

    it('should return 403 if booking belongs to different hotel', async () => {
      ;(prisma.hotelBooking.findUnique as any).mockResolvedValue({ id: 1, hotelId: 999 })
      const request = new Request('http://localhost/api/hotel-bookings/1', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'active' })
      })
      const response = await (BookingDetailRoute.options.server as any).handlers.PATCH({
        request, params: { bookingId: '1' }
      })
      expect(response.status).toBe(403)
    })
  })

  // ========== DELETE /api/hotel-bookings/$bookingId ==========
  describe('DELETE /api/hotel-bookings/$bookingId', () => {
    it('should delete a booking', async () => {
      ;(prisma.hotelBooking.findUnique as any).mockResolvedValue({ id: 1, hotelId: 101 })
      ;(prisma.hotelBooking.delete as any).mockResolvedValue({})

      const request = new Request('http://localhost/api/hotel-bookings/1', { method: 'DELETE' })
      const response = await (BookingDetailRoute.options.server as any).handlers.DELETE({
        request, params: { bookingId: '1' }
      })

      expect(response.status).toBe(204)
      expect(prisma.hotelBooking.delete).toHaveBeenCalledWith({ where: { id: 1 } })
    })

    it('should return 401 if unauthorized', async () => {
      ;(getOrCreateLocalUser as any).mockResolvedValue(null)
      const request = new Request('http://localhost/api/hotel-bookings/1', { method: 'DELETE' })
      const response = await (BookingDetailRoute.options.server as any).handlers.DELETE({
        request, params: { bookingId: '1' }
      })
      expect(response.status).toBe(401)
    })

    it('should return 404 if booking not found', async () => {
      ;(prisma.hotelBooking.findUnique as any).mockResolvedValue(null)
      const request = new Request('http://localhost/api/hotel-bookings/999', { method: 'DELETE' })
      const response = await (BookingDetailRoute.options.server as any).handlers.DELETE({
        request, params: { bookingId: '999' }
      })
      expect(response.status).toBe(404)
    })

    it('should return 403 if booking belongs to different hotel', async () => {
      ;(prisma.hotelBooking.findUnique as any).mockResolvedValue({ id: 1, hotelId: 999 })
      const request = new Request('http://localhost/api/hotel-bookings/1', { method: 'DELETE' })
      const response = await (BookingDetailRoute.options.server as any).handlers.DELETE({
        request, params: { bookingId: '1' }
      })
      expect(response.status).toBe(403)
    })
  })

  // ========== Daily Logs: GET + POST ==========
  describe('GET /api/hotel-bookings/$bookingId/daily-logs', () => {
    it('should return daily logs for a booking', async () => {
      const mockLogs = [
        { id: 10, bookingId: 1, type: 'deposit', amount: '50000', logDate: '2026-06-01' },
        { id: 11, bookingId: 1, type: 'credit', amount: '20000', logDate: '2026-06-02' },
      ]
      ;(prisma.hotelBooking.findUnique as any).mockResolvedValue({ id: 1, hotelId: 101 })
      ;(prisma.hotelDailyLog.findMany as any).mockResolvedValue(mockLogs)

      const request = new Request('http://localhost/api/hotel-bookings/1/daily-logs')
      const response = await (DailyLogsRoute.options.server as any).handlers.GET({
        request, params: { bookingId: '1' }
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(2)
      expect(data[0].type).toBe('deposit')
      expect(data[1].type).toBe('credit')
    })

    it('should return 401 if unauthorized', async () => {
      ;(getOrCreateLocalUser as any).mockResolvedValue(null)
      const request = new Request('http://localhost/api/hotel-bookings/1/daily-logs')
      const response = await (DailyLogsRoute.options.server as any).handlers.GET({
        request, params: { bookingId: '1' }
      })
      expect(response.status).toBe(401)
    })

    it('should return 404 if booking not found', async () => {
      ;(prisma.hotelBooking.findUnique as any).mockResolvedValue(null)
      const request = new Request('http://localhost/api/hotel-bookings/999/daily-logs')
      const response = await (DailyLogsRoute.options.server as any).handlers.GET({
        request, params: { bookingId: '999' }
      })
      expect(response.status).toBe(404)
    })

    it('should return 403 if booking belongs to different hotel', async () => {
      ;(prisma.hotelBooking.findUnique as any).mockResolvedValue({ id: 1, hotelId: 999 })
      const request = new Request('http://localhost/api/hotel-bookings/1/daily-logs')
      const response = await (DailyLogsRoute.options.server as any).handlers.GET({
        request, params: { bookingId: '1' }
      })
      expect(response.status).toBe(403)
    })
  })

  describe('POST /api/hotel-bookings/$bookingId/daily-logs', () => {
    it('should create a daily log', async () => {
      const logData = { type: 'deposit', amount: '50000', description: 'DP' }
      ;(prisma.hotelBooking.findUnique as any).mockResolvedValue({ id: 1, hotelId: 101 })
      ;(prisma.hotelDailyLog.create as any).mockResolvedValue({ id: 10, ...logData, bookingId: 1 })

      const request = new Request('http://localhost/api/hotel-bookings/1/daily-logs', {
        method: 'POST',
        body: JSON.stringify(logData)
      })
      const response = await (DailyLogsRoute.options.server as any).handlers.POST({
        request, params: { bookingId: '1' }
      })
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.id).toBe(10)
    })

    it('should create a credit log with description', async () => {
      const logData = { type: 'credit', amount: '30000', description: 'Grooming', logDate: '2026-06-03' }
      ;(prisma.hotelBooking.findUnique as any).mockResolvedValue({ id: 1, hotelId: 101 })
      ;(prisma.hotelDailyLog.create as any).mockResolvedValue({ id: 11, ...logData, bookingId: 1 })

      const request = new Request('http://localhost/api/hotel-bookings/1/daily-logs', {
        method: 'POST',
        body: JSON.stringify(logData)
      })
      const response = await (DailyLogsRoute.options.server as any).handlers.POST({
        request, params: { bookingId: '1' }
      })

      expect(response.status).toBe(201)
      expect(prisma.hotelDailyLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'credit',
            description: 'Grooming',
            amount: '30000'
          })
        })
      )
    })

    it('should return 401 if unauthorized', async () => {
      ;(getOrCreateLocalUser as any).mockResolvedValue(null)
      const request = new Request('http://localhost/api/hotel-bookings/1/daily-logs', {
        method: 'POST',
        body: JSON.stringify({ type: 'deposit', amount: '50000' })
      })
      const response = await (DailyLogsRoute.options.server as any).handlers.POST({
        request, params: { bookingId: '1' }
      })
      expect(response.status).toBe(401)
    })

    it('should return 404 if booking not found', async () => {
      ;(prisma.hotelBooking.findUnique as any).mockResolvedValue(null)
      const request = new Request('http://localhost/api/hotel-bookings/999/daily-logs', {
        method: 'POST',
        body: JSON.stringify({ type: 'deposit', amount: '50000' })
      })
      const response = await (DailyLogsRoute.options.server as any).handlers.POST({
        request, params: { bookingId: '999' }
      })
      expect(response.status).toBe(404)
    })
  })

  // ========== DELETE /api/hotel-bookings/$bookingId/daily-logs/$logId ==========
  describe('DELETE /api/hotel-bookings/$bookingId/daily-logs/$logId', () => {
    it('should delete a daily log', async () => {
      const mockLog = { id: 10, booking: { hotelId: 101 } }
      ;(prisma.hotelDailyLog.findUnique as any).mockResolvedValue(mockLog)
      ;(prisma.hotelDailyLog.delete as any).mockResolvedValue({})

      const request = new Request('http://localhost/api/hotel-bookings/1/daily-logs/10', { method: 'DELETE' })
      const response = await (DailyLogDeleteRoute.options.server as any).handlers.DELETE({
        request, params: { bookingId: '1', logId: '10' }
      })

      expect(response.status).toBe(204)
      expect(prisma.hotelDailyLog.delete).toHaveBeenCalledWith({ where: { id: 10 } })
    })

    it('should return 401 if unauthorized', async () => {
      ;(getOrCreateLocalUser as any).mockResolvedValue(null)
      const request = new Request('http://localhost/api/hotel-bookings/1/daily-logs/10', { method: 'DELETE' })
      const response = await (DailyLogDeleteRoute.options.server as any).handlers.DELETE({
        request, params: { bookingId: '1', logId: '10' }
      })
      expect(response.status).toBe(401)
    })

    it('should return 404 if log not found', async () => {
      ;(prisma.hotelDailyLog.findUnique as any).mockResolvedValue(null)
      const request = new Request('http://localhost/api/hotel-bookings/1/daily-logs/999', { method: 'DELETE' })
      const response = await (DailyLogDeleteRoute.options.server as any).handlers.DELETE({
        request, params: { bookingId: '1', logId: '999' }
      })
      expect(response.status).toBe(404)
    })

    it('should return 403 if log booking belongs to different hotel', async () => {
      ;(prisma.hotelDailyLog.findUnique as any).mockResolvedValue({ id: 10, booking: { hotelId: 999 } })
      const request = new Request('http://localhost/api/hotel-bookings/1/daily-logs/10', { method: 'DELETE' })
      const response = await (DailyLogDeleteRoute.options.server as any).handlers.DELETE({
        request, params: { bookingId: '1', logId: '10' }
      })
      expect(response.status).toBe(403)
    })
  })

  // ========== Share API ==========
  describe('POST /api/hotel-bookings/$bookingId/share', () => {
    it('should generate a share token', async () => {
      ;(prisma.hotelBooking.findUnique as any).mockResolvedValue({ id: 1, hotelId: 101, shareToken: null })
      ;(prisma.hotelBooking.update as any).mockResolvedValue({ id: 1, shareToken: 'abc1234567' })

      const request = new Request('http://localhost/api/hotel-bookings/1/share', { method: 'POST' })
      const response = await (ShareRoute.options.server as any).handlers.POST({
        request, params: { bookingId: '1' }
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.token).toBeDefined()
      expect(prisma.hotelBooking.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({ shareToken: expect.any(String) })
        })
      )
    })

    it('should reuse existing share token', async () => {
      ;(prisma.hotelBooking.findUnique as any).mockResolvedValue({ id: 1, hotelId: 101, shareToken: 'existing123' })

      const request = new Request('http://localhost/api/hotel-bookings/1/share', { method: 'POST' })
      const response = await (ShareRoute.options.server as any).handlers.POST({
        request, params: { bookingId: '1' }
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.token).toBe('existing123')
      expect(prisma.hotelBooking.update).not.toHaveBeenCalled()
    })

    it('should return 401 if unauthorized', async () => {
      ;(getOrCreateLocalUser as any).mockResolvedValue(null)
      const request = new Request('http://localhost/api/hotel-bookings/1/share', { method: 'POST' })
      const response = await (ShareRoute.options.server as any).handlers.POST({
        request, params: { bookingId: '1' }
      })
      expect(response.status).toBe(401)
    })

    it('should return 404 if booking not found', async () => {
      ;(prisma.hotelBooking.findUnique as any).mockResolvedValue(null)
      const request = new Request('http://localhost/api/hotel-bookings/999/share', { method: 'POST' })
      const response = await (ShareRoute.options.server as any).handlers.POST({
        request, params: { bookingId: '999' }
      })
      expect(response.status).toBe(404)
    })

    it('should return 403 if booking belongs to different hotel', async () => {
      ;(prisma.hotelBooking.findUnique as any).mockResolvedValue({ id: 1, hotelId: 999 })
      const request = new Request('http://localhost/api/hotel-bookings/1/share', { method: 'POST' })
      const response = await (ShareRoute.options.server as any).handlers.POST({
        request, params: { bookingId: '1' }
      })
      expect(response.status).toBe(403)
    })
  })

  // ========== Reports Summary API ==========
  describe('GET /api/hotel-bookings/reports/summary', () => {
    it('should return summary report', async () => {
      ;(prisma.hotelBooking.findMany as any).mockResolvedValue([
        {
          id: 1, status: 'active',
          dailyLogs: [{ type: 'deposit', amount: '100000' }, { type: 'credit', amount: '30000', description: 'Food' }],
          checkIn: '2026-06-01', dailyFee: '50000', checkOut: null,
          pet: { name: 'Fluffy', owner: { phone: '081234' } }
        }
      ])

      const request = new Request('http://localhost/api/hotel-bookings/reports/summary')
      const response = await (SummaryRoute.options.server as any).handlers.GET({ request })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.activeStays).toBe(1)
      expect(data.totalGuests).toBe(1)
      expect(data.totalRevenue).toBe(100000)
      expect(data.topServices).toHaveLength(1)
      expect(data.topServices[0].name).toBe('Food')
      expect(data.guests).toHaveLength(1)
      expect(data.guests[0].petName).toBe('Fluffy')
    })

    it('should filter bookings by date range', async () => {
      ;(prisma.hotelBooking.findMany as any).mockResolvedValue([])

      const request = new Request('http://localhost/api/hotel-bookings/reports/summary?startDate=2026-06-01&endDate=2026-06-30')
      const response = await (SummaryRoute.options.server as any).handlers.GET({ request })

      expect(response.status).toBe(200)
      expect(prisma.hotelBooking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            hotelId: 101,
            checkIn: { gte: '2026-06-01', lte: '2026-06-30' }
          })
        })
      )
    })

    it('should handle empty bookings gracefully', async () => {
      ;(prisma.hotelBooking.findMany as any).mockResolvedValue([])

      const request = new Request('http://localhost/api/hotel-bookings/reports/summary')
      const response = await (SummaryRoute.options.server as any).handlers.GET({ request })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.totalGuests).toBe(0)
      expect(data.activeStays).toBe(0)
      expect(data.totalRevenue).toBe(0)
      expect(data.topServices).toHaveLength(0)
      expect(data.guests).toHaveLength(0)
    })

    it('should aggregate multiple bookings correctly', async () => {
      ;(prisma.hotelBooking.findMany as any).mockResolvedValue([
        {
          id: 1, status: 'active',
          dailyLogs: [{ type: 'deposit', amount: '200000' }],
          checkIn: '2026-06-01', dailyFee: '100000', checkOut: null,
          pet: { name: 'Fluffy', owner: { phone: '081' } }
        },
        {
          id: 2, status: 'completed',
          dailyLogs: [{ type: 'deposit', amount: '150000' }, { type: 'credit', amount: '25000', description: 'Grooming' }],
          checkIn: '2026-06-05', dailyFee: '75000', checkOut: '2026-06-07',
          pet: { name: 'Buddy', owner: { phone: '082' } }
        }
      ])

      const request = new Request('http://localhost/api/hotel-bookings/reports/summary')
      const response = await (SummaryRoute.options.server as any).handlers.GET({ request })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.totalGuests).toBe(2)
      expect(data.activeStays).toBe(1)
      expect(data.totalRevenue).toBe(350000)
      expect(data.guests).toHaveLength(2)
    })

    it('should return 401 if unauthorized', async () => {
      ;(getOrCreateLocalUser as any).mockResolvedValue(null)
      const request = new Request('http://localhost/api/hotel-bookings/reports/summary')
      const response = await (SummaryRoute.options.server as any).handlers.GET({ request })
      expect(response.status).toBe(401)
    })

    it('should return 403 if user has no hotelId', async () => {
      ;(getOrCreateLocalUser as any).mockResolvedValue({ id: 1, hotelId: null, clinicId: null })
      const request = new Request('http://localhost/api/hotel-bookings/reports/summary')
      const response = await (SummaryRoute.options.server as any).handlers.GET({ request })
      expect(response.status).toBe(403)
    })
  })
})
