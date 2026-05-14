import { useRef, useEffect } from "react";
import { StackProvider, StackTheme, useUser, useStackApp } from "@stackframe/react";
import { stackClientApp } from "@/lib/client";
import {
  Switch,
  Route,
  useLocation,
  Router as WouterRouter,
  Redirect,
} from "wouter";
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useGetMe } from "@workspace/api-client-react";
import { RoleProvider } from "@/contexts/RoleContext";
import { LangProvider } from "@/contexts/LangContext";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing";
import OnboardingPage from "@/pages/onboarding";
import DashboardPage from "@/pages/dashboard";
import PetsPage from "@/pages/pets/index";
import NewPetPage from "@/pages/pets/new";
import PetDetailPage from "@/pages/pets/detail";
import EditPetPage from "@/pages/pets/edit";
import MonitoringNewPage from "@/pages/pets/monitoring-new";
import VetPage from "@/pages/vet/index";
import VetSearchPage from "@/pages/vet/search";
import VisitDetailPage from "@/pages/vet/visit-detail";
import NewVisitPage from "@/pages/vet/new-visit";
import DailyReportPage from "@/pages/vet/daily-report";
import AddPetForOwnerPage from "@/pages/vet/add-pet";
import ClinicPage from "@/pages/clinic/index";
import ClinicReportsPage from "@/pages/clinic/reports";
import SettingsPage from "@/pages/settings";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

/**
 * Clears the React Query cache whenever the signed-in user changes
 * (sign-in or sign-out), so stale data from a previous session is never shown.
 */
function StackQueryClientCacheInvalidator() {
  const user = useUser({ or: "return-null" });
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const userId = user?.id ?? null;
    if (
      prevUserIdRef.current !== undefined &&
      prevUserIdRef.current !== userId
    ) {
      queryClient.clear();
    }
    prevUserIdRef.current = userId;
  }, [user?.id, queryClient]);

  return null;
}

function PhoneGate({ component: Comp }: { component: React.ComponentType }) {
  const me = useGetMe();
  if (me.isLoading) return null;
  if (me.data && !me.data.phone) return <Redirect to="/onboarding" />;
  return <Comp />;
}

function AuthedRoute({ component: Comp }: { component: React.ComponentType }) {
  const user = useUser({ or: "return-null" });
  if (user === null) return <Redirect to="/sign-in" />;
  return <PhoneGate component={Comp} />;
}

function OnboardingRoute() {
  const me = useGetMe();
  if (me.isLoading) return null;
  if (me.data?.phone) return <Redirect to="/dashboard" />;
  return <OnboardingPage />;
}

function SignInPage() {
  const app = useStackApp();
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-8">
      <app.SignIn />
    </div>
  );
}

function SignUpPage() {
  const app = useStackApp();
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-8">
      <app.SignUp />
    </div>
  );
}

function HomeRedirect() {
  const user = useUser({ or: "return-null" });
  if (user) return <Redirect to="/dashboard" />;
  return <LandingPage />;
}

function AppRoutes() {
  return (
    <QueryClientProvider client={queryClient}>
      <StackQueryClientCacheInvalidator />
      <RoleProvider>
        <LangProvider>
          <TooltipProvider>
            <Switch>
              <Route path="/" component={HomeRedirect} />
              <Route path="/sign-in/*?" component={SignInPage} />
              <Route path="/sign-up/*?" component={SignUpPage} />
              <Route
                path="/onboarding"
                component={() => {
                  const user = useUser({ or: "return-null" });
                  if (user === null) return <Redirect to="/sign-in" />;
                  return <OnboardingRoute />;
                }}
              />
              <Route
                path="/dashboard"
                component={() => <AuthedRoute component={DashboardPage} />}
              />
              <Route
                path="/pets"
                component={() => <AuthedRoute component={PetsPage} />}
              />
              <Route
                path="/pets/new"
                component={() => <AuthedRoute component={NewPetPage} />}
              />
              <Route
                path="/pets/:petId/edit"
                component={() => <AuthedRoute component={EditPetPage} />}
              />
              <Route
                path="/pets/:petId/monitoring/new"
                component={() => (
                  <AuthedRoute component={MonitoringNewPage} />
                )}
              />
              <Route
                path="/pets/:petId"
                component={() => <AuthedRoute component={PetDetailPage} />}
              />
              <Route
                path="/vet"
                component={() => <AuthedRoute component={VetPage} />}
              />
              <Route
                path="/vet/search"
                component={() => <AuthedRoute component={VetSearchPage} />}
              />
              <Route
                path="/vet/add-pet"
                component={() => (
                  <AuthedRoute component={AddPetForOwnerPage} />
                )}
              />
              <Route
                path="/vet/visits/new/:petId"
                component={() => <AuthedRoute component={NewVisitPage} />}
              />
              <Route
                path="/vet/visits/:visitId"
                component={() => <AuthedRoute component={VisitDetailPage} />}
              />
              <Route
                path="/vet/daily-reports/:reportId"
                component={() => <AuthedRoute component={DailyReportPage} />}
              />
              <Route
                path="/clinic"
                component={() => <AuthedRoute component={ClinicPage} />}
              />
              <Route
                path="/clinic/reports"
                component={() => (
                  <AuthedRoute component={ClinicReportsPage} />
                )}
              />
              <Route
                path="/settings"
                component={() => <AuthedRoute component={SettingsPage} />}
              />
              <Route component={NotFound} />
            </Switch>
          </TooltipProvider>
        </LangProvider>
      </RoleProvider>
    </QueryClientProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <StackProvider app={stackClientApp}>
        <StackTheme>
          <AppRoutes />
        </StackTheme>
      </StackProvider>
      <Toaster />
    </WouterRouter>
  );
}

export default App;
