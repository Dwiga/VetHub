import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { useGetMe } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { useLang } from "@/contexts/LangContext";
import { useQuery } from "@tanstack/react-query";
import { Building2 } from "lucide-react";

export default function HotelHistoryPage() {
  const { t } = useLang();
  const me = useGetMe();
  const hotelId = me.data?.hotelId;
  const [, setLocation] = useLocation();

  const histQuery = useQuery({
    queryKey: ["hotel-bookings-history", hotelId],
    queryFn: async () => {
      const res = await fetch(`/api/hotel/clinic/${hotelId}/bookings`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!hotelId,
  });

  const all: any[] = (histQuery.data ?? []).filter((b: any) => b.status !== "active");

  return (
    <AppShell>
      <PageHeader title={t("guestHistory")} back backHref="/hotel" />

      {histQuery.isLoading && (
        <div className="space-y-3">
          {[0, 1, 2].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />)}
        </div>
      )}

      {!histQuery.isLoading && all.length === 0 && (
        <Card>
          <CardContent className="py-12 flex flex-col items-center gap-2">
            <Building2 className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">{t("noGuestHistory")}</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {all.map((b: any) => {
          const petDisplayName = b.petName ?? b.petNameRaw ?? "—";
          const ownerDisplayName = b.ownerName ?? b.guestName ?? "";
          const totalDays = b.checkOut
            ? Math.ceil((new Date(b.checkOut).getTime() - new Date(b.checkIn).getTime()) / (1000 * 60 * 60 * 24))
            : null;
          return (
            <Card
              key={b.id}
              className="hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => setLocation(`/hotel/${b.id}`)}
            >
              <CardContent className="py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{petDisplayName}</p>
                  <p className="text-xs text-muted-foreground">{ownerDisplayName}</p>
                </div>
                <div className="text-right shrink-0 space-y-0.5">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {b.status === "completed" ? t("completedBooking") : t("cancelledBooking")}
                  </span>
                  {totalDays && (
                    <p className="text-xs text-muted-foreground">{totalDays} {t("daysLabel")}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}
