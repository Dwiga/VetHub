import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/shared/PageHeader'
import { useGetMe, useListHotelBookings, useListHotelRooms } from '@/lib/api-client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Building2, UserPlus, PawPrint, Search, Calendar, DoorOpen } from 'lucide-react'
import { useState } from 'react'
import { useLang } from '@/contexts/LangContext'
import { cn } from '@/lib/utils'

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
  const reservedQuery = useListHotelBookings(hotelId ?? undefined, 'reserved')
  const roomsQuery = useListHotelRooms(hotelId ?? undefined)
  const bookings: any[] = activeQuery.data ?? []
  const reservations: any[] = reservedQuery.data ?? []
  const rooms: any[] = roomsQuery.data ?? []
  const totalSlots = rooms
    .filter((r: any) => r.status !== 'maintenance')
    .reduce((sum: number, r: any) => sum + (r.capacity ?? 1), 0)
  const usedSlots = rooms
    .filter((r: any) => r.status !== 'maintenance')
    .reduce((sum: number, r: any) => sum + Math.min((r.bookings ?? []).length, r.capacity ?? 1), 0)
  const availableSlots = totalSlots - usedSlots

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
          <div className="flex gap-1">
            <Button asChild size="sm" variant="outline">
              <Link to="/hotel/rooms">
                <DoorOpen className="h-4 w-4 mr-1" />
                {t('rooms')}
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/hotel/guests" search={{ phone: '' }}>
                <UserPlus className="h-4 w-4 mr-1" />
                {t('newGuest')}
              </Link>
            </Button>
          </div>
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

        {rooms.length > 0 && (
          <Link to="/hotel/rooms" className="block">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer bg-muted/30">
              <CardContent className="py-3 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <DoorOpen className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{t('roomOccupancy')}</p>
                  <p className="text-xs text-muted-foreground">
                    {availableSlots} {t('roomStatusAvailable')} ({usedSlots}/{totalSlots} {t('roomOccupiedLabel')})
                  </p>
                </div>
                <div className="shrink-0">
                  <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${totalSlots > 0 ? (usedSlots / totalSlots) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}

        {/* Loading skeleton */}
        {(activeQuery.isLoading || reservedQuery.isLoading) && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-20 bg-muted animate-pulse rounded-xl"
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!activeQuery.isLoading && !reservedQuery.isLoading && bookings.length === 0 && reservations.length === 0 && (
          <Card>
            <CardContent className="py-12 flex flex-col items-center gap-4">
              <Building2 className="h-10 w-10 text-muted-foreground/40" />
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  {t('noActiveGuests')}
                </p>
                <p className="text-xs text-muted-foreground/70 max-w-xs leading-relaxed">
                  {t('howToAddNewGuest')}
                </p>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link to="/hotel/guests" search={{ phone: '' }}>{t('newGuest')}</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Reservations section */}
        {!reservedQuery.isLoading && reservations.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {t('reservationMode')} ({reservations.length})
            </h2>
            <div className="space-y-2">
              {reservations.map((b: any) => {
                const displayName = b.pet?.name ?? '—'
                const displayType = b.pet?.species?.name ?? ''
                const ownerName = b.pet?.owner?.name ?? ''
                return (
                  <Card
                    key={b.id}
                    className="hover:border-yellow-300 transition-colors cursor-pointer bg-yellow-50/30 border-yellow-200"
                    onClick={() =>
                      navigate({
                        to: '/hotel/$bookingId',
                        params: { bookingId: String(b.id) },
                      })
                    }
                  >
                    <CardContent className="py-3 flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-yellow-100 flex items-center justify-center shrink-0">
                        <Calendar className="h-4 w-4 text-yellow-600" />
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
                        <p className="text-xs font-medium text-yellow-700">
                          {b.checkIn}
                        </p>
                        {b.expectedCheckOut && (
                          <p className="text-xs text-muted-foreground">{b.expectedCheckOut}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* Active guests section */}
        {!activeQuery.isLoading && bookings.length > 0 && (
          <div className="space-y-2">
            {reservations.length > 0 && (
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {t('activeGuests')} ({bookings.length})
              </h2>
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
                    className={cn(
                      "hover:border-primary/50 transition-colors cursor-pointer",
                      reservations.length === 0 && ""
                    )}
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
          </div>
        )}

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
