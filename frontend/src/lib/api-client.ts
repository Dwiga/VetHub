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

export function useRegisterAsPetOwner() {
  const fetcher = useAuthedFetch()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () =>
      fetcher('/api/users/me/register-pet-owner', { method: 'POST' }),
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

// ─────────────────────────────  Visits  ────────────────────────────────────

export interface Visit {
  id: number
  petId: number
  clinicId: number
  type: string
  status: string
  visitDate: string
  dischargeDate: string | null
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
