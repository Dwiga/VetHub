import { useGetMe } from "@workspace/api-client-react";
import { useLocation, Link } from "wouter";
import { Home, PawPrint, Stethoscope, Building2, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRole } from "@/contexts/RoleContext";
import { useLang } from "@/contexts/LangContext";

export function AppShell({ children }: { children: React.ReactNode }) {
  const me = useGetMe();
  const { activeRole, setActiveRole, hasBothRoles, canSwitchToVet, canSwitchToPetOwner } = useRole();
  const [location, navigate] = useLocation();
  const { t } = useLang();

  const user = me.data;
  const isVetOwner = !!user?.isVetOwner;

  const petOwnerNav = [
    { href: "/dashboard", icon: Home, label: t("nav_home") },
    { href: "/pets", icon: PawPrint, label: t("nav_pets") },
    { href: "/settings", icon: Settings, label: t("nav_settings") },
  ];

  const vetNav = [
    { href: "/vet", icon: Stethoscope, label: t("nav_clinic") },
    { href: "/settings", icon: Settings, label: t("nav_settings") },
  ];

  const vetOwnerNav = [
    { href: "/vet", icon: Stethoscope, label: t("nav_clinic") },
    { href: "/clinic", icon: Building2, label: t("nav_manage") },
    { href: "/settings", icon: Settings, label: t("nav_settings") },
  ];

  const PET_PATHS = ["/dashboard", "/pets"];
  const VET_PATHS = ["/vet", "/clinic"];

  let navItems = petOwnerNav;
  if (activeRole === "vet") {
    navItems = isVetOwner ? vetOwnerNav : vetNav;
  } else {
    navItems = petOwnerNav;
  }

  if (!hasBothRoles) {
    if (canSwitchToVet && !canSwitchToPetOwner) {
      navItems = isVetOwner ? vetOwnerNav : vetNav;
    } else if (canSwitchToPetOwner && !canSwitchToVet) {
      navItems = petOwnerNav;
    }
  }

  function switchRole(role: "pet-owner" | "vet") {
    setActiveRole(role);
    if (role === "vet") {
      const onPetPage = PET_PATHS.some(p => location === p || location.startsWith(p + "/"));
      if (onPetPage) navigate("/vet");
    } else {
      const onVetPage = VET_PATHS.some(p => location === p || location.startsWith(p + "/"));
      if (onVetPage) navigate("/dashboard");
    }
  }

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      {hasBothRoles && (
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
          <div className="max-w-lg mx-auto px-4 py-2 flex items-center justify-center">
            <div className="flex items-center gap-1 bg-muted rounded-full p-1" data-testid="role-switcher">
              <button
                onClick={() => switchRole("pet-owner")}
                data-testid="role-pet-owner"
                className={cn(
                  "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                  activeRole === "pet-owner"
                    ? "bg-card text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <PawPrint className="h-3.5 w-3.5" />
                {t("role_myPets")}
              </button>
              <button
                onClick={() => switchRole("vet")}
                data-testid="role-vet"
                className={cn(
                  "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                  activeRole === "vet"
                    ? "bg-card text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Stethoscope className="h-3.5 w-3.5" />
                {t("role_clinic")}
              </button>
            </div>
          </div>
        </div>
      )}
      <main className={cn(
        "flex-1 pb-20 max-w-lg mx-auto w-full px-4 pt-4",
        hasBothRoles && "pt-3"
      )}>
        {children}
      </main>
      <nav
        className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50"
        data-testid="bottom-nav"
      >
        <div className="max-w-lg mx-auto flex items-center justify-around">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = location === href || location.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                data-testid={`nav-${href.replace("/", "").replace("/", "-")}`}
                className={cn(
                  "flex flex-col items-center gap-1 px-4 py-3 min-w-0 flex-1 text-xs font-medium transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon
                  className={cn("h-5 w-5", active && "text-primary")}
                  strokeWidth={active ? 2.5 : 1.75}
                />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
