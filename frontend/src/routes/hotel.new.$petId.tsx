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
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PawPrint } from "lucide-react";

const hotelBookingSearchSchema = z.object({
  ownerName: z.string().optional(),
  ownerPhone: z.string().optional(),
  petName: z.string().optional(),
  petType: z.string().optional(),
});

export const Route = createFileRoute("/hotel/new/$petId")({
  validateSearch: hotelBookingSearchSchema,
  component: HotelNewPage,
});

const schema = z.object({
  checkIn: z.string().min(1),
  deposit: z.string().optional(),
  roomType: z.string().optional(),
  dailyFee: z.string().optional(),
  notes: z.string().optional(),
});

function HotelNewPage() {
  const { petId: petIdStr } = Route.useParams();
  const search = Route.useSearch();
  const petId = parseInt(petIdStr);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLang();
  const me = useGetMe();
  const createBooking = useCreateHotelBooking();
  const pet = useGetPet(petId);

  const petOwner = (pet.data as any)?.owner;
  const ownerName = petOwner?.name ?? search.ownerName ?? "";
  const ownerPhone = petOwner?.phone ?? search.ownerPhone ?? "";
  const resolvedPetName = pet.data?.name || search.petName || "—";
  const resolvedPetType = pet.data?.species?.name || search.petType || "";

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      checkIn: "",
      deposit: "",
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
          deposit: values.deposit ? String(values.deposit) : undefined,
          roomType: values.roomType || undefined,
          dailyFee: values.dailyFee ? parseFloat(values.dailyFee) : undefined,
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

  return (
    <AppShell>
      <PageHeader title={t("newHotelBooking")} back backHref="/hotel/search" />

      <div className="space-y-4 mb-5">
        <Card>
          <CardContent className="py-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center shrink-0">
              <PawPrint className="h-4 w-4 text-primary/60" />
            </div>
            <div>
              <p className="font-semibold text-sm">{resolvedPetName}</p>
              <p className="text-xs text-muted-foreground">{resolvedPetType}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-3">
              {t("guestName")}
            </p>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">{t("guestName")}</label>
                <Input value={ownerName} readOnly className="bg-muted" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">{t("guestPhone")}</label>
                <Input value={ownerPhone} readOnly className="bg-muted" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">{t("petNameRaw")}</label>
                <Input value={resolvedPetName} readOnly className="bg-muted" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">{t("petTypeRaw")}</label>
                <Input value={resolvedPetType} readOnly className="bg-muted" />
              </div>
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
              name="deposit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("depositLabel")}</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" placeholder="0" {...field} />
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
    </AppShell>
  );
}
