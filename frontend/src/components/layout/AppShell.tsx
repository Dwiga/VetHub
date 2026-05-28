import {
  useRouterState,
  Link,
  useNavigate,
} from "@tanstack/react-router";
import {
  Home,
  PawPrint,
  Stethoscope,
  Building2,
  Settings,
  Hotel,
  Users,
  Clock,
  User,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRole } from "@/contexts/RoleContext";
import { useLang } from "@/contexts/LangContext";
import { useGetMe } from "@/lib/api-client";
import { HAS_CLERK } from "@/lib/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const clerkUserButton = HAS_CLERK;

export function AppShell({ children }: { children: React.ReactNode }) {
  const me = useGetMe();
  const {
    activeRole,
    setActiveRole,
    hasBothRoles,
    canSwitchToVet,
    canSwitchToPetOwner,
    canSwitchToHotel,
  } = useRole();
  const navigate = useNavigate();
  const location = useRouterState({ select: (s) => s.location.pathname });
  const { t } = useLang();

  const user = me.data;
  const isVetOwner = !!user?.isVetOwner;
  const isHotelOwner = !!user?.isHotelOwner;

  const petOwnerNav = [
    { href: "/dashboard", icon: Home, label: t("nav_home") },
    { href: "/pets", icon: PawPrint, label: t("nav_pets") },
  ];

  const vetNav = [
    { href: "/vet", icon: Stethoscope, label: t("nav_clinic") },
  ];

  const vetOwnerNav = [
    { href: "/vet", icon: Stethoscope, label: t("nav_clinic") },
    { href: "/clinic", icon: Building2, label: t("nav_manage") },
  ];

  const hotelOwnerNav = [
    { href: "/hotel", icon: Hotel, label: t("nav_hotel") },
    { href: "/hotel/guests", icon: Users, label: t("nav_guests") },
    { href: "/hotel/history", icon: Clock, label: t("nav_history") },
  ];

  const PET_PATHS = ["/dashboard", "/pets"];
  const VET_PATHS = ["/vet", "/clinic"];
  const HOTEL_PATHS = ["/hotel", "/hotel/guests", "/hotel/history"];

  let navItems = petOwnerNav;
  if (activeRole === "hotel") {
    navItems = hotelOwnerNav;
  } else if (activeRole === "vet") {
    navItems = isVetOwner ? vetOwnerNav : vetNav;
  } else {
    navItems = petOwnerNav;
  }

  if (!hasBothRoles && !isHotelOwner) {
    if (canSwitchToVet && !canSwitchToPetOwner) {
      navItems = isVetOwner ? vetOwnerNav : vetNav;
    } else if (canSwitchToPetOwner && !canSwitchToVet) {
      navItems = petOwnerNav;
    }
  }

  function switchRole(role: "pet-owner" | "vet" | "hotel") {
    setActiveRole(role);
    if (role === "hotel") {
      const onOtherPage = [...PET_PATHS, ...VET_PATHS].some(
        (p) => location === p || location.startsWith(p + "/"),
      );
      if (onOtherPage) navigate({ to: "/hotel" as never });
    } else if (role === "vet") {
      const onOtherPage = [...PET_PATHS, ...HOTEL_PATHS].some(
        (p) => location === p || location.startsWith(p + "/"),
      );
      if (onOtherPage) navigate({ to: "/vet" as never });
    } else {
      const onOtherPage = [...VET_PATHS, ...HOTEL_PATHS].some(
        (p) => location === p || location.startsWith(p + "/"),
      );
      if (onOtherPage) navigate({ to: "/dashboard" as never });
    }
  }

  const showHotelRole =
    isHotelOwner &&
    (hasBothRoles || canSwitchToPetOwner || canSwitchToVet);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      {/* Top bar with role switcher and account menu */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-lg mx-auto px-4 flex items-center justify-between h-12">
          {/* Role switcher */}
          <div className="flex items-center flex-1 gap-1">
            {(hasBothRoles || showHotelRole) && (
              <div
                className="flex items-center gap-1 bg-muted rounded-full p-1"
                data-testid="role-switcher"
              >
                <button
                  onClick={() => switchRole("pet-owner")}
                  data-testid="role-pet-owner"
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                    activeRole === "pet-owner"
                      ? "bg-card text-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <PawPrint className="h-3.5 w-3.5" />
                  {t("role_myPets")}
                </button>
                {canSwitchToVet && (
                  <button
                    onClick={() => switchRole("vet")}
                    data-testid="role-vet"
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                      activeRole === "vet"
                        ? "bg-card text-primary shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Stethoscope className="h-3.5 w-3.5" />
                    {t("role_clinic")}
                  </button>
                )}
                {isHotelOwner && (
                  <button
                    onClick={() => switchRole("hotel")}
                    data-testid="role-hotel"
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                      activeRole === "hotel"
                        ? "bg-card text-primary shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Hotel className="h-3.5 w-3.5" />
                    {t("nav_hotel")}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Account dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full shrink-0"
                data-testid="btn-account-menu"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>
                {user?.name ?? t("profile")}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate({ to: "/settings" as never })}>
                <Settings className="h-4 w-4 mr-2" />
                {t("nav_settings")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => {
                  try {
                    const { useAuth } = await import("@/lib/auth");
                    const { signOut } = useAuth();
                    // Clerk signOut handled by UserButton; this is fallback
                  } catch {}
                  navigate({ to: "/" as never });
                }}
                className="text-destructive"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {t("signOut")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <main
        className={cn(
          "flex-1 pb-20 max-w-lg mx-auto w-full px-4 pt-4",
          hasBothRoles && "pt-3",
        )}
      >
        {children}
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50"
        data-testid="bottom-nav"
      >
        <div className="max-w-lg mx-auto flex items-center justify-around">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active =
              location === href || location.startsWith(href + "/");
            return (
              <Link
                key={href}
                to={href as never}
                data-testid={`nav-${href
                  .replace("/", "")
                  .replace("/", "-")}`}
                className={cn(
                  "flex flex-col items-center gap-1 px-4 py-3 min-w-0 flex-1 text-xs font-medium transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
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
