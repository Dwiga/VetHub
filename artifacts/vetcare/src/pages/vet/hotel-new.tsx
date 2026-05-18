import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { useCreateHotelBooking, useGetPet, getGetPetQueryKey } from "@workspace/api-client-react";
import { useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLang } from "@/contexts/LangContext";
import { Card, CardContent } from "@/components/ui/card";
import { PawPrint } from "lucide-react";

const schema = z.object({
  checkIn: z.string().min(1),
  dailyFee: z.string().optional(),
  notes: z.string().optional(),
});

export default function HotelNewPage() {
  const { petId: petIdStr } = useParams<{ petId: string }>();
  const petId = parseInt(petIdStr);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useLang();
  const createBooking = useCreateHotelBooking();
  const pet = useGetPet(petId, { query: { queryKey: getGetPetQueryKey(petId) } });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      checkIn: new Date().toISOString().split("T")[0],
      dailyFee: "",
      notes: "",
    },
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    const booking = await createBooking.mutateAsync({
      petId,
      data: {
        checkIn: values.checkIn,
        dailyFee: values.dailyFee ? parseFloat(values.dailyFee) : undefined,
        notes: values.notes || undefined,
      },
    });
    toast({ title: t("bookingCreated") });
    setLocation(`/vet/hotel/${booking.id}`);
  }

  return (
    <AppShell>
      <PageHeader title={t("newHotelBooking")} back backHref="/vet/hotel" />

      {pet.data && (
        <Card className="mb-5">
          <CardContent className="py-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center shrink-0">
              <PawPrint className="h-4 w-4 text-primary/60" />
            </div>
            <div>
              <p className="font-semibold text-sm">{pet.data.name}</p>
              <p className="text-xs text-muted-foreground">{pet.data.speciesName} · {pet.data.ownerName}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField control={form.control} name="checkIn" render={({ field }) => (
            <FormItem>
              <FormLabel>{t("checkIn")}</FormLabel>
              <FormControl><Input type="date" {...field} data-testid="input-check-in" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="dailyFee" render={({ field }) => (
            <FormItem>
              <FormLabel>{t("dailyFee")}</FormLabel>
              <FormControl><Input type="number" min="0" placeholder="0" {...field} data-testid="input-daily-fee" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="notes" render={({ field }) => (
            <FormItem>
              <FormLabel>{t("notes")}</FormLabel>
              <FormControl><Textarea rows={3} placeholder="..." {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <Button type="submit" className="w-full" disabled={createBooking.isPending} data-testid="btn-submit">
            {createBooking.isPending ? t("creatingBooking") : t("createBooking")}
          </Button>
        </form>
      </Form>
    </AppShell>
  );
}
