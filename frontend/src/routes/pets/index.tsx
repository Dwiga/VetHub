import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PawPrint, Plus, ChevronRight } from "lucide-react";
import { useLang } from "@/contexts/LangContext";
import { useListMyPets } from "@/lib/api-client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/pets/")({
  component: PetsPage,
});

function PetsPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const pets = useListMyPets();
  const petList = pets.data ?? [];
  const { t } = useLang();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate({ to: "/sign-in/$", params: { _splat: "" } });
    }
  }, [isLoaded, isSignedIn, navigate]);

  return (
    <AppShell>
      <PageHeader
        title={t("petsTitle")}
        action={
          <Button asChild size="sm" data-testid="btn-add-pet">
            <Link to="/pets/new">
              <Plus className="h-4 w-4 mr-1" />
              {t("add")}
            </Link>
          </Button>
        }
      />
      {pets.isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      )}
      {!pets.isLoading && petList.length === 0 && (
        <Card>
          <CardContent className="py-12 flex flex-col items-center gap-3">
            <PawPrint className="h-12 w-12 text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm text-center">
              {t("noPetsYet")}
            </p>
            <Button asChild size="sm" data-testid="btn-add-first-pet">
              <Link to="/pets/new">{t("addPet")}</Link>
            </Button>
          </CardContent>
        </Card>
      )}
      <div className="space-y-3">
        {petList.map((pet) => (
          <Link
            key={pet.id}
            to="/pets/$petId"
            params={{ petId: String(pet.id) }}
          >
            <Card
              className="hover:border-primary/50 transition-colors cursor-pointer"
              data-testid={`card-pet-${pet.id}`}
            >
              <CardContent className="py-4 flex items-center gap-4">
                <div className="h-13 w-13 rounded-2xl bg-secondary flex items-center justify-center shrink-0 overflow-hidden">
                  {pet.photoUrl ? (
                    <img
                      src={pet.photoUrl}
                      alt={pet.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <PawPrint className="h-6 w-6 text-primary/60" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="font-semibold text-foreground"
                    data-testid={`text-pet-name-${pet.id}`}
                  >
                    {pet.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {[pet.species?.name, pet.gender, pet.color]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={pet.status ?? "healthy"} />
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
