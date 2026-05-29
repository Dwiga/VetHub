import { createFileRoute } from '@tanstack/react-router'
import { SignUp } from '@clerk/clerk-react'
import { HAS_CLERK } from '@/lib/auth'
import { useState, useEffect } from 'react'

export const Route = createFileRoute('/sign-up/$')({
  component: SignUpPage,
})

function SignUpPage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" data-testid="sign-up-page">
      {HAS_CLERK ? (
        mounted ? (
          <SignUp
            key="sign-up"
            routing="path"
            path="/sign-up"
            signInUrl="/sign-in"
            fallbackRedirectUrl="/onboarding"
            appearance={{
              elements: {
                formFieldRow__firstName: { display: 'none !important' },
                formFieldRow__lastName: { display: 'none !important' },
              },
            }}
          />
        ) : (
          <div className="h-[400px]" />
        )
      ) : (
        <div className="max-w-md w-full rounded-2xl border border-amber-300 bg-amber-50 p-6 text-amber-900" data-testid="clerk-missing-notice">
          <h2 className="font-bold text-lg mb-2">Clerk not configured</h2>
          <p className="text-sm leading-relaxed">
            Set <code className="font-mono bg-amber-100 px-1 rounded">VITE_CLERK_PUBLISHABLE_KEY</code>{' '}
            and <code className="font-mono bg-amber-100 px-1 rounded">CLERK_SECRET_KEY</code> in{' '}
            <code className="font-mono bg-amber-100 px-1 rounded">/app/frontend/.env</code> and
            restart the frontend.
          </p>
        </div>
      )}
    </div>
  )
}
