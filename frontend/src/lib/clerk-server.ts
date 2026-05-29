import { createClerkClient, verifyToken } from '@clerk/backend'
import { prisma } from './db'

const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
})

/**
 * Extract the Clerk session token from an incoming Request and verify it.
 * Returns the Clerk user id (`sub`) when valid, otherwise null.
 */
export async function getAuthUserId(request: Request): Promise<string | null> {
  const authHeader = request.headers.get('authorization')
  let token: string | undefined

  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice('Bearer '.length).trim()
  } else {
    // Fallback to Clerk's session cookie (`__session`).
    const cookie = request.headers.get('cookie') ?? ''
    const match = cookie.match(/(?:^|;\s*)__session=([^;]+)/)
    if (match) token = decodeURIComponent(match[1])
  }

  if (!token) return null

  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!,
    })
    return payload.sub ?? null
  } catch {
    return null
  }
}

/**
 * Ensure a local DB user row exists for the authenticated Clerk user.
 * Returns the local User row (or null if not authenticated).
 */
export async function getOrCreateLocalUser(request: Request) {
  const clerkId = await getAuthUserId(request)
  if (!clerkId) return null

  const existing = await prisma.user.findUnique({ where: { clerkId } })
  if (existing) return existing

  // Fetch profile from Clerk to seed the local row.
  let name: string | null = null
  let email: string | null = null
  let phone: string | null = null
  try {
    const profile = await clerk.users.getUser(clerkId)
    name =
      [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim() ||
      profile.username ||
      null
    email = profile.primaryEmailAddress?.emailAddress ?? null
    phone = profile.primaryPhoneNumber?.phoneNumber ?? null
  } catch {
    // Swallow — we'll still create a minimal row.
  }

  return prisma.user.create({
    data: {
      clerkId,
      name,
      email,
      phone,
    },
  })
}

export { clerk }
