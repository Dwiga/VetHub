import { describe, it, expect } from 'vitest'
import { computeDaysIn, computeRoomFee, computeFinancials } from '../lib/hotel-enrichment'

describe('hotel-enrichment', () => {
  describe('computeDaysIn', () => {
    it('should return 1 day for same day check-in and check-out', () => {
      const booking = { checkIn: '2026-06-01', checkOut: '2026-06-01' }
      expect(computeDaysIn(booking)).toBe(1)
    })

    it('should return 1 day for 1 day difference', () => {
      const booking = { checkIn: '2026-06-01', checkOut: '2026-06-02' }
      expect(computeDaysIn(booking)).toBe(1)
    })

    it('should return 2 days for 2 days difference', () => {
      const booking = { checkIn: '2026-06-01', checkOut: '2026-06-03' }
      expect(computeDaysIn(booking)).toBe(2)
    })
  })

  describe('computeRoomFee', () => {
    it('should calculate room fee correctly', () => {
      const booking = { checkIn: '2026-06-01', checkOut: '2026-06-03', dailyFee: '100000' }
      const { dailyFeeNum, roomFeeTotal } = computeRoomFee(booking)
      expect(dailyFeeNum).toBe(100000)
      expect(roomFeeTotal).toBe(200000)
    })

    it('should handle missing dailyFee', () => {
      const booking = { checkIn: '2026-06-01', checkOut: '2026-06-03' }
      const { dailyFeeNum, roomFeeTotal } = computeRoomFee(booking)
      expect(dailyFeeNum).toBe(0)
      expect(roomFeeTotal).toBe(0)
    })
  })

  describe('computeFinancials', () => {
    it('should calculate balance correctly', () => {
      const booking = {
        checkIn: '2026-06-01',
        checkOut: '2026-06-03',
        dailyFee: '100000',
        dailyLogs: [
          { type: 'deposit', amount: '250000', description: 'Down payment' },
          { type: 'credit', amount: '50000', description: 'Grooming' },
        ],
      }
      const { roomFeeTotal, totalDeposits, totalCredits, balance } = computeFinancials(booking)
      expect(roomFeeTotal).toBe(200000)
      expect(totalDeposits).toBe(250000)
      expect(totalCredits).toBe(250000) // 200000 room fee + 50000 grooming
      expect(balance).toBe(0)
    })
  })
})
