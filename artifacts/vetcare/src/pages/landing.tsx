import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { PawPrint, Stethoscope, BarChart3, Shield } from "lucide-react";

const features = [
  {
    icon: PawPrint,
    title: "Pet health tracking",
    description: "Monitor your pet's weight, temperature, and health history with easy-to-read charts.",
  },
  {
    icon: Stethoscope,
    title: "Clinic management",
    description: "Manage inpatient and outpatient visits, anamnesis, therapy, and billing in one place.",
  },
  {
    icon: BarChart3,
    title: "Revenue analytics",
    description: "Track visit counts and revenue with daily, monthly, and yearly breakdowns.",
  },
  {
    icon: Shield,
    title: "Secure and trusted",
    description: "Your clinic data and pet records are protected and accessible only to your team.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      <header className="px-6 pt-8 pb-4">
        <div className="flex items-center gap-2 mb-10">
          <img src="/logo.svg" alt="VetCare Pro" className="h-8 w-8" />
          <span className="text-lg font-bold text-foreground">VetCare Pro</span>
        </div>
        <h1 className="text-3xl font-extrabold text-foreground leading-tight mb-3">
          Pet care,<br />done right.
        </h1>
        <p className="text-muted-foreground text-base mb-8">
          The all-in-one platform for veterinary clinics and pet owners. Manage visits, monitor health, and run your practice with confidence.
        </p>
        <div className="flex flex-col gap-3">
          <Button asChild size="lg" className="w-full font-semibold" data-testid="btn-get-started">
            <Link href="/sign-up">Get started</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full font-semibold" data-testid="btn-sign-in">
            <Link href="/sign-in">Sign in</Link>
          </Button>
        </div>
      </header>
      <main className="flex-1 px-6 py-8">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-5">
          Everything you need
        </h2>
        <div className="space-y-5">
          {features.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex gap-4 items-start">
              <div className="shrink-0 h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">{title}</h3>
                <p className="text-muted-foreground text-sm mt-0.5">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
      <footer className="px-6 py-6 text-center text-xs text-muted-foreground border-t border-border">
        VetCare Pro — Built for clinics that care
      </footer>
    </div>
  );
}
