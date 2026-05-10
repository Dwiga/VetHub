import { useGetMe } from "@workspace/api-client-react";
import { useLocation, Link } from "wouter";
import { Home, PawPrint, Stethoscope, Building2, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const petOwnerNav = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/pets", icon: PawPrint, label: "Pets" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

const vetNav = [
  { href: "/vet", icon: Stethoscope, label: "Clinic" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

const vetOwnerNav = [
  { href: "/vet", icon: Stethoscope, label: "Clinic" },
  { href: "/clinic", icon: Building2, label: "Manage" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

const bothNav = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/pets", icon: PawPrint, label: "Pets" },
  { href: "/vet", icon: Stethoscope, label: "Clinic" },
  { href: "/clinic", icon: Building2, label: "Manage" },
  { href: "/settings", icon: Settings, label: "Account" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const me = useGetMe();
  const [location] = useLocation();

  const user = me.data;
  let navItems = petOwnerNav;
  if (user?.isPetOwner && user?.isVetOwner) navItems = bothNav;
  else if (user?.isVetOwner) navItems = vetOwnerNav;
  else if (user?.isVet) navItems = vetNav;
  else if (user?.isPetOwner) navItems = petOwnerNav;

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      <main className="flex-1 pb-20 max-w-lg mx-auto w-full px-4 pt-4">
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
                data-testid={`nav-${label.toLowerCase()}`}
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
