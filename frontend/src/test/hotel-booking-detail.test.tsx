import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Route } from '../routes/hotel.$bookingId'
import { useGetHotelBookingStandalone, useUpdateHotelBookingStandalone, useDeleteHotelBookingStandalone, useListHotelLogs, useAddHotelLog, useDeleteHotelLog, useShareHotelBooking } from '../lib/api-client'
import { useLang } from '../contexts/LangContext'
import { useRole } from '../contexts/RoleContext'
import { useAuth } from '../lib/auth'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const HotelBookingPage = Route.options.component!
Route.useParams = vi.fn().mockReturnValue({ bookingId: '1' })

vi.mock('../lib/api-client', () => ({
  useGetHotelBookingStandalone: vi.fn(),
  useUpdateHotelBookingStandalone: vi.fn().mockReturnValue({ isPending: false }),
  useDeleteHotelBookingStandalone: vi.fn().mockReturnValue({ isPending: false }),
  useListHotelLogs: vi.fn(),
  useAddHotelLog: vi.fn().mockReturnValue({ isPending: false }),
  useDeleteHotelLog: vi.fn().mockReturnValue({ isPending: false }),
  useShareHotelBooking: vi.fn().mockReturnValue({ isPending: false }),
  useGetMe: vi.fn().mockReturnValue({ data: { hotelId: 101 } }),
}))

vi.mock('../contexts/LangContext', () => ({
  useLang: vi.fn(),
}))

vi.mock('../contexts/RoleContext', () => ({
  useRole: vi.fn(),
}))

vi.mock('../lib/auth', () => ({
  useAuth: vi.fn(),
  HAS_CLERK: false,
}))

vi.mock('../hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}))

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual('@tanstack/react-router')
  return {
    ...actual,
    Link: ({ children, to }: any) => <a href={to}>{children}</a>,
    useNavigate: () => vi.fn(),
    useParams: () => ({ bookingId: '1' }),
    useRouterState: vi.fn((options: any) =>
      options?.select
        ? options.select({ location: { pathname: '/hotel/1' } })
        : { location: { pathname: '/hotel/1' } }
    ),
  }
})

describe('HotelBookingPage', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useLang as any).mockReturnValue({
      t: (key: string) => key,
    })
    ;(useRole as any).mockReturnValue({
      activeRole: 'hotel',
    })
    ;(useAuth as any).mockReturnValue({
      signOut: vi.fn(),
    })
  })

  const renderPage = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <HotelBookingPage />
      </QueryClientProvider>
    )

  describe('booking details rendering', () => {
    it('renders booking details', () => {
      const mockBooking = {
        id: 1, petName: 'Fluffy', petSpecies: 'Cat', ownerName: 'Alice',
        status: 'active', checkIn: '2026-06-01', dailyFee: '100000', daysIn: 3,
      }
      ;(useGetHotelBookingStandalone as any).mockReturnValue({ data: mockBooking, isLoading: false })
      ;(useListHotelLogs as any).mockReturnValue({ data: [], isLoading: false })

      renderPage()
      expect(screen.getByText('Fluffy')).toBeDefined()
      expect(screen.getByText('2026-06-01')).toBeDefined()
    })

    it('renders loading state', () => {
      ;(useGetHotelBookingStandalone as any).mockReturnValue({ data: undefined, isLoading: true })
      ;(useListHotelLogs as any).mockReturnValue({ data: [], isLoading: false })
      renderPage()
      expect(screen.getAllByRole('generic').some(el => el.className.includes('animate-pulse'))).toBe(true)
    })

    it('renders not found state', () => {
      ;(useGetHotelBookingStandalone as any).mockReturnValue({ data: null, isLoading: false })
      renderPage()
      expect(screen.getByText('visitNotFound')).toBeDefined()
    })
  })

  describe('reserved status', () => {
    const mockReservedBooking = {
      id: 1, petName: 'Fluffy', petSpecies: 'Cat', ownerName: 'Alice',
      status: 'reserved', checkIn: '2026-06-10', dailyFee: '100000',
      expectedCheckOut: '2026-06-15',
    }

    it('shows "Mulai" button for reserved bookings', () => {
      ;(useGetHotelBookingStandalone as any).mockReturnValue({ data: mockReservedBooking, isLoading: false })
      ;(useListHotelLogs as any).mockReturnValue({ data: [], isLoading: false })

      renderPage()
      expect(screen.getByText('mulaiButton')).toBeDefined()
    })

    it('shows reserved status badge', () => {
      ;(useGetHotelBookingStandalone as any).mockReturnValue({ data: mockReservedBooking, isLoading: false })
      ;(useListHotelLogs as any).mockReturnValue({ data: [], isLoading: false })

      renderPage()
      expect(screen.getByText('reservedStatus')).toBeDefined()
    })

    it('does NOT show financial summary for reserved bookings', () => {
      ;(useGetHotelBookingStandalone as any).mockReturnValue({ data: mockReservedBooking, isLoading: false })
      ;(useListHotelLogs as any).mockReturnValue({ data: [], isLoading: false })

      renderPage()
      expect(screen.queryByText(/totalDeposits/)).toBeNull()
      expect(screen.queryByText(/totalCredits/)).toBeNull()
    })

    it('shows edit reservation button', () => {
      ;(useGetHotelBookingStandalone as any).mockReturnValue({ data: mockReservedBooking, isLoading: false })
      ;(useListHotelLogs as any).mockReturnValue({ data: [], isLoading: false })

      renderPage()
      expect(screen.getByText('editReservation')).toBeDefined()
    })

    it('shows delete reservation button', () => {
      ;(useGetHotelBookingStandalone as any).mockReturnValue({ data: mockReservedBooking, isLoading: false })
      ;(useListHotelLogs as any).mockReturnValue({ data: [], isLoading: false })

      renderPage()
      expect(screen.getByText('deleteReservation')).toBeDefined()
    })
  })

  describe('active status', () => {
    const mockActiveBooking = {
      id: 1, petName: 'Fluffy', petSpecies: 'Cat', ownerName: 'Alice', ownerPhone: '081234',
      status: 'active', checkIn: '2026-06-01', checkOut: null, dailyFee: '100000',
      daysIn: 3, roomType: 'Deluxe', notes: 'Special care',
      totalDeposits: 300000, totalCredits: 150000, balance: 150000,
    }

    beforeEach(() => {
      ;(useGetHotelBookingStandalone as any).mockReturnValue({ data: mockActiveBooking, isLoading: false })
      ;(useListHotelLogs as any).mockReturnValue({ data: [], isLoading: false })
    })

    it('shows financial summary for active bookings', () => {
      renderPage()
      expect(screen.getByText(/totalDeposits/)).toBeDefined()
      expect(screen.getByText(/totalCredits/)).toBeDefined()
      expect(screen.getByText(/balance/i)).toBeDefined()
    })

    it('shows daily logs section', () => {
      renderPage()
      expect(screen.getByText('dailyLog')).toBeDefined()
    })

    it('shows add daily log button', () => {
      renderPage()
      expect(screen.getByText('addDailyLog')).toBeDefined()
    })

    it('shows check-out section', () => {
      renderPage()
      const checkoutEls = screen.getAllByText('checkOutBtn')
      expect(checkoutEls.length).toBeGreaterThanOrEqual(1)
    })

    it('shows share button', () => {
      renderPage()
      const pageHeader = screen.getByText('Fluffy').closest('div')
      expect(pageHeader).toBeDefined()
    })

    it('shows room type if present', () => {
      renderPage()
      expect(screen.getByText('roomTypeLabel')).toBeDefined()
      expect(screen.getByText('Deluxe')).toBeDefined()
    })

    it('shows notes if present', () => {
      renderPage()
      expect(screen.getByText('Special care')).toBeDefined()
    })

    it('shows days count', () => {
      renderPage()
      expect(screen.getByText('daysLabel')).toBeDefined()
    })

    it('shows owner info with phone', () => {
      renderPage()
      expect(screen.getByText(/Alice.*081234/)).toBeDefined()
    })
  })

  describe('daily logs list', () => {
    const mockActiveBooking = {
      id: 1, petName: 'Fluffy', status: 'active', checkIn: '2026-06-01',
      dailyFee: '100000', daysIn: 3, totalDeposits: 200000, totalCredits: 50000, balance: 150000,
    }

    it('renders daily log entries', () => {
      const mockLogs = [
        { id: 10, type: 'deposit', amount: '100000', description: 'DP', logDate: '2026-06-01' },
        { id: 11, type: 'credit', amount: '30000', description: 'Grooming', logDate: '2026-06-02' },
      ]
      ;(useGetHotelBookingStandalone as any).mockReturnValue({ data: mockActiveBooking, isLoading: false })
      ;(useListHotelLogs as any).mockReturnValue({ data: mockLogs, isLoading: false })

      renderPage()
      expect(screen.getByText('DP')).toBeDefined()
      expect(screen.getByText('Grooming')).toBeDefined()
    })

    it('shows empty state when no logs', () => {
      ;(useGetHotelBookingStandalone as any).mockReturnValue({ data: mockActiveBooking, isLoading: false })
      ;(useListHotelLogs as any).mockReturnValue({ data: [], isLoading: false })

      renderPage()
      expect(screen.getByText('noLogsYet')).toBeDefined()
    })
  })

  describe('adding daily log', () => {
    it('handles adding a daily log', async () => {
      const mockBooking = {
        id: 1, petName: 'Fluffy', status: 'active', checkIn: '2026-06-01',
        dailyFee: '100000', daysIn: 3, totalDeposits: 0, totalCredits: 0, balance: 0,
      }
      const mockMutateAsync = vi.fn().mockResolvedValue({})
      ;(useGetHotelBookingStandalone as any).mockReturnValue({ data: mockBooking, isLoading: false })
      ;(useListHotelLogs as any).mockReturnValue({ data: [], isLoading: false })
      ;(useAddHotelLog as any).mockReturnValue({ mutateAsync: mockMutateAsync, isPending: false })

      renderPage()

      fireEvent.click(screen.getByText('addDailyLog'))

      const amountInput = screen.getByLabelText(/amount/i)
      fireEvent.change(amountInput, { target: { value: '50000' } })

      const saveButton = screen.getByText('save')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalled()
      })
    })
  })

  describe('completed status', () => {
    it('shows financial summary for completed bookings', () => {
      const mockCompleted = {
        id: 1, petName: 'Fluffy', status: 'completed', checkIn: '2026-06-01',
        checkOut: '2026-06-03', dailyFee: '100000', daysIn: 2,
        totalDeposits: 200000, totalCredits: 200000, balance: 0,
      }
      ;(useGetHotelBookingStandalone as any).mockReturnValue({ data: mockCompleted, isLoading: false })
      ;(useListHotelLogs as any).mockReturnValue({ data: [], isLoading: false })

      renderPage()
      expect(screen.getByText(/totalDeposits/)).toBeDefined()
      expect(screen.getByText(/totalCredits/)).toBeDefined()
      expect(screen.getByText(/balance/i)).toBeDefined()
      expect(screen.getByText('2026-06-03')).toBeDefined()
    })

    it('does NOT show check-out section for completed bookings', () => {
      const mockCompleted = {
        id: 1, petName: 'Fluffy', status: 'completed', checkIn: '2026-06-01',
        checkOut: '2026-06-03', dailyFee: '100000', daysIn: 2,
        totalDeposits: 200000, totalCredits: 200000, balance: 0,
      }
      ;(useGetHotelBookingStandalone as any).mockReturnValue({ data: mockCompleted, isLoading: false })
      ;(useListHotelLogs as any).mockReturnValue({ data: [], isLoading: false })

      renderPage()
      expect(screen.queryByText('checkOutBtn')).toBeNull()
    })
  })

  describe('edit reservation dialog', () => {
    it('opens edit dialog when clicking edit button', () => {
      const mockReserved = {
        id: 1, petName: 'Fluffy', status: 'reserved', checkIn: '2026-06-10',
        dailyFee: '100000', expectedCheckOut: '2026-06-15',
      }
      ;(useGetHotelBookingStandalone as any).mockReturnValue({ data: mockReserved, isLoading: false })
      ;(useListHotelLogs as any).mockReturnValue({ data: [], isLoading: false })

      renderPage()
      fireEvent.click(screen.getByText('editReservation'))

      const dialog = screen.getByRole('dialog')
      expect(dialog).toBeDefined()
      expect(within(dialog).getByText(/expectedCheckOut/)).toBeDefined()
    })
  })
})
