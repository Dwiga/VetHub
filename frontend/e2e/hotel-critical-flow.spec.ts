import { test, expect } from '@playwright/test'

/**
 * E2E tests for the hotel critical flow:
 * create booking → add daily logs → checkout → share receipt
 *
 * Prerequisites:
 * - Dev server running on localhost:3000
 * - Valid Clerk authentication (CLERK_SECRET_KEY + CLERK_PUBLISHABLE_KEY in env)
 * - Or use with test auth bypass configured
 *
 * Run with: npx playwright test --config playwright.config.ts
 *
 * Without Clerk configured, these tests will receive 401 responses.
 * To run without Clerk, set SKIP_AUTH=true in the environment
 * and ensure the server handles this mode.
 */

const TEST_HOTEL_ID = 101

test.describe('Hotel Critical Flow', () => {
  let bookingId: number

  test('Step 1: Create a new hotel booking', async ({ request }) => {
    const response = await request.post('/api/hotel-bookings', {
      data: {
        checkIn: '2026-06-10',
        expectedCheckOut: '2026-06-14',
        petId: 1,
        roomType: 'Standard',
        dailyFee: 100000,
        status: 'active',
      },
    })

    if (response.status() === 401) {
      test.skip(true, 'Auth not configured — skipping E2E test')
      return
    }

    expect(response.status()).toBe(201)
    const booking = await response.json()
    expect(booking.id).toBeDefined()
    expect(booking.status).toBe('active')
    expect(booking.hotelId).toBe(TEST_HOTEL_ID)
    bookingId = booking.id
  })

  test('Step 2: Add daily transactions (deposit and credit)', async ({ request }) => {
    if (!bookingId) {
      test.skip(true, 'No booking created in previous step')
      return
    }

    // Add a deposit
    const depositRes = await request.post(`/api/hotel-bookings/${bookingId}/daily-logs`, {
      data: {
        type: 'deposit',
        description: 'Down payment',
        amount: 250000,
        logDate: '2026-06-10',
      },
    })

    if (depositRes.status() === 401) {
      test.skip(true, 'Auth not configured — skipping E2E test')
      return
    }

    expect(depositRes.status()).toBe(201)
    const deposit = await depositRes.json()
    expect(deposit.type).toBe('deposit')
    expect(deposit.amount).toBe('250000')

    // Add a credit (e.g., grooming service)
    const creditRes = await request.post(`/api/hotel-bookings/${bookingId}/daily-logs`, {
      data: {
        type: 'credit',
        description: 'Grooming',
        amount: 50000,
        logDate: '2026-06-11',
      },
    })

    expect(creditRes.status()).toBe(201)
    const credit = await creditRes.json()
    expect(credit.type).toBe('credit')
    expect(credit.amount).toBe('50000')

    // Verify logs are listed
    const logsRes = await request.get(`/api/hotel-bookings/${bookingId}/daily-logs`)
    expect(logsRes.status()).toBe(200)
    const logs = await logsRes.json()
    expect(logs).toHaveLength(2)
  })

  test('Step 3: Check out the booking (room fee auto-calculated)', async ({ request }) => {
    if (!bookingId) {
      test.skip(true, 'No booking created in previous step')
      return
    }

    const response = await request.patch(`/api/hotel-bookings/${bookingId}`, {
      data: {
        status: 'completed',
        checkOut: '2026-06-14',
      },
    })

    if (response.status() === 401) {
      test.skip(true, 'Auth not configured — skipping E2E test')
      return
    }

    expect(response.status()).toBe(200)
    const updated = await response.json()
    expect(updated.status).toBe('completed')
    expect(updated.checkOut).toBe('2026-06-14')

    // Verify room fee log was automatically created (4 days × 100,000 = 400,000)
    const logsRes = await request.get(`/api/hotel-bookings/${bookingId}/daily-logs`)
    expect(logsRes.status()).toBe(200)
    const logs = await logsRes.json()

    const roomFeeLog = logs.find((l: any) => l.description?.startsWith('Room fee'))
    expect(roomFeeLog).toBeDefined()
    expect(roomFeeLog.type).toBe('credit')
    expect(roomFeeLog.amount).toBe('400000')
  })

  test('Step 4: Generate share token for receipt', async ({ request }) => {
    if (!bookingId) {
      test.skip(true, 'No booking created in previous step')
      return
    }

    const response = await request.post(`/api/hotel-bookings/${bookingId}/share`)

    if (response.status() === 401) {
      test.skip(true, 'Auth not configured — skipping E2E test')
      return
    }

    expect(response.status()).toBe(200)
    const share = await response.json()
    expect(share.token).toBeDefined()
    expect(share.token.length).toBeGreaterThan(0)

    // Verify the share token is reusable (second call returns same token)
    const res2 = await request.post(`/api/hotel-bookings/${bookingId}/share`)
    expect(res2.status()).toBe(200)
    const share2 = await res2.json()
    expect(share2.token).toBe(share.token)
  })

  test('Step 5: View booking details with enrichment', async ({ request }) => {
    if (!bookingId) {
      test.skip(true, 'No booking created in previous step')
      return
    }

    const response = await request.get(`/api/hotel-bookings/${bookingId}`)

    if (response.status() === 401) {
      test.skip(true, 'Auth not configured — skipping E2E test')
      return
    }

    expect(response.status()).toBe(200)
    const booking = await response.json()

    expect(booking.petName).toBeDefined()
    expect(booking.daysIn).toBeGreaterThan(0)
    expect(booking.roomFeeTotal).toBeGreaterThan(0)
    expect(booking.totalDeposits).toBeGreaterThan(0)
    expect(booking.totalCredits).toBeGreaterThan(0)
    expect(typeof booking.balance).toBe('number')
  })
})

test.describe('Hotel Reports E2E', () => {
  test('Step 6: View summary report with data', async ({ request }) => {
    const response = await request.get('/api/hotel-bookings/reports/summary')

    if (response.status() === 401) {
      test.skip(true, 'Auth not configured — skipping E2E test')
      return
    }

    expect(response.status()).toBe(200)
    const report = await response.json()

    expect(report).toHaveProperty('totalGuests')
    expect(report).toHaveProperty('activeStays')
    expect(report).toHaveProperty('totalRevenue')
    expect(report).toHaveProperty('topServices')
    expect(report).toHaveProperty('guests')
    expect(Array.isArray(report.topServices)).toBe(true)
    expect(Array.isArray(report.guests)).toBe(true)
  })

  test('Step 7: View filtered report by date range', async ({ request }) => {
    const response = await request.get(
      '/api/hotel-bookings/reports/summary?startDate=2026-06-01&endDate=2026-06-30'
    )

    if (response.status() === 401) {
      test.skip(true, 'Auth not configured — skipping E2E test')
      return
    }

    expect(response.status()).toBe(200)
    const report = await response.json()
    expect(typeof report.totalGuests).toBe('number')
    expect(typeof report.totalRevenue).toBe('number')
  })
})
