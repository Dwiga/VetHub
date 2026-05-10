import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing";
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

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env file");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(175, 70%, 25%)",
    colorForeground: "hsl(180, 50%, 10%)",
    colorMutedForeground: "hsl(180, 15%, 40%)",
    colorDanger: "hsl(0, 70%, 50%)",
    colorBackground: "hsl(0, 0%, 100%)",
    colorInput: "hsl(0, 0%, 100%)",
    colorInputForeground: "hsl(180, 50%, 10%)",
    colorNeutral: "hsl(180, 20%, 90%)",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl border border-border",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-2xl font-bold text-foreground",
    headerSubtitle: "text-muted-foreground",
    socialButtonsBlockButtonText: "font-semibold",
    formFieldLabel: "text-foreground font-medium",
    footerActionLink: "text-primary font-semibold hover:text-primary/80",
    footerActionText: "text-muted-foreground",
    dividerText: "text-muted-foreground",
    identityPreviewEditButton: "text-primary",
    formFieldSuccessText: "text-primary",
    alertText: "text-destructive",
    logoBox: "h-12 w-12 mx-auto text-primary",
    logoImage: "w-full h-full object-contain",
    socialButtonsBlockButton: "border-border hover:bg-secondary",
    formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm",
    formFieldInput: "border-border focus:ring-2 focus:ring-ring bg-white",
    footerAction: "bg-muted/50 py-4 px-6 border-t border-border",
    dividerLine: "bg-border",
    alert: "bg-destructive/10 border-destructive/20 text-destructive",
    otpCodeFieldInput: "border-border focus:ring-ring",
    formFieldRow: "space-y-4",
    main: "px-8 py-8",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-8">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-8">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function AuthedRoute({ component: Comp }: { component: React.ComponentType }) {
  return (
    <>
      <Show when="signed-in"><Comp /></Show>
      <Show when="signed-out"><Redirect to="/sign-in" /></Show>
    </>
  );
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in"><Redirect to="/dashboard" /></Show>
      <Show when="signed-out"><LandingPage /></Show>
    </>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: { start: { title: "Welcome back", subtitle: "Sign in to your VetCare Pro account" } },
        signUp: { start: { title: "Create an account", subtitle: "Get started with VetCare Pro" } },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Switch>
            <Route path="/" component={HomeRedirect} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            <Route path="/dashboard" component={() => <AuthedRoute component={DashboardPage} />} />
            <Route path="/pets" component={() => <AuthedRoute component={PetsPage} />} />
            <Route path="/pets/new" component={() => <AuthedRoute component={NewPetPage} />} />
            <Route path="/pets/:petId/edit" component={() => <AuthedRoute component={EditPetPage} />} />
            <Route path="/pets/:petId/monitoring/new" component={() => <AuthedRoute component={MonitoringNewPage} />} />
            <Route path="/pets/:petId" component={() => <AuthedRoute component={PetDetailPage} />} />
            <Route path="/vet" component={() => <AuthedRoute component={VetPage} />} />
            <Route path="/vet/search" component={() => <AuthedRoute component={VetSearchPage} />} />
            <Route path="/vet/add-pet" component={() => <AuthedRoute component={AddPetForOwnerPage} />} />
            <Route path="/vet/visits/new/:petId" component={() => <AuthedRoute component={NewVisitPage} />} />
            <Route path="/vet/visits/:visitId" component={() => <AuthedRoute component={VisitDetailPage} />} />
            <Route path="/vet/daily-reports/:reportId" component={() => <AuthedRoute component={DailyReportPage} />} />
            <Route path="/clinic" component={() => <AuthedRoute component={ClinicPage} />} />
            <Route path="/clinic/reports" component={() => <AuthedRoute component={ClinicReportsPage} />} />
            <Route path="/settings" component={() => <AuthedRoute component={SettingsPage} />} />
            <Route component={NotFound} />
          </Switch>
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
      <Toaster />
    </WouterRouter>
  );
}

export default App;
