import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useGetMe } from '@/lib/api-client'

type ActiveRole = 'pet-owner' | 'vet' | 'hotel'

interface RoleContextValue {
  activeRole: ActiveRole
  setActiveRole: (role: ActiveRole) => void
  hasBothRoles: boolean
  canSwitchToVet: boolean
  canSwitchToPetOwner: boolean
  canSwitchToHotel: boolean
}

const RoleContext = createContext<RoleContextValue>({
  activeRole: 'pet-owner',
  setActiveRole: () => {},
  hasBothRoles: false,
  canSwitchToVet: false,
  canSwitchToPetOwner: false,
  canSwitchToHotel: false,
})

const STORAGE_KEY = 'vetcare_active_role'

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const me = useGetMe()
  const user = me.data

  const isVetApproved =
    !!(user?.isVet || user?.isVetOwner) && user?.vetStatus === 'approved'
  const isPetOwner = !!user?.isPetOwner
  const isHotelOwner = !!user?.isHotelOwner
  const hasBothRoles = (isVetApproved || isHotelOwner) && isPetOwner

  // Default to "pet-owner" on the server; hydrate from localStorage after mount.
  const [activeRole, setActiveRoleState] = useState<ActiveRole>('pet-owner')

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as ActiveRole | null
      if (stored === 'pet-owner' || stored === 'vet' || stored === 'hotel') {
        setActiveRoleState(stored)
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    if (!me.isLoading && user) {
      let stored: ActiveRole | null = null
      try {
        stored = localStorage.getItem(STORAGE_KEY) as ActiveRole | null
      } catch {
        // ignore
      }
      if (!stored) {
        if (isVetApproved && !isPetOwner) {
          setActiveRoleState('vet')
        } else if (isHotelOwner && !isPetOwner && !isVetApproved) {
          setActiveRoleState('hotel')
        } else {
          setActiveRoleState('pet-owner')
        }
      } else if (stored === 'vet' && !isVetApproved) {
        setActiveRoleState('pet-owner')
      } else if (stored === 'hotel' && !isHotelOwner) {
        setActiveRoleState('pet-owner')
      } else if (stored === 'pet-owner' && !isPetOwner) {
        if (isVetApproved) {
          setActiveRoleState('vet')
        } else if (isHotelOwner) {
          setActiveRoleState('hotel')
        }
      }
    }
  }, [me.isLoading, isVetApproved, isPetOwner, isHotelOwner, user])

  const setActiveRole = useCallback((role: ActiveRole) => {
    setActiveRoleState(role)
    try {
      localStorage.setItem(STORAGE_KEY, role)
    } catch {
      // ignore
    }
  }, [])

  return (
    <RoleContext.Provider
      value={{
        activeRole,
        setActiveRole,
        hasBothRoles,
        canSwitchToVet: isVetApproved,
        canSwitchToPetOwner: isPetOwner,
        canSwitchToHotel: isHotelOwner,
      }}
    >
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  return useContext(RoleContext)
}
