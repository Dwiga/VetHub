import { describe, it, expect } from 'vitest'
import { calculateDaysIn, calculateRoomFee, calculateBalance } from '../lib/hotel-utils'

describe('hotel-utils', () => {
  describe('calculateDaysIn', () => {
    it('should return 1 day for same day check-in and check-out', () => {
      expect(calculateDaysIn({ checkIn: '2026-06-01', checkOut: '2026-06-01' })).toBe(1)
    })

    it('should return 1 day for 24-hour stay', () => {
      expect(calculateDaysIn({ checkIn: '2026-06-01', checkOut: '2026-06-02' })).toBe(1)
    })

    it('should return 2 days for 2-day difference', () => {
      expect(calculateDaysIn({ checkIn: '2026-06-01', checkOut: '2026-06-03' })).toBe(2)
    })

    it('should return at least 1 day for past check-in without check-out', () => {
      const daysIn = calculateDaysIn({ checkIn: '2026-01-01' })
      expect(daysIn).toBeGreaterThanOrEqual(1)
    })

    it('should return at least 1 day for future check-in without check-out', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 5)
      const daysIn = calculateDaysIn({ checkIn: futureDate.toISOString().split('T')[0] })
      expect(daysIn).toBe(1)
    })
  })

  describe('calculateRoomFee', () => {
    it('should calculate room fee from dailyFee string', () => {
      const booking = { checkIn: '2026-06-01', checkOut: '2026-06-03', dailyFee: '100000' }
      const result = calculateRoomFee(booking)
      expect(result.dailyFeeNum).toBe(100000)
      expect(result.roomFeeTotal).toBe(200000)
    })

    it('should return zero when dailyFee is missing', () => {
      const booking = { checkIn: '2026-06-01', checkOut: '2026-06-03' }
      const result = calculateRoomFee(booking)
      expect(result.dailyFeeNum).toBe(0)
      expect(result.roomFeeTotal).toBe(0)
    })

    it('should return zero when dailyFee is null', () => {
      const booking = { checkIn: '2026-06-01', checkOut: '2026-06-03', dailyFee: null }
      const result = calculateRoomFee(booking)
      expect(result.dailyFeeNum).toBe(0)
      expect(result.roomFeeTotal).toBe(0)
    })
  })

  describe('calculateBalance', () => {
    it('should compute full financials with deposits and credits', () => {
      const booking = {
        checkIn: '2026-06-01',
        checkOut: '2026-06-03',
        dailyFee: '100000',
        dailyLogs: [
          { type: 'deposit', amount: '250000', description: 'Down payment' },
          { type: 'credit', amount: '50000', description: 'Grooming' },
        ],
      }
      const result = calculateBalance(booking)
      expect(result.roomFeeTotal).toBe(200000)
      expect(result.totalDeposits).toBe(250000)
      expect(result.totalCredits).toBe(250000) // 200000 room fee + 50000 grooming
      expect(result.balance).toBe(0)
    })

    it('should handle zero dailyFee', () => {
      const booking = {
        checkIn: '2026-06-01',
        checkOut: '2026-06-02',
        dailyLogs: [
          { type: 'deposit', amount: '50000' },
        ],
      }
      const result = calculateBalance(booking)
      expect(result.roomFeeTotal).toBe(0)
      expect(result.totalDeposits).toBe(50000)
      expect(result.balance).toBe(50000)
    })

    it('should handle empty dailyLogs', () => {
      const booking = {
        checkIn: '2026-06-01',
        checkOut: '2026-06-03',
        dailyFee: '50000',
        dailyLogs: [],
      }
      const result = calculateBalance(booking)
      expect(result.roomFeeTotal).toBe(100000)
      expect(result.totalDeposits).toBe(0)
      expect(result.totalCredits).toBe(100000)
      expect(result.balance).toBe(-100000)
    })
  })
})
