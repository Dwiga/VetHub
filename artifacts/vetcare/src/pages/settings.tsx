import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { useGetMe, useUpdateMe, useRegisterAsPetOwner, useRegisterForVet, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@stackframe/react";
import { Separator } from "@/components/ui/separator";
import { normalizePhone } from "@/lib/phone";
import { useLang, type Lang } from "@/contexts/LangContext";
import { cn } from "@/lib/utils";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(9, "Phone number is required").regex(/^[0-9+\-\s()]+$/, "Enter a valid phone number"),
});

const vetSchema = z.object({
  name: z.string().min(1, "Clinic name is required"),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
});

export default function SettingsPage() {
  const me = useGetMe();
  const updateMe = useUpdateMe();
  const registerAsPetOwner = useRegisterAsPetOwner();
  const registerForVet = useRegisterForVet();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const user = useUser({ or: "redirect" });
  const signOut = () => user.signOut();
  const { t, lang, setLang } = useLang();

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    values: { name: me.data?.name ?? "", phone: me.data?.phone ?? "" },
  });

  const vetForm = useForm<z.infer<typeof vetSchema>>({
    resolver: zodResolver(vetSchema),
    defaultValues: { name: "", address: "", phone: "", email: "" },
  });

  async function saveProfile(values: z.infer<typeof profileSchema>) {
    await updateMe.mutateAsync({ data: { ...values, phone: normalizePhone(values.phone) } });
    queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
    toast({ title: t("profileUpdated") });
  }

  async function registerPetOwner() {
    await registerAsPetOwner.mutateAsync(undefined);
    queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
    toast({ title: t("registeredPetOwner") });
  }

  async function registerVet(values: z.infer<typeof vetSchema>) {
    await registerForVet.mutateAsync({ data: values });
    queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
    toast({ title: t("clinicRegistered") });
  }

  const user = me.data;

  const langs: { value: Lang; label: string }[] = [
    { value: "en", label: t("langEn") },
    { value: "id", label: t("langId") },
  ];

  return (
    <AppShell>
      <PageHeader title={t("settingsTitle")} />

      <div className="space-y-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("profile")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(saveProfile)} className="space-y-4">
                <FormField control={profileForm.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("fullName")}</FormLabel>
                    <FormControl><Input {...field} data-testid="input-name" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={profileForm.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("phoneNumber")}</FormLabel>
                    <FormControl><Input {...field} placeholder={t("phonePlaceholderSettings")} data-testid="input-phone" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={updateMe.isPending} data-testid="btn-save-profile">
                  {updateMe.isPending ? t("saving") : t("save")}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("language")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">{t("languageDesc")}</p>
            <div className="flex gap-2">
              {langs.map(l => (
                <button
                  key={l.value}
                  onClick={() => setLang(l.value)}
                  data-testid={`btn-lang-${l.value}`}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all",
                    lang === l.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  )}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("accountRoles")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!user?.isPetOwner && (
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{t("petOwnerRole")}</p>
                  <p className="text-xs text-muted-foreground">{t("petOwnerRoleDesc")}</p>
                </div>
                <Button size="sm" variant="outline" onClick={registerPetOwner} disabled={registerAsPetOwner.isPending} data-testid="btn-register-pet-owner">
                  {registerAsPetOwner.isPending ? "..." : t("enable")}
                </Button>
              </div>
            )}
            {user?.isPetOwner && (
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-primary">{t("petOwnerRole")}</p>
                  <p className="text-xs text-muted-foreground">{t("activeLabel")}</p>
                </div>
                <span className="text-xs text-primary font-medium">{t("enabled")}</span>
              </div>
            )}
            <Separator />
            {!user?.isVetOwner && (
              <div>
                <p className="text-sm font-medium mb-1">{t("vetClinic")}</p>
                <p className="text-xs text-muted-foreground mb-3">{t("vetClinicDesc")}</p>
                <Form {...vetForm}>
                  <form onSubmit={vetForm.handleSubmit(registerVet)} className="space-y-3">
                    <FormField control={vetForm.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("clinicNameLabel")}</FormLabel>
                        <FormControl><Input {...field} data-testid="input-clinic-name" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={vetForm.control} name="address" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("addressLabel")}</FormLabel>
                        <FormControl><Input {...field} data-testid="input-clinic-address" /></FormControl>
                      </FormItem>
                    )} />
                    <Button type="submit" size="sm" className="w-full" disabled={registerForVet.isPending} data-testid="btn-register-vet">
                      {registerForVet.isPending ? t("registeringClinic") : t("registerClinicBtn")}
                    </Button>
                  </form>
                </Form>
              </div>
            )}
            {user?.isVetOwner && (
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-primary">{t("clinicOwner")}</p>
                  <p className="text-xs text-muted-foreground">{t("managingClinic")}</p>
                </div>
                <span className="text-xs text-primary font-medium">{t("enabled")}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Button
          variant="outline"
          className="w-full text-destructive border-destructive/30 hover:bg-destructive/5"
          onClick={() => signOut()}
          data-testid="btn-sign-out"
        >
          {t("signOut")}
        </Button>
      </div>
    </AppShell>
  );
}
