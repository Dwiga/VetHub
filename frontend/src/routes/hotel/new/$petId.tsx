import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { useCreateHotelBooking, useGetPet, useGetMe, useListAvailableRooms } from "@/lib/api-client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLang } from "@/contexts/LangContext";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/hotel/new/$petId")({
  component: HotelNewPage,
});

const schema = z.object({
  checkIn: z.string().min(1),
  expectedCheckOut: z.string().optional(),
  roomId: z.string().optional(),
  roomType: z.string().optional(),
  dailyFee: z.string().optional(),
  notes: z.string().optional(),
});

function HotelNewPage() {
  const { petId: petIdStr } = Route.useParams();
  const petId = parseInt(petIdStr);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLang();
  const me = useGetMe();
  const createBooking = useCreateHotelBooking();
  const pet = useGetPet(petId);
  const [reservationMode, setReservationMode] = useState(false);
  let guestName = pet.data?.owner?.name ?? pet.data?.guestContact?.name ?? "";
  let phone = pet.data?.owner?.phone ?? pet.data?.guestContact?.phone ?? "";
  let petName = pet.data?.name ?? "";
  let speciesName = pet.data?.species?.name ?? "";

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      checkIn: "",
      expectedCheckOut: "",
      roomId: undefined,
      roomType: "",
      dailyFee: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (!form.getValues("checkIn")) {
      form.setValue("checkIn", new Date().toISOString().split("T")[0]);
    }
  }, []);

  const checkIn = form.watch("checkIn");
  const expectedCheckOut = form.watch("expectedCheckOut");
  const effectiveCheckOut = expectedCheckOut || checkIn;
  const hotelId = me.data?.hotelId;
  const availableRooms = useListAvailableRooms(hotelId ?? undefined, checkIn, effectiveCheckOut);

  function handleRoomSelect(roomId: string) {
    form.setValue("roomId", roomId);
    const room = availableRooms.data?.find(r => String(r.id) === roomId);
    if (room?.dailyFee) {
      form.setValue("dailyFee", room.dailyFee);
    }
  }

  async function onSubmit(values: z.infer<typeof schema>) {
    const hid = me.data?.hotelId;
    if (!hid) return;

    try {
      const booking = await createBooking.mutateAsync({
        petId,
        data: {
          clinicId: hid,
          checkIn: values.checkIn,
          expectedCheckOut: values.expectedCheckOut || undefined,
          roomId: values.roomId ? Number(values.roomId) : undefined,
          roomType: values.roomType || undefined,
          dailyFee: values.dailyFee ? String(values.dailyFee) : undefined,
          notes: values.notes || undefined,
          status: reservationMode ? "reserved" : "active",
        },
      });
      toast({ title: reservationMode ? t("reservationCreated") : t("bookingCreated") });
      navigate({
        to: "/hotel/$bookingId",
        params: { bookingId: String((booking as any).id) },
      });
    } catch (err: any) {
      const msg = err?.message?.includes?.("room_already_booked")
        ? "Room is not available for the selected dates"
        : "Failed to create booking";
      toast({
        title: "Error",
        description: msg,
        variant: "destructive",
      });
    }
  }

  const isLoading = pet.isLoading;

  return (
    <AppShell>
      <PageHeader title={t("newHotelBooking")} back backHref="/hotel/guests" />

      {isLoading ? (
        <div className="space-y-4 pt-4">
          <div className="h-10 bg-muted animate-pulse rounded-lg" />
          <div className="h-10 bg-muted animate-pulse rounded-lg" />
          <div className="h-10 bg-muted animate-pulse rounded-lg" />
          <div className="h-10 bg-muted animate-pulse rounded-lg" />
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-3">
                {t("guestName")}
              </p>
              <div className="space-y-2 text-sm">
                <p><span className="text-muted-foreground">{t("guestName")}:</span> {guestName || '—'}</p>
                <p><span className="text-muted-foreground">{t("guestPhone")}:</span> {phone || '—'}</p>
                <p><span className="text-muted-foreground">{t("petNameRaw")}:</span> {petName || '—'}</p>
                <p><span className="text-muted-foreground">{t("petTypeRaw")}:</span> {speciesName || '—'}</p>
              </div>
            </div>

            <Separator />

            <div className={cn(
              "flex items-center justify-between p-3 rounded-lg border",
              reservationMode ? "bg-primary/5 border-primary/30" : "bg-muted/50"
            )}>
              <div>
                <p className="text-sm font-medium">{t("reservationMode")}</p>
                <p className="text-xs text-muted-foreground">{t("reservationModeHint")}</p>
              </div>
              <Switch
                checked={reservationMode}
                onCheckedChange={setReservationMode}
                data-testid="switch-reservation-mode"
              />
            </div>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="checkIn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("checkIn")}</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        data-testid="input-check-in"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {reservationMode && (
                <FormField
                  control={form.control}
                  name="expectedCheckOut"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("expectedCheckOut")}</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          data-testid="input-expected-check-out"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="roomId"
                render={() => (
                  <FormItem>
                    <FormLabel>{t("roomSelectLabel")}</FormLabel>
                    <FormControl>
                      <Select
                        value={form.watch("roomId")}
                        onValueChange={handleRoomSelect}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("roomSelectPlaceholder")} />
                        </SelectTrigger>
                        <SelectContent>
                          {availableRooms.data?.map((r) => (
                            <SelectItem key={r.id} value={String(r.id)}>
                              <span>{r.name}</span>
                              {r.type && <span className="text-muted-foreground ml-1">({r.type})</span>}
                              {r.dailyFee && <span className="text-muted-foreground ml-1">- Rp {Number(r.dailyFee).toLocaleString('id-ID')}</span>}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="roomType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("roomTypeLabel")}</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Small cage, VIP room" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dailyFee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("dailyFee")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        {...field}
                        data-testid="input-daily-fee"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("ownerNotes")}</FormLabel>
                    <FormControl>
                      <Textarea rows={3} placeholder="..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={createBooking.isPending}
              data-testid="btn-submit"
            >
              {createBooking.isPending
                ? t("saving")
                : reservationMode
                  ? t("reservationMode")
                  : t("createBooking")
              }
            </Button>
          </form>
        </Form>
      )}
    </AppShell>
  );
}
