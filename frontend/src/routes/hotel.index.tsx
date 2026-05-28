import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/shared/PageHeader'
import { useGetMe, useListHotelBookings } from '@/lib/api-client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Building2, Plus, PawPrint, Search } from 'lucide-react'
import { useState } from 'react'
import { useLang } from '@/contexts/LangContext'

export const Route = createFileRoute('/hotel/')({
  component: HotelDashboardPage,
})

function HotelDashboardPage() {
  const { t } = useLang()
  const me = useGetMe()
  const hotelId = me.data?.hotelId
  const navigate = useNavigate()
  const [searchInput, setSearchInput] = useState('')

  const activeQuery = useListHotelBookings(hotelId ?? undefined, 'active')
  const bookings: any[] = activeQuery.data ?? []

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (searchInput.trim())
      navigate({ to: '/hotel/search', search: { q: searchInput.trim() } })
  }

  return (
    <AppShell>
      <PageHeader
        title={t('activeGuests')}
        action={
          <Button asChild size="sm" variant="outline">
            <Link to="/hotel/new">
              <Plus className="h-4 w-4 mr-1" />
              {t('newGuest')}
            </Link>
          </Button>
        }
      />

      <div className="space-y-5">
        <form onSubmit={handleSearch} className="flex gap-2 mb-2">
          <Input
            placeholder={t('searchPlaceholder')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            data-testid="input-search"
          />
          <Button
            type="submit"
            size="icon"
            variant="outline"
            data-testid="btn-search"
          >
            <Search className="h-4 w-4" />
          </Button>
        </form>

        {activeQuery.isLoading && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-20 bg-muted animate-pulse rounded-xl"
              />
            ))}
          </div>
        )}

        {!activeQuery.isLoading && bookings.length === 0 && (
          <Card>
            <CardContent className="py-12 flex flex-col items-center gap-3">
              <Building2 className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground text-center">
                {t('noActiveGuests')}
              </p>
              <Button asChild size="sm" variant="outline">
                <Link to="/hotel/new">{t('newGuest')}</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {bookings.map((b: any) => {
            const daysIn = Math.max(
              1,
              Math.ceil(
                (Date.now() - new Date(b.checkIn).getTime()) /
                  (1000 * 60 * 60 * 24),
              ),
            )
            const displayName = b.pet?.name ?? '—'
            const displayType = b.pet?.species?.name ?? ''
            const ownerName = b.pet?.owner?.name ?? ''
            return (
              <Card
                key={b.id}
                className="hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() =>
                  navigate({
                    to: '/hotel/$bookingId',
                    params: { bookingId: String(b.id) },
                  })
                }
              >
                <CardContent className="py-3 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <PawPrint className="h-4 w-4 text-primary/60" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {displayType}
                      {displayType && ownerName ? ' · ' : ''}
                      {ownerName}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-medium text-primary">
                      {daysIn} {t('daysLabel')}
                    </p>
                    <p className="text-xs text-muted-foreground">{b.checkIn}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {bookings.length > 0 && (
          <div className="pt-2">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground"
            >
              <Link to="/hotel/history">{t('guestHistory')}</Link>
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  )
}
