import { createFileRoute } from '@tanstack/react-router'
import { SignIn } from '@clerk/clerk-react'
import { HAS_CLERK } from '@/lib/auth'
import { useState, useEffect } from 'react'

export const Route = createFileRoute('/sign-in/$')({
  component: SignInPage,
})

function SignInPage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" data-testid="sign-in-page">
      {HAS_CLERK ? (
        mounted ? (
          <SignIn
            key="sign-in"
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            fallbackRedirectUrl="/dashboard"
          />
        ) : (
          <div className="h-[400px]" />
        )
      ) : (
        <ClerkMissingNotice />
      )}
    </div>
  )
}

function ClerkMissingNotice() {
  return (
    <div className="max-w-md w-full rounded-2xl border border-amber-300 bg-amber-50 p-6 text-amber-900" data-testid="clerk-missing-notice">
      <h2 className="font-bold text-lg mb-2">Clerk not configured</h2>
      <p className="text-sm leading-relaxed">
        Set <code className="font-mono bg-amber-100 px-1 rounded">VITE_CLERK_PUBLISHABLE_KEY</code>{' '}
        and <code className="font-mono bg-amber-100 px-1 rounded">CLERK_SECRET_KEY</code> in{' '}
        <code className="font-mono bg-amber-100 px-1 rounded">/app/frontend/.env</code> and restart
        the frontend. Sign-in will then work end-to-end.
      </p>
    </div>
  )
}
