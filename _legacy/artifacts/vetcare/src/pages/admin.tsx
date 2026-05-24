import { useState } from "react";
import { useGetMe, useListVetApplications, useUpdateVetApplication, useListSpecies, useAdminAddSpecies, useAdminDeleteSpecies, useListAdmins, useAddAdmin, useDeleteAdmin } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Trash2, Plus, Check, X, Clock } from "lucide-react";
import { Redirect } from "wouter";

function statusBadge(status: string | null | undefined) {
  if (status === "approved") return <Badge className="bg-green-100 text-green-800 border-green-200">Disetujui</Badge>;
  if (status === "rejected") return <Badge className="bg-red-100 text-red-800 border-red-200">Ditolak</Badge>;
  return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"><Clock className="h-3 w-3 mr-1 inline" />Menunggu</Badge>;
}

function VetApprovalsTab() {
  const { data: vets = [], isLoading } = useListVetApplications();
  const updateVet = useUpdateVetApplication();
  const qc = useQueryClient();
  const { toast } = useToast();

  async function handleStatus(userId: number, vetStatus: "approved" | "rejected" | "pending") {
    await updateVet.mutateAsync({ userId, data: { vetStatus } });
    await qc.invalidateQueries();
    toast({ title: vetStatus === "approved" ? "Dokter disetujui" : vetStatus === "rejected" ? "Dokter ditolak" : "Status diubah" });
  }

  if (isLoading) return <div className="py-8 text-center text-muted-foreground text-sm">Memuat...</div>;

  const sorted = [...vets].sort((a, b) => {
    const order = { pending: 0, approved: 1, rejected: 2 };
    return (order[a.vetStatus as keyof typeof order] ?? 0) - (order[b.vetStatus as keyof typeof order] ?? 0);
  });

  if (!sorted.length) return <div className="py-8 text-center text-muted-foreground text-sm">Belum ada pendaftaran dokter.</div>;

  return (
    <div className="space-y-3">
      {sorted.map(v => (
        <div key={v.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{v.name ?? "(Tanpa nama)"}</p>
              <p className="text-xs text-muted-foreground truncate">{v.email ?? "-"}</p>
              <p className="text-xs text-muted-foreground">{v.phone ?? "-"}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{v.isVetOwner ? "Pemilik klinik" : "Dokter"}</p>
            </div>
            <div className="shrink-0">{statusBadge(v.vetStatus)}</div>
          </div>
          {v.vetStatus !== "approved" && (
            <Button
              size="sm"
              variant="default"
              className="w-full h-8 text-xs"
              disabled={updateVet.isPending}
              onClick={() => handleStatus(v.id, "approved")}
            >
              <Check className="h-3.5 w-3.5 mr-1" />Setujui
            </Button>
          )}
          {v.vetStatus !== "rejected" && (
            <Button
              size="sm"
              variant="outline"
              className="w-full h-8 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
              disabled={updateVet.isPending}
              onClick={() => handleStatus(v.id, "rejected")}
            >
              <X className="h-3.5 w-3.5 mr-1" />Tolak
            </Button>
          )}
          {v.vetStatus === "rejected" && (
            <Button
              size="sm"
              variant="outline"
              className="w-full h-8 text-xs"
              disabled={updateVet.isPending}
              onClick={() => handleStatus(v.id, "pending")}
            >
              <Clock className="h-3.5 w-3.5 mr-1" />Kembalikan ke Menunggu
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}

function SpeciesTab() {
  const { data: species = [], isLoading } = useListSpecies();
  const addSpecies = useAdminAddSpecies();
  const deleteSpecies = useAdminDeleteSpecies();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [name, setName] = useState("");

  async function handleAdd() {
    if (!name.trim()) return;
    await addSpecies.mutateAsync({ data: { name: name.trim() } });
    await qc.invalidateQueries();
    setName("");
    toast({ title: "Jenis hewan ditambahkan" });
  }

  async function handleDelete(id: number, speciesName: string) {
    await deleteSpecies.mutateAsync({ speciesId: id });
    await qc.invalidateQueries();
    toast({ title: `${speciesName} dihapus` });
  }

  if (isLoading) return <div className="py-8 text-center text-muted-foreground text-sm">Memuat...</div>;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Nama jenis hewan"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleAdd()}
          className="flex-1"
        />
        <Button size="icon" onClick={handleAdd} disabled={addSpecies.isPending || !name.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-2">
        {species.map(s => (
          <div key={s.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
            <span className="text-sm font-medium">{s.name}</span>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => handleDelete(s.id, s.name)}
              disabled={deleteSpecies.isPending}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {!species.length && <p className="text-center text-muted-foreground text-sm py-4">Belum ada jenis hewan.</p>}
      </div>
    </div>
  );
}

function AdminsTab() {
  const { data: admins = [], isLoading } = useListAdmins();
  const addAdmin = useAddAdmin();
  const deleteAdmin = useDeleteAdmin();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const me = useGetMe();

  async function handleAdd() {
    if (!email.trim()) return;
    await addAdmin.mutateAsync({ data: { email: email.trim() } });
    await qc.invalidateQueries();
    setEmail("");
    toast({ title: "Admin ditambahkan" });
  }

  async function handleDelete(id: number, adminEmail: string) {
    if (adminEmail === me.data?.email) {
      toast({ title: "Tidak dapat menghapus diri sendiri", variant: "destructive" });
      return;
    }
    await deleteAdmin.mutateAsync({ adminId: id });
    await qc.invalidateQueries();
    toast({ title: `${adminEmail} dihapus dari admin` });
  }

  if (isLoading) return <div className="py-8 text-center text-muted-foreground text-sm">Memuat...</div>;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Email admin baru"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleAdd()}
          className="flex-1"
        />
        <Button size="icon" onClick={handleAdd} disabled={addAdmin.isPending || !email.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-2">
        {admins.map(a => (
          <div key={a.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
            <span className="text-sm">{a.email}</span>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => handleDelete(a.id, a.email)}
              disabled={deleteAdmin.isPending || a.email === me.data?.email}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {!admins.length && <p className="text-center text-muted-foreground text-sm py-4">Belum ada admin.</p>}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const me = useGetMe();

  if (me.isLoading) return null;
  if (!me.data?.isAdmin) return <Redirect to="/dashboard" />;

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex items-center gap-2 pt-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Admin</h1>
        </div>

        <Tabs defaultValue="vets">
          <TabsList className="w-full">
            <TabsTrigger value="vets" className="flex-1">Dokter</TabsTrigger>
            <TabsTrigger value="species" className="flex-1">Jenis Hewan</TabsTrigger>
            <TabsTrigger value="admins" className="flex-1">Admin</TabsTrigger>
          </TabsList>
          <TabsContent value="vets" className="mt-4">
            <VetApprovalsTab />
          </TabsContent>
          <TabsContent value="species" className="mt-4">
            <SpeciesTab />
          </TabsContent>
          <TabsContent value="admins" className="mt-4">
            <AdminsTab />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
