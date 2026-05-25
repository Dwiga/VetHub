import { useAuth } from '@/lib/auth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

/**
 * Build an authenticated fetcher that injects a fresh Clerk JWT on each call.
 */
function useAuthedFetch() {
  const { getToken, isSignedIn } = useAuth()

  return async function authedFetch(input: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers)
    headers.set('content-type', 'application/json')
    if (isSignedIn) {
      const token = await getToken()
      if (token) headers.set('authorization', `Bearer ${token}`)
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

// ─────────────────────────────  Monitoring  ────────────────────────────────

export interface Monitoring {
  id: number
  petId: number
  weight: string | null
  height: string | null
  temperature: string | null
  notes: string | null
  recordedBy: string | null
  recordedAt: string
}

export function useListMonitoring(petId: number | string | undefined) {
  const fetcher = useAuthedFetch()
  return useQuery<Monitoring[]>({
    queryKey: ['monitoring', petId],
    queryFn: () => fetcher(`/api/pets/${petId}/monitoring`),
    enabled: !!petId,
  })
}

export function useAddMonitoring() {
  const fetcher = useAuthedFetch()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ petId, data }: { petId: number; data: Partial<Monitoring> }) =>
      fetcher(`/api/pets/${petId}/monitoring`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { petId }) =>
      qc.invalidateQueries({ queryKey: ['monitoring', petId] }),
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
  totalCost?: number
  vetName?: string
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
