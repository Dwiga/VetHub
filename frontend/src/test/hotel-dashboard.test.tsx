import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Route } from '../routes/hotel.index'
import { useGetMe, useListHotelBookings } from '../lib/api-client'
import { useLang } from '../contexts/LangContext'
import { useRole } from '../contexts/RoleContext'
import { useAuth } from '../lib/auth'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const HotelDashboardPage = Route.options.component!

vi.mock('../lib/api-client', () => ({
  useGetMe: vi.fn(),
  useListHotelBookings: vi.fn(),
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

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual('@tanstack/react-router')
  return {
    ...actual,
    Link: ({ children, to }: any) => <a href={to}>{children}</a>,
    useNavigate: () => vi.fn(),
    useRouterState: vi.fn((options: any) =>
      options?.select
        ? options.select({ location: { pathname: '/hotel' } })
        : { location: { pathname: '/hotel' } }
    ),
  }
})

describe('HotelDashboardPage', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient.clear()
    ;(useLang as any).mockReturnValue({
      t: (key: string) => key,
    })
    ;(useGetMe as any).mockReturnValue({
      data: { hotelId: 101, isHotelOwner: true },
      isLoading: false,
    })
    ;(useRole as any).mockReturnValue({
      activeRole: 'hotel',
      setActiveRole: vi.fn(),
      hasBothRoles: false,
      canSwitchToVet: false,
      canSwitchToPetOwner: true,
      canSwitchToHotel: true,
    })
    ;(useAuth as any).mockReturnValue({
      signOut: vi.fn(),
    })
  })

  const renderPage = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <HotelDashboardPage />
      </QueryClientProvider>
    )

  it('renders loading state', () => {
    ;(useListHotelBookings as any).mockReturnValue({
      data: [],
      isLoading: true,
    })
    renderPage()
    expect(screen.getAllByRole('generic').some(el => el.className.includes('animate-pulse'))).toBe(true)
  })

  it('renders empty state when no bookings', () => {
    ;(useListHotelBookings as any).mockReturnValue({
      data: [],
      isLoading: false,
    })
    renderPage()
    expect(screen.getByText('noActiveGuests')).toBeDefined()
  })

  it('renders active bookings', () => {
    const mockBookings = [
      { id: 1, pet: { name: 'Fluffy', species: { name: 'Cat' }, owner: { name: 'Alice' } }, checkIn: '2026-06-01', status: 'active' }
    ]
    ;(useListHotelBookings as any).mockImplementation((_id, status) => {
      if (status === 'active') return { data: mockBookings, isLoading: false }
      return { data: [], isLoading: false }
    })
    renderPage()
    expect(screen.getByText('Fluffy')).toBeDefined()
    expect(screen.getByText(/Cat/)).toBeDefined()
    expect(screen.getByText(/Alice/)).toBeDefined()
  })

  it('renders reservations section', () => {
    const mockReservations = [
      { id: 2, pet: { name: 'Buddy', species: { name: 'Dog' }, owner: { name: 'Bob' } }, checkIn: '2026-07-15', expectedCheckOut: '2026-07-20', status: 'reserved' }
    ]
    ;(useListHotelBookings as any).mockImplementation((_id: any, status: any) => {
      if (status === 'reserved') return { data: mockReservations, isLoading: false }
      return { data: [], isLoading: false }
    })
    renderPage()
    expect(screen.getByText('Buddy')).toBeDefined()
    expect(screen.getByText(/reservationMode/)).toBeDefined()
    expect(screen.getByText('2026-07-15')).toBeDefined()
    expect(screen.getByText('2026-07-20')).toBeDefined()
  })

  it('renders both active bookings and reservations', () => {
    const activeBookings = [
      { id: 1, pet: { name: 'Fluffy', species: { name: 'Cat' }, owner: { name: 'Alice' } }, checkIn: '2026-06-01', status: 'active' }
    ]
    const reservations = [
      { id: 2, pet: { name: 'Buddy', species: { name: 'Dog' }, owner: { name: 'Bob' } }, checkIn: '2026-07-15', expectedCheckOut: '2026-07-20', status: 'reserved' }
    ]
    ;(useListHotelBookings as any).mockImplementation((_id: any, status: any) => {
      if (status === 'active') return { data: activeBookings, isLoading: false }
      if (status === 'reserved') return { data: reservations, isLoading: false }
      return { data: [], isLoading: false }
    })
    renderPage()
    expect(screen.getByText('Fluffy')).toBeDefined()
    expect(screen.getByText('Buddy')).toBeDefined()
    expect(screen.getByText(/reservationMode/)).toBeDefined()
    const activeHeaders = screen.getAllByText(/activeGuests/)
    expect(activeHeaders.length).toBeGreaterThanOrEqual(2)
  })

  it('shows history link when there are active bookings', () => {
    const mockBookings = [
      { id: 1, pet: { name: 'Fluffy', species: { name: 'Cat' }, owner: { name: 'Alice' } }, checkIn: '2026-06-01', status: 'active' }
    ]
    ;(useListHotelBookings as any).mockImplementation((_id, status) => {
      if (status === 'active') return { data: mockBookings, isLoading: false }
      return { data: [], isLoading: false }
    })
    renderPage()
    expect(screen.getByText('guestHistory')).toBeDefined()
  })

  it('does not show history link when no bookings', () => {
    ;(useListHotelBookings as any).mockReturnValue({ data: [], isLoading: false })
    renderPage()
    expect(screen.queryByText('guestHistory')).toBeNull()
  })

  it('handles search input change', () => {
    ;(useListHotelBookings as any).mockReturnValue({ data: [], isLoading: false })
    renderPage()
    const input = screen.getByTestId('input-search')
    fireEvent.change(input, { target: { value: 'Buddy' } })
    expect((input as HTMLInputElement).value).toBe('Buddy')
  })

  it('shows search button', () => {
    ;(useListHotelBookings as any).mockReturnValue({ data: [], isLoading: false })
    renderPage()
    expect(screen.getByTestId('btn-search')).toBeDefined()
  })

  it('renders new guest link', () => {
    ;(useListHotelBookings as any).mockReturnValue({ data: [], isLoading: false })
    renderPage()
    const links = screen.getAllByText('newGuest')
    expect(links.length).toBeGreaterThanOrEqual(1)
  })

  it('shows booking count alongside section headers', () => {
    const activeBookings = [
      { id: 1, pet: { name: 'Fluffy', species: { name: 'Cat' }, owner: { name: 'Alice' } }, checkIn: '2026-06-01', status: 'active' }
    ]
    const reservations = [
      { id: 2, pet: { name: 'Buddy', species: { name: 'Dog' }, owner: { name: 'Bob' } }, checkIn: '2026-07-15', status: 'reserved' }
    ]
    ;(useListHotelBookings as any).mockImplementation((_id: any, status: any) => {
      if (status === 'active') return { data: activeBookings, isLoading: false }
      if (status === 'reserved') return { data: reservations, isLoading: false }
      return { data: [], isLoading: false }
    })
    renderPage()
    const countElements = screen.getAllByText(/\(1\)/)
    expect(countElements.length).toBeGreaterThanOrEqual(2)
  })
})
