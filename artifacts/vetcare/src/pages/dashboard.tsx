import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useGetMe, useListMyPets, useListActiveVisits, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { PawPrint, Plus, Stethoscope, Search } from "lucide-react";
import { useRegisterAsPetOwner } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useRole } from "@/contexts/RoleContext";

function RoleSelector() {
  const registerAsPetOwner = useRegisterAsPetOwner();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  async function becomePetOwner() {
    await registerAsPetOwner.mutateAsync(undefined);
    queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
    toast({ title: "Welcome! You can now add your pets." });
  }

  return (
    <div className="space-y-4 pt-6">
      <p className="text-muted-foreground text-sm text-center">Choose how you want to use VetCare Pro:</p>
      <Card className="cursor-pointer hover:border-primary transition-colors" onClick={becomePetOwner} data-testid="card-pet-owner">
        <CardContent className="pt-5 pb-5 flex gap-4 items-center">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <PawPrint className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Pet owner</p>
            <p className="text-xs text-muted-foreground">Track your pets' health, weight, and visit history</p>
          </div>
        </CardContent>
      </Card>
      <Link href="/settings">
        <Card className="cursor-pointer hover:border-primary transition-colors" data-testid="card-vet">
          <CardContent className="pt-5 pb-5 flex gap-4 items-center">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <Stethoscope className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Veterinary clinic</p>
              <p className="text-xs text-muted-foreground">Register your clinic to manage visits and staff</p>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}

function PetOwnerDashboard() {
  const pets = useListMyPets();
  const petList = pets.data ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-foreground">My pets</h2>
        <Button asChild size="sm" variant="outline" data-testid="btn-add-pet">
          <Link href="/pets/new"><Plus className="h-4 w-4 mr-1" />Add pet</Link>
        </Button>
      </div>
      {pets.isLoading && (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      )}
      {!pets.isLoading && petList.length === 0 && (
        <Card>
          <CardContent className="py-10 flex flex-col items-center gap-3">
            <PawPrint className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm text-center">No pets yet. Add your first pet!</p>
            <Button asChild size="sm" data-testid="btn-add-first-pet">
              <Link href="/pets/new">Add pet</Link>
            </Button>
          </CardContent>
        </Card>
      )}
      {petList.map(pet => (
        <Link key={pet.id} href={`/pets/${pet.id}`}>
          <Card className="hover:border-primary/50 transition-colors cursor-pointer" data-testid={`card-pet-${pet.id}`}>
            <CardContent className="py-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center shrink-0 overflow-hidden">
                {pet.photoUrl ? (
                  <img src={pet.photoUrl} alt={pet.name} className="h-full w-full object-cover" />
                ) : (
                  <PawPrint className="h-6 w-6 text-primary/60" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground" data-testid={`text-pet-name-${pet.id}`}>{pet.name}</p>
                <p className="text-xs text-muted-foreground">{pet.speciesName}</p>
              </div>
              <StatusBadge status={pet.status ?? "healthy"} />
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

function ActiveVisitsList({ clinicId }: { clinicId: number }) {
  const visits = useListActiveVisits(clinicId, { query: { queryKey: ["active-visits", clinicId] } });
  const activeList = visits.data ?? [];

  if (visits.isLoading) return (
    <div className="space-y-3">
      {[1, 2].map(i => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}
    </div>
  );

  if (activeList.length === 0) return (
    <Card>
      <CardContent className="py-10 flex flex-col items-center gap-3">
        <Stethoscope className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-muted-foreground text-sm text-center">No active patients right now.</p>
        <Button asChild size="sm" data-testid="btn-search-first-patient">
          <Link href="/vet/search">Find a patient</Link>
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-3">
      {activeList.map((v: any) => (
        <Link key={v.id} href={`/vet/visits/${v.id}`}>
          <Card className="hover:border-primary/50 transition-colors cursor-pointer" data-testid={`card-visit-${v.id}`}>
            <CardContent className="py-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center shrink-0">
                <PawPrint className="h-6 w-6 text-primary/60" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">{v.petName}</p>
                <p className="text-xs text-muted-foreground">{v.ownerName} &middot; {v.type}</p>
              </div>
              <StatusBadge status={v.status} />
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

function VetDashboard({ clinicId }: { clinicId: number }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-foreground">Active patients</h2>
        <Button asChild size="sm" variant="outline" data-testid="btn-search-patient">
          <Link href="/vet/search"><Search className="h-4 w-4 mr-1" />Search</Link>
        </Button>
      </div>
      <ActiveVisitsList clinicId={clinicId} />
    </div>
  );
}

export default function DashboardPage() {
  const me = useGetMe();
  const { activeRole } = useRole();
  const user = me.data;
  const isNew = !user?.isPetOwner && !user?.isVet && !user?.isVetOwner;
  const isVet = !!(user?.isVet || user?.isVetOwner);

  return (
    <AppShell>
      <PageHeader
        title={user?.name ? `Hello, ${user.name.split(" ")[0]}` : "Welcome"}
        subtitle="VetCare Pro"
      />
      {isNew && !me.isLoading && <RoleSelector />}
      {!isNew && activeRole === "vet" && isVet && user?.clinicId && <VetDashboard clinicId={user.clinicId} />}
      {!isNew && activeRole === "vet" && isVet && !user?.clinicId && (
        <div className="pt-8 flex flex-col items-center gap-3">
          <Stethoscope className="h-12 w-12 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground text-center">You are registered as a vet staff member.<br />Contact your clinic owner to manage patients.</p>
          <Button asChild size="sm" variant="outline"><Link href="/vet">Go to clinic</Link></Button>
        </div>
      )}
      {!isNew && (activeRole === "pet-owner" || !isVet) && user?.isPetOwner && <PetOwnerDashboard />}
    </AppShell>
  );
}
