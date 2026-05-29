/**
 * Auth hooks shim. When a real Clerk publishable key is configured we delegate
 * to @clerk/clerk-react; otherwise we return inert stubs so the rest of the UI
 * can still render in dev without crashing. Once the developer drops in a real
 * `VITE_CLERK_PUBLISHABLE_KEY`, all auth wiring resumes automatically.
 */
import * as Clerk from '@clerk/clerk-react'

const KEY = (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined) ?? ''
const isReal = (KEY.startsWith('pk_test_') || KEY.startsWith('pk_live_')) && !KEY.includes('REPLACE_ME')

export const HAS_CLERK = isReal

export function useAuth() {
  if (HAS_CLERK) return Clerk.useAuth()
  return {
    isLoaded: true,
    isSignedIn: false,
    userId: null,
    sessionId: null,
    getToken: async () => null,
    signOut: async () => {},
  } as unknown as ReturnType<typeof Clerk.useAuth>
}

export function useUser() {
  if (HAS_CLERK) return Clerk.useUser()
  return {
    isLoaded: true,
    isSignedIn: false,
    user: null,
  } as unknown as ReturnType<typeof Clerk.useUser>
}
