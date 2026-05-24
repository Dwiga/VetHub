import type { ReactNode } from 'react'
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { QueryClientProvider } from '@tanstack/react-query'
import { ClerkProvider } from '@clerk/clerk-react'
import { Toaster } from '@/components/ui/toaster'
import { LangProvider } from '@/contexts/LangContext'
import { RoleProvider } from '@/contexts/RoleContext'
import globalsCss from '@/globals.css?url'

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'VetCare Pro' },
      { name: 'description', content: 'Modern veterinary care management' },
    ],
    links: [{ rel: 'stylesheet', href: globalsCss }],
  }),
  component: RootComponent,
})

const PUBLISHABLE_KEY =
  (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined) ?? ''

// We only mount ClerkProvider when a real key is present. With a placeholder
// key Clerk throws synchronously during SSR, which crashes every route — even
// the public landing page. Treating an obviously-fake key as "no auth yet"
// lets the rest of the app render so devs can verify the toolchain.
const isRealClerkKey =
  PUBLISHABLE_KEY.startsWith('pk_test_') || PUBLISHABLE_KEY.startsWith('pk_live_')

const HAS_VALID_CLERK_KEY =
  isRealClerkKey && !PUBLISHABLE_KEY.includes('REPLACE_ME')

function RootComponent() {
  return (
    <RootDocument>
      <ClerkBoundary>
        <QueryProviders>
          <LangProvider>
            <RoleProvider>
              <Outlet />
              <Toaster />
            </RoleProvider>
          </LangProvider>
        </QueryProviders>
      </ClerkBoundary>
    </RootDocument>
  )
}

function ClerkBoundary({ children }: { children: ReactNode }) {
  if (!HAS_VALID_CLERK_KEY) return <>{children}</>
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      {children}
    </ClerkProvider>
  )
}

function QueryProviders({ children }: { children: ReactNode }) {
  const { queryClient } = Route.useRouteContext()
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
