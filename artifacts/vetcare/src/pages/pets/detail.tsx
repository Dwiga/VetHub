import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  useGetPet, useListMonitoring, useListVisits, getGetPetQueryKey,
  useListVaccinations, getListVaccinationsQueryKey,
  useAddVaccination, useDeleteVaccination,
} from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Edit, Plus, Activity, Syringe, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRole } from "@/contexts/RoleContext";

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
        <Link key={v.id} href={`/vet/visits/${v.id}`}>
          <Card className="hover:border-primary/50 transition-colors cursor-pointer" data-testid={`card-visit-${v.id}`}>
            <CardContent className="py-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{v.visitDate}</p>
                  <p className="text-xs text-muted-foreground truncate">{v.vetName ?? "No vet assigned"}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={v.type ?? "outpatient"} />
                  <StatusBadge status={v.status ?? "active"} />
                </div>
              </div>
              {(v.totalCost ?? 0) > 0 && (
                <p className="text-xs text-muted-foreground mt-1.5">
                  Total: <span className="font-semibold text-foreground">Rp {(v.totalCost ?? 0).toLocaleString("id-ID")}</span>
                </p>
              )}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

const EMPTY_FORM = {
  vaccineName: "",
  brand: "",
  date: new Date().toISOString().split("T")[0],
  nextDueDate: "",
  batchNumber: "",
  administeredBy: "",
  cost: "",
  notes: "",
};

function VaccinationSection({ petId }: { petId: number }) {
  const { activeRole } = useRole();
  const isVet = activeRole === "vet";
  const qc = useQueryClient();
  const vaccinationsQuery = useListVaccinations(petId, { query: { queryKey: getListVaccinationsQueryKey(petId) } });
  const addMutation = useAddVaccination();
  const deleteMutation = useDeleteVaccination();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const records = vaccinationsQuery.data ?? [];

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.vaccineName || !form.date) return;
    await addMutation.mutateAsync({
      petId,
      data: {
        vaccineName: form.vaccineName,
        brand: form.brand || undefined,
        date: form.date,
        nextDueDate: form.nextDueDate || undefined,
        batchNumber: form.batchNumber || undefined,
        administeredBy: form.administeredBy || undefined,
        cost: form.cost ? parseFloat(form.cost) : undefined,
        notes: form.notes || undefined,
      },
    });
    await qc.invalidateQueries({ queryKey: getListVaccinationsQueryKey(petId) });
    setForm(EMPTY_FORM);
    setOpen(false);
  }

  async function handleDelete(vaccinationId: number) {
    if (!confirm("Delete this vaccination record?")) return;
    await deleteMutation.mutateAsync({ vaccinationId });
    await qc.invalidateQueries({ queryKey: getListVaccinationsQueryKey(petId) });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-foreground text-sm">Vaccination records</h2>
        {isVet && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" data-testid="btn-add-vaccination">
                <Plus className="h-4 w-4 mr-1" />Add
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm mx-auto">
              <DialogHeader>
                <DialogTitle>Add vaccination</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-3 pt-1">
                <div className="space-y-1">
                  <Label htmlFor="vaccineName">Vaccine name *</Label>
                  <Input id="vaccineName" name="vaccineName" value={form.vaccineName} onChange={handleChange} placeholder="e.g. Rabies, DHPP" required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="brand">Brand / manufacturer</Label>
                  <Input id="brand" name="brand" value={form.brand} onChange={handleChange} placeholder="e.g. Nobivac" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="date">Date given *</Label>
                    <Input id="date" name="date" type="date" value={form.date} onChange={handleChange} required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="nextDueDate">Next due date</Label>
                    <Input id="nextDueDate" name="nextDueDate" type="date" value={form.nextDueDate} onChange={handleChange} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="batchNumber">Batch no.</Label>
                    <Input id="batchNumber" name="batchNumber" value={form.batchNumber} onChange={handleChange} placeholder="Optional" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="cost">Cost (Rp)</Label>
                    <Input id="cost" name="cost" type="number" min="0" value={form.cost} onChange={handleChange} placeholder="0" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="administeredBy">Administered by</Label>
                  <Input id="administeredBy" name="administeredBy" value={form.administeredBy} onChange={handleChange} placeholder="Vet name or clinic" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" name="notes" value={form.notes} onChange={handleChange} placeholder="Any additional notes..." rows={2} />
                </div>
                <Button type="submit" className="w-full" disabled={addMutation.isPending}>
                  {addMutation.isPending ? "Saving..." : "Save vaccination"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {vaccinationsQuery.isLoading ? (
        <div className="h-20 bg-muted animate-pulse rounded-xl" />
      ) : records.length === 0 ? (
        <Card>
          <CardContent className="py-8 flex flex-col items-center gap-2">
            <Syringe className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No vaccination records yet</p>
            {isVet && (
              <p className="text-xs text-muted-foreground">Use the Add button to log vaccines, including past records from the vaccine book</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {records.map(v => (
            <Card key={v.id} data-testid={`card-vaccination-${v.id}`}>
              <CardContent className="py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{v.vaccineName}</p>
                    {v.brand && <p className="text-xs text-muted-foreground">{v.brand}</p>}
                    <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      <span>Given: <span className="text-foreground font-medium">{v.date}</span></span>
                      {v.nextDueDate && (
                        <span>Next due: <span className="text-foreground font-medium">{v.nextDueDate}</span></span>
                      )}
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      {v.administeredBy && <span>By: {v.administeredBy}</span>}
                      {v.batchNumber && <span>Batch: {v.batchNumber}</span>}
                      {v.cost != null && v.cost > 0 && (
                        <span>Rp {(v.cost as number).toLocaleString("id-ID")}</span>
                      )}
                    </div>
                    {v.notes && <p className="text-xs text-muted-foreground mt-1 italic">{v.notes}</p>}
                  </div>
                  {isVet && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => handleDelete(v.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`btn-delete-vaccination-${v.id}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
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

        <VaccinationSection petId={id} />

        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground text-sm">Visit history</h2>
        </div>
        <VisitHistory petId={id} />
      </div>
    </AppShell>
  );
}
