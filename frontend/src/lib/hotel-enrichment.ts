export interface HotelBookingBase {
  checkIn: string
  checkOut?: string | null
}

export interface HotelBookingWithFee extends HotelBookingBase {
  dailyFee?: string | null
}

export interface HotelBookingWithLogs extends HotelBookingWithFee {
  dailyLogs?: Array<{ type: string; amount: string; description?: string | null }>
}

export interface HotelBookingWithRelations {
  id: number
  checkIn: string
  checkOut: string | null
  dailyFee: string | null
  dailyLogs?: Array<{ type: string; amount: string; description?: string | null }>
  pet?: { name: string | null; species?: { name: string | null } | null; owner?: { name: string | null; phone: string | null } | null } | null
  clinic?: { name: string | null; phone?: string | null; address?: string | null } | null
}

export function computeDaysIn(booking: HotelBookingBase): number {
  const endDate = booking.checkOut ? new Date(booking.checkOut) : new Date()
  return Math.max(
    1,
    Math.ceil(
      (endDate.getTime() - new Date(booking.checkIn).getTime()) /
        (1000 * 60 * 60 * 24)
    )
  )
}

export function computeRoomFee(booking: HotelBookingWithFee): { dailyFeeNum: number; roomFeeTotal: number } {
  const dailyFeeNum = booking.dailyFee ? parseFloat(booking.dailyFee) : 0
  const daysIn = computeDaysIn(booking)
  return { dailyFeeNum, roomFeeTotal: dailyFeeNum * daysIn }
}

export function computeFinancials(booking: HotelBookingWithLogs) {
  const { dailyFeeNum, roomFeeTotal } = computeRoomFee(booking)
  const daysIn = computeDaysIn(booking)
  const dailyLogs = booking.dailyLogs || []
  const rawCredits = dailyLogs
    .filter((l) => l.type === 'credit')
    .reduce((sum, l) => sum + (parseFloat(l.amount) || 0), 0)
  const totalDeposits = dailyLogs
    .filter((l) => l.type === 'deposit')
    .reduce((sum, l) => sum + (parseFloat(l.amount) || 0), 0)
  const totalCredits = rawCredits + roomFeeTotal
  const balance = totalDeposits - totalCredits

  return { daysIn, dailyFeeNum, roomFeeTotal, totalDeposits, totalCredits, balance }
}

export function roomFeeDescription(dailyFeeNum: number, daysIn: number): string {
  return `Room fee (${daysIn} days × Rp ${dailyFeeNum.toLocaleString('id-ID')})`
}

export function enrichHotelBooking(
  booking: any,
  guestContact?: { name?: string | null; phone?: string | null } | null,
) {
  const financials = computeFinancials(booking)
  const petOwnerPhone = booking.pet?.ownerPhone as string | null | undefined

  return {
    ...booking,
    petName: booking.pet?.name ?? null,
    petSpecies: booking.pet?.species?.name ?? null,
    ownerName: booking.pet?.owner?.name ?? guestContact?.name ?? null,
    ownerPhone: booking.pet?.owner?.phone ?? guestContact?.phone ?? petOwnerPhone ?? null,
    clinicName: booking.clinic?.name ?? null,
    daysIn: financials.daysIn,
    roomFeeTotal: financials.roomFeeTotal,
    totalCredits: financials.totalCredits,
    totalDeposits: financials.totalDeposits,
    balance: financials.balance,
  }
}
