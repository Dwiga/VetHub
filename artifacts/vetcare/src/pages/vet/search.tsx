import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useSearchPetOwner, useSearchPet, getSearchPetOwnerQueryKey, getSearchPetQueryKey } from "@workspace/api-client-react";
import { useLocation, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PawPrint, Phone, User, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { useGetMe } from "@workspace/api-client-react";

export default function VetSearchPage() {
  const [searchParams] = typeof window !== "undefined"
    ? [new URLSearchParams(window.location.search)]
    : [new URLSearchParams()];
  const initialQ = searchParams.get("q") ?? "";

  const [phone, setPhone] = useState(initialQ);
  const [petName, setPetName] = useState(initialQ);
  const [tab, setTab] = useState("phone");
  const [, setLocation] = useLocation();
  const me = useGetMe();

  const [submittedPhone, setSubmittedPhone] = useState(initialQ);
  const [submittedPetName, setSubmittedPetName] = useState("");

  const ownerResult = useSearchPetOwner(
    { phone: submittedPhone },
    { query: { enabled: !!submittedPhone, queryKey: getSearchPetOwnerQueryKey({ phone: submittedPhone }) } }
  );

  const petResults = useSearchPet(
    { name: submittedPetName },
    { query: { enabled: !!submittedPetName, queryKey: getSearchPetQueryKey({ name: submittedPetName }) } }
  );

  function handlePhoneSearch(e: React.FormEvent) {
    e.preventDefault();
    setSubmittedPhone(phone.trim());
  }

  function handlePetSearch(e: React.FormEvent) {
    e.preventDefault();
    setSubmittedPetName(petName.trim());
  }

  const owner = ownerResult.data?.owner;
  const ownerPets = ownerResult.data?.pets ?? [];

  return (
    <AppShell>
      <PageHeader title="Search" back backHref="/vet" />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full mb-5">
          <TabsTrigger value="phone" className="flex-1" data-testid="tab-phone">By phone</TabsTrigger>
          <TabsTrigger value="pet" className="flex-1" data-testid="tab-pet">By pet name</TabsTrigger>
        </TabsList>

        <TabsContent value="phone" className="space-y-4">
          <form onSubmit={handlePhoneSearch} className="flex gap-2">
            <Input
              placeholder="Owner phone number..."
              value={phone}
              onChange={e => setPhone(e.target.value)}
              data-testid="input-phone"
            />
            <Button type="submit" size="sm" disabled={!phone.trim()} data-testid="btn-search-phone">Search</Button>
          </form>

          {ownerResult.isLoading && <div className="h-24 bg-muted animate-pulse rounded-xl" />}

          {ownerResult.isError && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">No owner found with that phone number.</p>
              <Button asChild variant="outline" size="sm" className="w-full" data-testid="btn-add-pet-for-owner">
                <Link href="/vet/add-pet">Add pet for this number</Link>
              </Button>
            </div>
          )}

          {owner && (
            <div className="space-y-4">
              <Card>
                <CardContent className="py-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                    <User className="h-5 w-5 text-primary/60" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm" data-testid="text-owner-name">{owner.name ?? "Unnamed"}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" />{owner.phone}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Pets ({ownerPets.length})</h3>
                <Button asChild size="sm" variant="outline" data-testid="btn-add-pet">
                  <Link href="/vet/add-pet"><Plus className="h-4 w-4 mr-1" />Add pet</Link>
                </Button>
              </div>

              {ownerPets.map((pet: any) => (
                <Link key={pet.id} href={`/pets/${pet.id}`}>
                  <Card className="hover:border-primary/50 transition-colors cursor-pointer" data-testid={`card-pet-${pet.id}`}>
                    <CardContent className="py-3 flex items-center gap-3">
                      <PawPrint className="h-4 w-4 text-primary/60 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{pet.name}</p>
                        <p className="text-xs text-muted-foreground">{pet.speciesName}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={pet.status ?? "healthy"} />
                        {me.data?.clinicId && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={e => { e.preventDefault(); setLocation(`/vet/visits/new/${pet.id}`); }}
                            data-testid={`btn-new-visit-${pet.id}`}
                          >
                            Visit
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pet" className="space-y-4">
          <form onSubmit={handlePetSearch} className="flex gap-2">
            <Input
              placeholder="Pet name..."
              value={petName}
              onChange={e => setPetName(e.target.value)}
              data-testid="input-pet-name"
            />
            <Button type="submit" size="sm" disabled={!petName.trim()} data-testid="btn-search-pet">Search</Button>
          </form>

          {petResults.isLoading && <div className="h-24 bg-muted animate-pulse rounded-xl" />}

          {petResults.data && petResults.data.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No pets found.</p>
          )}

          {(petResults.data ?? []).map((pet: any) => (
            <Link key={pet.id} href={`/pets/${pet.id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer" data-testid={`card-pet-${pet.id}`}>
                <CardContent className="py-3 flex items-center gap-3">
                  <PawPrint className="h-4 w-4 text-primary/60 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{pet.name}</p>
                    <p className="text-xs text-muted-foreground">{pet.speciesName} · {pet.ownerName} · {pet.ownerPhone}</p>
                  </div>
                  <StatusBadge status={pet.status ?? "healthy"} />
                </CardContent>
              </Card>
            </Link>
          ))}
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
