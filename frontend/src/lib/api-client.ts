import { useAuth } from '@/lib/auth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

/**
 * Build an authenticated fetcher that injects a fresh Clerk JWT on each call.
 */
function useAuthedFetch() {
  const { getToken } = useAuth()

  return async function authedFetch(input: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers)
    headers.set('content-type', 'application/json')
    // Always try to attach the Clerk token
    const token = await getToken()
    if (token) {
      headers.set('authorization', `Bearer ${token}`)
    }
    const res = await fetch(input, { ...init, headers, credentials: 'include' })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`${res.status} ${res.statusText}${text ? ` - ${text}` : ''}`)
    }
    if (res.status === 204) return null
    return res.json()
  }
}

// ─────────────────────────────  Users  ─────────────────────────────────────

export interface MeResponse {
  id: number
  clerkId: string
  name: string | null
  phone: string | null
  email: string | null
  isPetOwner: boolean
  isVet: boolean
  isVetOwner: boolean
  isHotelOwner: boolean
  clinicId: number | null
  hotelId: number | null
  vetStatus: string | null
}

export function useGetMe() {
  const fetcher = useAuthedFetch()
  const { isSignedIn } = useAuth()
  return useQuery<MeResponse>({
    queryKey: ['me'],
    queryFn: () => fetcher('/api/users/me'),
    enabled: !!isSignedIn,
    staleTime: 30_000,
  })
}

export function useUpdateMe() {
  const fetcher = useAuthedFetch()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ data }: { data: { name?: string; phone?: string } }) =>
      fetcher('/api/users/me', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  })
}

export function useRegisterAsPetOwner() {
  const fetcher = useAuthedFetch()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () =>
      fetcher('/api/users/me/register-pet-owner', { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  })
}

export function useRegisterForVet() {
  const fetcher = useAuthedFetch()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ data }: { data: { name: string; address?: string; phone?: string; email?: string } }) =>
      fetcher('/api/users/register-for-vet', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  })
}

export function useRegisterForHotel() {
  const fetcher = useAuthedFetch()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ data }: { data: { name: string; address?: string; phone?: string } }) =>
      fetcher('/api/users/register-for-hotel', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  })
}

// ─────────────────────────────  Species  ───────────────────────────────────

export interface Species {
  id: number
  name: string
  icon: string | null
}

export function useListSpecies() {
  const fetcher = useAuthedFetch()
  return useQuery<Species[]>({
    queryKey: ['species'],
    queryFn: () => fetcher('/api/species'),
    staleTime: 5 * 60_000,
  })
}

// ─────────────────────────────  Pets  ──────────────────────────────────────

export interface Pet {
  id: number
  name: string
  dateOfBirth: string | null
  gender: string
  sterilized: boolean
  color: string | null
  speciesId: number
  ownerId: number
  status: string
  photoUrl: string | null
  species?: Species | null
  owner?: { id: number; name: string | null; phone: string | null } | null
}

export function useListMyPets() {
  const fetcher = useAuthedFetch()
  const { isSignedIn } = useAuth()
  return useQuery<Pet[]>({
    queryKey: ['pets', 'mine'],
    queryFn: () => fetcher('/api/pets'),
    enabled: !!isSignedIn,
  })
}

export function useGetPet(petId: number | string | undefined) {
  const fetcher = useAuthedFetch()
  return useQuery<Pet>({
    queryKey: ['pets', petId],
    queryFn: () => fetcher(`/api/pets/${petId}`),
    enabled: petId !== undefined && petId !== null && petId !== '',
  })
}

export function useAddPet() {
  const fetcher = useAuthedFetch()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ data }: { data: Partial<Pet> }) =>
      fetcher('/api/pets', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pets', 'mine'] }),
  })
}

export function useUpdatePet() {
  const fetcher = useAuthedFetch()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ petId, data }: { petId: number; data: Partial<Pet> }) =>
      fetcher(`/api/pets/${petId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { petId }) => {
      qc.invalidateQueries({ queryKey: ['pets', petId] })
      qc.invalidateQueries({ queryKey: ['pets', 'mine'] })
    },
  })
}

// ─────────────────────────────  Vaccinations  ──────────────────────────────

export interface Vaccination {
  id: number
  petId: number
  vaccineName: string
  brand: string | null
  date: string
  nextDueDate: string | null
  batchNumber: string | null
  administeredBy: string | null
  cost: string | null
  notes: string | null
  vetId: number | null
  createdAt: string
}

export function useListVaccinations(petId: number | string | undefined) {
  const fetcher = useAuthedFetch()
  return useQuery<Vaccination[]>({
    queryKey: ['vaccinations', petId],
    queryFn: () => fetcher(`/api/pets/${petId}/vaccinations`),
    enabled: !!petId,
  })
}

export function useAddVaccination() {
  const fetcher = useAuthedFetch()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ petId, data }: { petId: number; data: Partial<Vaccination> }) =>
      fetcher(`/api/pets/${petId}/vaccinations`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { petId }) =>
      qc.invalidateQueries({ queryKey: ['vaccinations', petId] }),
  })
}

export function useDeleteVaccination() {
  const fetcher = useAuthedFetch()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ petId, vaccinationId }: { petId: number; vaccinationId: number }) =>
      fetcher(`/api/pets/${petId}/vaccinations/${vaccinationId}`, {
        method: 'DELETE',
      }),
    onSuccess: (_, { petId }) =>
      qc.invalidateQueries({ queryKey: ['vaccinations', petId] }),
  })
}

// ─────────────────────────────  Health Events  ─────────────────────────────

export interface HealthEvent {
  id: number
  petId: number
  title: string
  notes: string | null
  eventDate: string
  createdAt: string
}

export function useListHealthEvents(petId: number | string | undefined) {
  const fetcher = useAuthedFetch()
  return useQuery<HealthEvent[]>({
    queryKey: ['health-events', petId],
    queryFn: () => fetcher(`/api/pets/${petId}/health-events`),
    enabled: !!petId,
  })
}

export function useAddHealthEvent() {
  const fetcher = useAuthedFetch()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ petId, data }: { petId: number; data: Partial<HealthEvent> }) =>
      fetcher(`/api/pets/${petId}/health-events`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { petId }) =>
      qc.invalidateQueries({ queryKey: ['health-events', petId] }),
  })
}

export function useDeleteHealthEvent() {
  const fetcher = useAuthedFetch()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ petId, eventId }: { petId: number; eventId: number }) =>
      fetcher(`/api/pets/${petId}/health-events/${eventId}`, {
        method: 'DELETE',
      }),
    onSuccess: (_, { petId }) =>
      qc.invalidateQueries({ queryKey: ['health-events', petId] }),
  })
}

// ─────────────────────────────  Visits  ────────────────────────────────────

export interface Visit {
  id: number
  petId: number
  clinicId: number
  vetId: number | null
  type: string
  status: string
  visitDate: string
  dischargeDate: string | null
  dailyFee?: number
  totalCost?: number
  vetName?: string
  petName?: string
  ownerName?: string
  ownerPhone?: string
  latestReport?: string
  billedCost?: number
  roomFeeTotal?: number
  totalDeposits?: number
  totalCredits?: number
  balance?: number
  anamnesis?: string
  therapy?: string
  dailyReports?: DailyReport[]
}

export interface DailyReport {
  id: number
  visitId: number
  type: 'deposit' | 'credit'
  description: string | null
  amount: number
  reportDate: string
}

export function useListVisits(petId: number | string | undefined) {
  const fetcher = useAuthedFetch()
  return useQuery<Visit[]>({
    queryKey: ['visits', 'pet', petId],
    queryFn: () => fetcher(`/api/visits?petId=${petId}`),
    enabled: !!petId,
  })
}

export function useListActiveVisits() {
  const fetcher = useAuthedFetch()
  const { isSignedIn } = useAuth()
  return useQuery<Visit[]>({
    queryKey: ['visits', 'active'],
    queryFn: () => fetcher('/api/visits?status=active'),
    enabled: !!isSignedIn,
  })
}

export function useListVetVisits(options?: { clinicId?: number }) {
  const fetcher = useAuthedFetch()
  const { isSignedIn } = useAuth()
  const params = options?.clinicId ? `?clinicId=${options.clinicId}` : ''
  return useQuery<Visit[]>({
    queryKey: ['visits', 'vet', options?.clinicId],
    queryFn: () => fetcher(`/api/visits${params}`),
    enabled: !!isSignedIn,
  })
}

export function useGetVisit(visitId: number | undefined) {
  const fetcher = useAuthedFetch()
  return useQuery<Visit>({
    queryKey: ['visits', visitId],
    queryFn: () => fetcher(`/api/visits/${visitId}`),
    enabled: visitId !== undefined,
  })
}

export function useCreateVisit() {
  const fetcher = useAuthedFetch()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ petId, data }: { petId: number; data: Record<string, any> }) =>
      fetcher(`/api/visits?petId=${petId}`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['visits'] }),
  })
}

export function useUpdateVisit() {
  const fetcher = useAuthedFetch()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ visitId, data }: { visitId: number; data: Record<string, any> }) =>
      fetcher(`/api/visits/${visitId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { visitId }) => {
      qc.invalidateQueries({ queryKey: ['visits', visitId] })
      qc.invalidateQueries({ queryKey: ['visits'] })
    },
  })
}

export function useCreateDailyReport() {
  const fetcher = useAuthedFetch()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ visitId, data }: { visitId: number; data: Record<string, any> }) =>
      fetcher(`/api/visits/${visitId}/daily-reports`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['visits'] }),
  })
}

export function useGetDailyReport(reportId: number) {
  const fetcher = useAuthedFetch()
  return useQuery<DailyReport>({
    queryKey: ['daily-reports', reportId],
    queryFn: () => fetcher(`/api/daily-reports/${reportId}`),
    enabled: !!reportId,
  })
}

export function useUpdateDailyReport() {
  const fetcher = useAuthedFetch()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ reportId, data }: { reportId: number; data: Record<string, any> }) =>
      fetcher(`/api/daily-reports/${reportId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { reportId }) => {
      qc.invalidateQueries({ queryKey: ['daily-reports', reportId] })
      qc.invalidateQueries({ queryKey: ['visits'] })
    },
  })
}

export function useShareVisit() {
  const fetcher = useAuthedFetch()
  return useMutation({
    mutationFn: ({ visitId }: { visitId: number }) =>
      fetcher(`/api/visits/${visitId}/share`, { method: 'POST' }),
  })
}

export function useUpdatePetStatus() {
  const fetcher = useAuthedFetch()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ petId, data }: { petId: number; data: Record<string, any> }) =>
      fetcher(`/api/pets/${petId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { petId }) => {
      qc.invalidateQueries({ queryKey: ['pets', petId] })
    },
  })
}

// ─────────────────────────────  Search  ─────────────────────────────────────

export interface OwnerSearchResult {
  owner: { id: number; name: string | null; phone: string | null }
  pets: Array<{ id: number; name: string; speciesName: string | null; status: string; ownerName: string | null; ownerPhone: string | null }>
}

export function useSearchPetOwner(params: { phone: string }) {
  const fetcher = useAuthedFetch()
  return useQuery<OwnerSearchResult>({
    queryKey: ['search', 'owner', params.phone],
    queryFn: () => fetcher(`/api/search/owner?phone=${encodeURIComponent(params.phone)}`),
    enabled: !!params.phone,
  })
}

export function useSearchPet(params: { name: string }) {
  const fetcher = useAuthedFetch()
  return useQuery<OwnerSearchResult['pets']>({
    queryKey: ['search', 'pet', params.name],
    queryFn: () => fetcher(`/api/search/pet?name=${encodeURIComponent(params.name)}`),
    enabled: !!params.name,
  })
}

export function useAddPetForOwner() {
  const fetcher = useAuthedFetch()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ data }: { data: Record<string, any> }) =>
      fetcher('/api/pets', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pets'] }),
  })
}

// ─────────────────────────────  Hotel  ──────────────────────────────────────

export interface HotelBooking {
  id: number
  petId: number
  clinicId: number
  checkIn: string
  checkOut: string | null
  status: string
  dailyFee: number | null
  totalCost: number
  notes: string | null
  petName: string | null
  petSpecies: string | null
  ownerName: string | null
  ownerPhone: string | null
  clinicName: string | null
  roomType: string | null
  daysIn: number | null
  totalCredits: number | null
  balance: number | null
  roomFeeTotal: number | null
  shareToken: string | null
}

export interface HotelDailyLog {
  id: number
  bookingId: number
  type: 'deposit' | 'credit'
  description: string | null
  amount: number
  logDate: string
}

export function useListActiveHotelBookings(clinicId: number | undefined) {
  const fetcher = useAuthedFetch()
  return useQuery<HotelBooking[]>({
    queryKey: ['hotel-bookings', 'active', clinicId],
    queryFn: () => fetcher(`/api/hotel-bookings?clinicId=${clinicId}&status=active`),
    enabled: !!clinicId,
  })
}

export function useListHotelBookingsByPet(petId: number | string | undefined) {
  const fetcher = useAuthedFetch()
  return useQuery<HotelBooking[]>({
    queryKey: ['hotel-bookings', 'pet', petId],
    queryFn: () => fetcher(`/api/hotel-bookings?petId=${petId}`),
    enabled: !!petId,
  })
}

export function useGetHotelBooking(bookingId: number) {
  const fetcher = useAuthedFetch()
  return useQuery<HotelBooking>({
    queryKey: ['hotel-bookings', bookingId],
    queryFn: () => fetcher(`/api/hotel-bookings/${bookingId}`),
    enabled: !!bookingId,
  })
}

export function useUpdateHotelBooking() {
  const fetcher = useAuthedFetch()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ bookingId, data }: { bookingId: number; data: Record<string, any> }) =>
      fetcher(`/api/hotel-bookings/${bookingId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { bookingId }) => {
      qc.invalidateQueries({ queryKey: ['hotel-bookings', bookingId] })
      qc.invalidateQueries({ queryKey: ['hotel-bookings'] })
    },
  })
}

export function useCreateHotelBooking() {
  const fetcher = useAuthedFetch()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ petId, data }: { petId: number; data: Record<string, any> }) =>
      fetcher(`/api/hotel-bookings?petId=${petId}`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hotel-bookings'] }),
  })
}

export function useListHotelDailyLogs(bookingId: number) {
  const fetcher = useAuthedFetch()
  return useQuery<HotelDailyLog[]>({
    queryKey: ['hotel-daily-logs', bookingId],
    queryFn: () => fetcher(`/api/hotel-bookings/${bookingId}/daily-logs`),
    enabled: !!bookingId,
  })
}

export function useAddHotelDailyLog() {
  const fetcher = useAuthedFetch()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ bookingId, data }: { bookingId: number; data: Record<string, any> }) =>
      fetcher(`/api/hotel-bookings/${bookingId}/daily-logs`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hotel-daily-logs'] }),
  })
}

export function useDeleteHotelDailyLog() {
  const fetcher = useAuthedFetch()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ bookingId, logId }: { bookingId: number; logId: number }) =>
      fetcher(`/api/hotel-bookings/${bookingId}/daily-logs/${logId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hotel-daily-logs'] }),
  })
}

// ─────────────────────────────  Clinic  ─────────────────────────────────────

export interface Clinic {
  id: number
  name: string
  address: string | null
  phone: string | null
  email: string | null
  ownerId: number
  type: string
}

export interface StaffMember {
  id: number
  clinicId: number
  userId: number
  role: string
  status: string
  name?: string | null
  email?: string | null
  phone?: string | null
}

export interface Product {
  id: number
  clinicId: number
  name: string
  category: string | null
  description: string | null
  price: string
  stock: number | null
  unit: string | null
  isActive: boolean
}

export interface ReportSummary {
  totalRevenue: number
  totalVisits: number
  inpatientVisits: number
  outpatientVisits: number
  survivedCount: number
  diedCount: number
  earlyDischargeCount: number
  averageRevenuePerVisit: number
  topServices: Array<{ name: string; count: number; revenue: number }>
}

export interface VisitStats {
  labels: string[]
  visitCounts: number[]
  revenues: number[]
}

export function useGetMyClinic() {
  const fetcher = useAuthedFetch()
  const { isSignedIn } = useAuth()
  return useQuery<Clinic>({
    queryKey: ['clinic', 'me'],
    queryFn: () => fetcher('/api/clinic/mine'),
    enabled: !!isSignedIn,
  })
}

export function useUpdateClinic() {
  const fetcher = useAuthedFetch()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ clinicId, data }: { clinicId: number; data: Record<string, any> }) =>
      fetcher(`/api/clinic/${clinicId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clinic'] }),
  })
}

export function useListStaff(clinicId: number | undefined) {
  const fetcher = useAuthedFetch()
  return useQuery<StaffMember[]>({
    queryKey: ['staff', clinicId],
    queryFn: () => fetcher(`/api/clinic/${clinicId}/staff`),
    enabled: !!clinicId,
  })
}

export function useInviteStaff() {
  const fetcher = useAuthedFetch()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ clinicId, data }: { clinicId: number; data: Record<string, any> }) =>
      fetcher(`/api/clinic/${clinicId}/staff`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }),
  })
}

export function useRemoveStaff() {
  const fetcher = useAuthedFetch()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ clinicId, staffId }: { clinicId: number; staffId: number }) =>
      fetcher(`/api/clinic/${clinicId}/staff/${staffId}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }),
  })
}

export function useListProducts(clinicId: number | undefined) {
  const fetcher = useAuthedFetch()
  return useQuery<Product[]>({
    queryKey: ['products', clinicId],
    queryFn: () => fetcher(`/api/clinic/${clinicId}/products`),
    enabled: !!clinicId,
  })
}

export function useCreateProduct() {
  const fetcher = useAuthedFetch()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ clinicId, data }: { clinicId: number; data: Record<string, any> }) =>
      fetcher(`/api/clinic/${clinicId}/products`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })
}

export function useDeleteProduct() {
  const fetcher = useAuthedFetch()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ productId }: { productId: number }) =>
      fetcher(`/api/products/${productId}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })
}

export function useGetReportSummary(
  clinicId: number | undefined,
  params: { period: string; date: string; startDate?: string; endDate?: string },
) {
  const fetcher = useAuthedFetch()
  const qs = new URLSearchParams({ period: params.period, date: params.date })
  if (params.startDate) qs.set('startDate', params.startDate)
  if (params.endDate) qs.set('endDate', params.endDate)
  return useQuery<ReportSummary>({
    queryKey: ['reports', 'summary', clinicId, params],
    queryFn: () => fetcher(`/api/clinic/${clinicId}/reports/summary?${qs}`),
    enabled: !!clinicId,
  })
}

export function useGetVisitStats(
  clinicId: number | undefined,
  params: { period: string; date: string; startDate?: string; endDate?: string },
) {
  const fetcher = useAuthedFetch()
  const qs = new URLSearchParams({ period: params.period, date: params.date })
  if (params.startDate) qs.set('startDate', params.startDate)
  if (params.endDate) qs.set('endDate', params.endDate)
  return useQuery<VisitStats>({
    queryKey: ['reports', 'stats', clinicId, params],
    queryFn: () => fetcher(`/api/clinic/${clinicId}/reports/stats?${qs}`),
    enabled: !!clinicId,
  })
}

// ─────────────────────────────  Standalone Hotel  ───────────────────────────

export function useListHotelBookings(hotelId: number | undefined, status?: string) {
  const fetcher = useAuthedFetch()
  return useQuery<HotelBooking[]>({
    queryKey: ['hotel', 'bookings', hotelId, status],
    queryFn: () => fetcher(`/api/hotel/clinic/${hotelId}/bookings${status ? `?status=${status}` : ''}`),
    enabled: !!hotelId,
  })
}

export function useGetHotelBookingStandalone(bookingId: number) {
  const fetcher = useAuthedFetch()
  return useQuery<HotelBooking>({
    queryKey: ['hotel', 'booking', bookingId],
    queryFn: () => fetcher(`/api/hotel/${bookingId}`),
    enabled: !!bookingId,
  })
}

export function useCreateStandaloneHotelBooking() {
  const fetcher = useAuthedFetch()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ data }: { data: Record<string, any> }) =>
      fetcher('/api/hotel/standalone', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hotel'] }),
  })
}

export function useUpdateHotelBookingStandalone() {
  const fetcher = useAuthedFetch()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ bookingId, data }: { bookingId: number; data: Record<string, any> }) =>
      fetcher(`/api/hotel/${bookingId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { bookingId }) => {
      qc.invalidateQueries({ queryKey: ['hotel', 'booking', bookingId] })
      qc.invalidateQueries({ queryKey: ['hotel'] })
    },
  })
}

export function useListHotelLogs(bookingId: number) {
  const fetcher = useAuthedFetch()
  return useQuery<HotelDailyLog[]>({
    queryKey: ['hotel', 'logs', bookingId],
    queryFn: () => fetcher(`/api/hotel/${bookingId}/logs`),
    enabled: !!bookingId,
  })
}

export function useAddHotelLog() {
  const fetcher = useAuthedFetch()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ bookingId, data }: { bookingId: number; data: Record<string, any> }) =>
      fetcher(`/api/hotel/${bookingId}/logs`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hotel'] }),
  })
}

export function useDeleteHotelLog() {
  const fetcher = useAuthedFetch()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ bookingId, logId }: { bookingId: number; logId: number }) =>
      fetcher(`/api/hotel/${bookingId}/logs/${logId}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hotel'] }),
  })
}

// ─────────────────────────────  Hotel Share  ──────────────────────────────────

export function useShareHotelBooking() {
  const fetcher = useAuthedFetch()
  return useMutation({
    mutationFn: ({ bookingId }: { bookingId: number }) =>
      fetcher(`/api/hotel/${bookingId}/share`, { method: 'POST' }),
  })
}

// ─────────────────────────────  Public Share  ─────────────────────────────────

export function useGetSharedHotelBooking(token: string) {
  return useQuery({
    queryKey: ['share', 'hotel', token],
    queryFn: () => fetch(`/api/share/hotel/${token}`).then(r => { if (!r.ok) throw new Error('not found'); return r.json() }),
    enabled: !!token,
    refetchInterval: 30_000,
  })
}

export function useGetSharedVetVisit(token: string) {
  return useQuery({
    queryKey: ['share', 'vet', token],
    queryFn: () => fetch(`/api/share/vet/${token}`).then(r => { if (!r.ok) throw new Error('not found'); return r.json() }),
    enabled: !!token,
    refetchInterval: 30_000,
  })
}
