import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useGetPet, useListMonitoring, useListVisits, getGetPetQueryKey } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Edit, Plus, Activity } from "lucide-react";
import { format } from "date-fns";

function MonitoringCharts({ petId }: { petId: number }) {
  const monitoring = useListMonitoring(petId, { query: { queryKey: ["monitoring", petId] } });
  const records = [...(monitoring.data ?? [])].reverse();

  if (monitoring.isLoading) return <div className="h-40 bg-muted animate-pulse rounded-xl" />;
  if (records.length === 0) return (
    <Card>
      <CardContent className="py-8 flex flex-col items-center gap-2">
        <Activity className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">No monitoring records yet</p>
        <Button asChild size="sm" variant="outline" data-testid="btn-add-monitoring-empty">
          <Link href={`/pets/${petId}/monitoring/new`}>Add record</Link>
        </Button>
      </CardContent>
    </Card>
  );

  const chartData = records.map(r => ({
    date: format(new Date(r.recordedAt), "MM/dd"),
    weight: r.weight ?? undefined,
    height: r.height ?? undefined,
    temperature: r.temperature ?? undefined,
  }));

  return (
    <div className="space-y-4">
      {records.some(r => r.weight != null) && (
        <Card>
          <CardHeader className="pb-2 pt-4"><CardTitle className="text-sm">Weight (kg)</CardTitle></CardHeader>
          <CardContent className="pb-4">
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={32} />
                <Tooltip />
                <Line type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
      {records.some(r => r.temperature != null) && (
        <Card>
          <CardHeader className="pb-2 pt-4"><CardTitle className="text-sm">Temperature (°C)</CardTitle></CardHeader>
          <CardContent className="pb-4">
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={32} />
                <Tooltip />
                <Line type="monotone" dataKey="temperature" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function VisitHistory({ petId }: { petId: number }) {
  const visits = useListVisits(petId, { query: { queryKey: ["visits", petId] } });
  const visitList = visits.data ?? [];

  if (visits.isLoading) return <div className="h-20 bg-muted animate-pulse rounded-xl" />;
  if (visitList.length === 0) return (
    <p className="text-sm text-muted-foreground text-center py-4">No visit history yet</p>
  );

  return (
    <div className="space-y-3">
      {visitList.map(v => (
        <Card key={v.id} className="hover:border-primary/50 transition-colors" data-testid={`card-visit-${v.id}`}>
          <CardContent className="py-3 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{v.visitDate}</p>
              <p className="text-xs text-muted-foreground truncate">{v.vetName ?? "No vet assigned"}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <StatusBadge status={v.type ?? "outpatient"} />
              <StatusBadge status={v.status ?? "active"} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function PetDetailPage() {
  const { petId } = useParams<{ petId: string }>();
  const id = parseInt(petId);
  const pet = useGetPet(id, { query: { queryKey: getGetPetQueryKey(id) } });
  const p = pet.data;

  if (pet.isLoading) return (
    <AppShell>
      <div className="space-y-4 pt-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-32 bg-muted animate-pulse rounded-xl" />
      </div>
    </AppShell>
  );

  if (!p) return <AppShell><p className="text-center text-muted-foreground pt-8">Pet not found</p></AppShell>;

  const age = p.dateOfBirth
    ? `${Math.floor((Date.now() - new Date(p.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} yrs`
    : null;

  return (
    <AppShell>
      <PageHeader
        title={p.name}
        subtitle={p.speciesName ?? undefined}
        back
        backHref="/pets"
        action={
          <Button asChild size="sm" variant="ghost" data-testid="btn-edit-pet">
            <Link href={`/pets/${id}/edit`}><Edit className="h-4 w-4" /></Link>
          </Button>
        }
      />

      <div className="space-y-5">
        <Card>
          <CardContent className="py-4">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center shrink-0 overflow-hidden">
                {p.photoUrl ? (
                  <img src={p.photoUrl} alt={p.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-3xl">🐾</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <StatusBadge status={p.status ?? "healthy"} />
                  {p.sterilized && (
                    <span className="text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5">Sterilized</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-y-1 text-sm">
                  {[
                    ["Gender", p.gender],
                    ["Age", age],
                    ["Color", p.color],
                    ["Owner", p.ownerName],
                  ].filter(([, v]) => v).map(([label, value]) => (
                    <div key={label as string}>
                      <span className="text-muted-foreground text-xs">{label}</span>
                      <p className="font-medium text-xs truncate">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground text-sm">Health monitoring</h2>
          <Button asChild size="sm" variant="outline" data-testid="btn-add-monitoring">
            <Link href={`/pets/${id}/monitoring/new`}><Plus className="h-4 w-4 mr-1" />Record</Link>
          </Button>
        </div>
        <MonitoringCharts petId={id} />

        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground text-sm">Visit history</h2>
        </div>
        <VisitHistory petId={id} />
      </div>
    </AppShell>
  );
}
