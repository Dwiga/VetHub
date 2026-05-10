import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useGetMe, useListActiveVisits } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useLocation } from "wouter";
import { Search, Stethoscope, PawPrint } from "lucide-react";
import { useState } from "react";
import { useLang } from "@/contexts/LangContext";

function ActiveVisitsList({ clinicId }: { clinicId: number }) {
  const visits = useListActiveVisits(clinicId, { query: { queryKey: ["active-visits", clinicId] } });
  const list = visits.data ?? [];
  const { t } = useLang();

  if (visits.isLoading) return (
    <div className="space-y-3">
      {[1, 2].map(i => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}
    </div>
  );

  if (list.length === 0) return (
    <Card>
      <CardContent className="py-10 flex flex-col items-center gap-2">
        <Stethoscope className="h-10 w-10 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground text-center">{t("noActivePatientsShort")}</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-3">
      {list.map((v: any) => (
        <Link key={v.id} href={`/vet/visits/${v.id}`}>
          <Card className="hover:border-primary/50 transition-colors cursor-pointer" data-testid={`card-visit-${v.id}`}>
            <CardContent className="py-4 flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                <PawPrint className="h-5 w-5 text-primary/60" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-sm text-foreground" data-testid={`text-pet-name-${v.id}`}>{v.petName}</p>
                  <StatusBadge status={v.type ?? "outpatient"} />
                </div>
                <p className="text-xs text-muted-foreground">{v.ownerName} · {v.ownerPhone}</p>
                {v.latestReport && <p className="text-xs text-muted-foreground mt-1 truncate">{v.latestReport}</p>}
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-medium text-foreground">
                  {v.totalCost > 0 ? `Rp ${v.totalCost.toLocaleString("id-ID")}` : "—"}
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

export default function VetPage() {
  const me = useGetMe();
  const [, setLocation] = useLocation();
  const [searchInput, setSearchInput] = useState("");
  const { t } = useLang();
  const user = me.data;

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchInput.trim()) setLocation(`/vet/search?q=${encodeURIComponent(searchInput.trim())}`);
  }

  if (!user?.isVet && !user?.isVetOwner && !me.isLoading) {
    return (
      <AppShell>
        <div className="pt-12 flex flex-col items-center gap-4">
          <Stethoscope className="h-16 w-16 text-muted-foreground/30" />
          <p className="text-muted-foreground text-center">{t("notRegisteredVet")}</p>
          <Button asChild variant="outline" size="sm" data-testid="btn-go-settings">
            <Link href="/settings">{t("goToSettings")}</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader title={t("nav_clinic")} subtitle={t("activePatients")} />
      <div className="space-y-5">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder={t("searchPlaceholder")}
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            data-testid="input-search"
          />
          <Button type="submit" size="icon" variant="outline" data-testid="btn-search">
            <Search className="h-4 w-4" />
          </Button>
        </form>

        {user?.clinicId && <ActiveVisitsList clinicId={user.clinicId} />}
      </div>
    </AppShell>
  );
}
