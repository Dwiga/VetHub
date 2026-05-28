import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { useCreateHotelBooking, useGetPet, useGetMe } from "@/lib/api-client";
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
import { useToast } from "@/hooks/use-toast";
import { useLang } from "@/contexts/LangContext";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/hotel/new/$petId")({
  component: HotelNewPage,
});

const schema = z.object({
  checkIn: z.string().min(1),
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
  let guestName = "";
  let phone = pet.data?.owner?.phone ?? "";
  let petName = pet.data?.name ?? "";
  let speciesName = pet.data?.species?.name ?? "";

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      checkIn: "",
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

  async function onSubmit(values: z.infer<typeof schema>) {
    const hotelId = me.data?.hotelId;
    if (!hotelId) return;

    try {
      const booking = await createBooking.mutateAsync({
        petId,
        data: {
          clinicId: hotelId,
          checkIn: values.checkIn,
          roomType: values.roomType || undefined,
          dailyFee: values.dailyFee ? String(values.dailyFee) : undefined,
          notes: values.notes || undefined,
        },
      });
      toast({ title: t("bookingCreated") });
      navigate({
        to: "/hotel/$bookingId",
        params: { bookingId: String((booking as any).id) },
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to create booking",
        variant: "destructive",
      });
    }
  }

  const isLoading = pet.isLoading;

  return (
    <AppShell>
      <PageHeader title={t("newHotelBooking")} back backHref="/hotel/search" />

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
                ? t("creatingBooking")
                : t("createBooking")}
            </Button>
          </form>
        </Form>
      )}
    </AppShell>
  );
}
