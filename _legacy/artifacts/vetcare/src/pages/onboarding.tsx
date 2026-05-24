import { useGetMe, useUpdateMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { normalizePhone } from "@/lib/phone";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Phone } from "lucide-react";
import { useLang } from "@/contexts/LangContext";

const schema = z.object({
  name: z.string().min(1),
  phone: z
    .string()
    .min(9)
    .regex(/^[0-9+\-\s()]+$/),
});

export default function OnboardingPage() {
  const me = useGetMe();
  const updateMe = useUpdateMe();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { t } = useLang();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    values: {
      name: me.data?.name ?? "",
      phone: me.data?.phone ?? "",
    },
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    try {
      await updateMe.mutateAsync({ data: { ...values, phone: normalizePhone(values.phone) } });
      await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      setLocation("/dashboard");
    } catch(e: any) {
      toast({ title: "Something went wrong", variant: "destructive" });
      const msg = e.response?.data?.error || e.message || "Failed to update profile";
      form.setError("root", { message: msg });
    }
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Phone className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t("onboardingTitle")}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t("onboardingSubtitle")}
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("yourName")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      autoComplete="name"
                      data-testid="input-onboarding-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("yourPhone")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="tel"
                      placeholder="+62 812 3456 7890"
                      autoComplete="tel"
                      data-testid="input-onboarding-phone"
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">
                    Include country code, e.g. +62 for Indonesia.
                  </p>
                </FormItem>
              )}
            />
            {form.formState.errors.root && (
              <p className="text-sm font-medium text-destructive">
                {form.formState.errors.root.message}
              </p>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={updateMe.isPending}
              data-testid="btn-onboarding-submit"
            >
              {updateMe.isPending ? t("gettingStarted") : t("getStarted")}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
