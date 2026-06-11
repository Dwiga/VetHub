import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/shared/PageHeader'
import { useGetMe, useListHotelRooms, useCreateHotelRoom, useUpdateHotelRoom, useDeleteHotelRoom } from '@/lib/api-client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Pencil, Trash2, DoorOpen, Settings } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useLang } from '@/contexts/LangContext'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/hotel/rooms')({
  component: HotelRoomsPage,
})

const EMPTY_ROOM = { name: '', type: '', capacity: '', dailyFee: '', status: 'available' as string }

const ROOM_TYPES = ['Standard Cage', 'Large Cage', 'VIP Room', 'Cat Room', 'Isolation', 'Play Area', 'Other']
const ROOM_STATUSES = ['available', 'occupied', 'maintenance']

function HotelRoomsPage() {
  const { t } = useLang()
  const { toast } = useToast()
  const me = useGetMe()
  const hotelId = me.data?.hotelId

  const roomsQuery = useListHotelRooms(hotelId ?? undefined)
  const createRoom = useCreateHotelRoom()
  const updateRoom = useUpdateHotelRoom()
  const deleteRoom = useDeleteHotelRoom()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<any>(null)
  const [form, setForm] = useState(EMPTY_ROOM)
  const [saving, setSaving] = useState(false)

  function openCreate() {
    setEditingRoom(null)
    setForm(EMPTY_ROOM)
    setDialogOpen(true)
  }

  function openEdit(room: any) {
    setEditingRoom(room)
    setForm({
      name: room.name ?? '',
      type: room.type ?? '',
      capacity: room.capacity ? String(room.capacity) : '',
      dailyFee: room.dailyFee ?? '',
      status: room.status ?? 'available',
    })
    setDialogOpen(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      if (editingRoom) {
        await updateRoom.mutateAsync({
          roomId: editingRoom.id,
          data: {
            name: form.name,
            type: form.type || undefined,
            capacity: form.capacity || undefined,
            dailyFee: form.dailyFee || undefined,
            status: form.status,
          },
        })
        toast({ title: t('roomUpdated') })
      } else {
        await createRoom.mutateAsync({
          data: {
            name: form.name,
            type: form.type || undefined,
            capacity: form.capacity || undefined,
            dailyFee: form.dailyFee || undefined,
          },
        })
        toast({ title: t('roomCreated') })
      }
      setDialogOpen(false)
    } catch {
      toast({ title: 'Error', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(roomId: number) {
    if (!confirm(t('deleteRoomConfirm'))) return
    await deleteRoom.mutateAsync({ roomId })
    toast({ title: t('roomDeleted') })
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  const rooms: any[] = roomsQuery.data ?? []

  return (
    <AppShell>
      <PageHeader
        title={t('roomManagement')}
        back
        backHref="/hotel"
        action={
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" />
            {t('addRoom')}
          </Button>
        }
      />

      <div className="space-y-4">
        {roomsQuery.isLoading && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        )}

        {!roomsQuery.isLoading && rooms.length === 0 && (
          <Card>
            <CardContent className="py-12 flex flex-col items-center gap-4">
              <DoorOpen className="h-10 w-10 text-muted-foreground/40" />
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">{t('noRoomsYet')}</p>
                <p className="text-xs text-muted-foreground/70">{t('noRoomsHint')}</p>
              </div>
              <Button size="sm" variant="outline" onClick={openCreate}>
                {t('addRoom')}
              </Button>
            </CardContent>
          </Card>
        )}

        {!roomsQuery.isLoading && rooms.length > 0 && (
          <div className="space-y-2">
            {rooms.map((room: any) => {
              const activeBookings = room.bookings ?? []
              const isOccupied = activeBookings.length > 0 || room.status === 'occupied'
              const isMaintenance = room.status === 'maintenance'

              return (
                <Card key={room.id} className={cn(
                  isMaintenance && 'opacity-60 border-dashed',
                )}>
                  <CardContent className="py-3 flex items-center gap-3">
                    <div className={cn(
                      'h-10 w-10 rounded-full flex items-center justify-center shrink-0',
                      isMaintenance ? 'bg-gray-100' : isOccupied ? 'bg-orange-100' : 'bg-green-100',
                    )}>
                      <DoorOpen className={cn(
                        'h-4 w-4',
                        isMaintenance ? 'text-gray-400' : isOccupied ? 'text-orange-600' : 'text-green-600',
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{room.name}</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                        {room.type && <span>{room.type}</span>}
                        {room.capacity != null && <span>{t('capacityLabel')}: {room.capacity}</span>}
                        {room.dailyFee && <span>Rp {Number(room.dailyFee).toLocaleString('id-ID')}/{t('dayUnit')}</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={cn(
                          'text-[10px] px-1.5 py-0.5 rounded-full font-medium',
                          isMaintenance ? 'bg-gray-100 text-gray-600' :
                          isOccupied ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700',
                        )}>
                          {isMaintenance ? t('roomStatusMaintenance') : isOccupied ? t('roomStatusOccupied') : t('roomStatusAvailable')}
                        </span>
                        {activeBookings.length > 0 && (
                          <span className="text-[10px] text-muted-foreground">
                            {activeBookings.length} {t('activeBookingsCount')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(room)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(room.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {rooms.length > 0 && (
          <p className="text-xs text-muted-foreground text-center pt-2">
            {t('roomManagementHint')}
          </p>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>{editingRoom ? t('editRoom') : t('addRoom')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-3 pt-1">
            <div className="space-y-1">
              <Label htmlFor="room-name">{t('roomName')} *</Label>
              <Input id="room-name" name="name" value={form.name} onChange={handleChange} placeholder={t('roomNamePlaceholder')} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="room-type">{t('roomType')}</Label>
              <Select value={form.type} onValueChange={(v) => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger id="room-type">
                  <SelectValue placeholder={t('selectRoomType')} />
                </SelectTrigger>
                <SelectContent>
                  {ROOM_TYPES.map(rt => (
                    <SelectItem key={rt} value={rt}>{rt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="room-capacity">{t('capacityLabel')}</Label>
                <Input id="room-capacity" name="capacity" type="number" min="0" value={form.capacity} onChange={handleChange} placeholder="1" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="room-fee">{t('dailyFee')}</Label>
                <Input id="room-fee" name="dailyFee" type="number" min="0" value={form.dailyFee} onChange={handleChange} placeholder="0" />
              </div>
            </div>
            {editingRoom && (
              <div className="space-y-1">
                <Label htmlFor="room-status">{t('roomStatus')}</Label>
                <Select value={form.status} onValueChange={(v) => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger id="room-status">
                    <SelectValue placeholder={t('selectStatus')} />
                  </SelectTrigger>
                  <SelectContent>
                    {ROOM_STATUSES.map(s => (
                      <SelectItem key={s} value={s}>
                        {s === 'available' ? t('roomStatusAvailable') : s === 'occupied' ? t('roomStatusOccupied') : t('roomStatusMaintenance')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={saving || !form.name}>
              {saving ? t('saving') : editingRoom ? t('save') : t('addRoom')}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
