import {
  computeDaysIn,
  computeRoomFee,
  computeFinancials,
  type HotelBookingBase,
  type HotelBookingWithFee,
  type HotelBookingWithLogs,
} from './hotel-enrichment'

export function calculateDaysIn(booking: HotelBookingBase): number {
  return computeDaysIn(booking)
}

export function calculateRoomFee(booking: HotelBookingWithFee): { dailyFeeNum: number; roomFeeTotal: number } {
  return computeRoomFee(booking)
}

export function calculateBalance(booking: HotelBookingWithLogs): {
  daysIn: number
  dailyFeeNum: number
  roomFeeTotal: number
  totalDeposits: number
  totalCredits: number
  balance: number
} {
  return computeFinancials(booking)
}
