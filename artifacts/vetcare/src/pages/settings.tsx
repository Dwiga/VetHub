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
import { useClerk } from "@clerk/react";
import { Separator } from "@/components/ui/separator";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
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
  const { signOut } = useClerk();

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    values: { name: me.data?.name ?? "", phone: me.data?.phone ?? "" },
  });

  const vetForm = useForm<z.infer<typeof vetSchema>>({
    resolver: zodResolver(vetSchema),
    defaultValues: { name: "", address: "", phone: "", email: "" },
  });

  async function saveProfile(values: z.infer<typeof profileSchema>) {
    await updateMe.mutateAsync({ data: values });
    queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
    toast({ title: "Profile updated" });
  }

  async function registerPetOwner() {
    await registerAsPetOwner.mutateAsync(undefined);
    queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
    toast({ title: "Registered as pet owner" });
  }

  async function registerVet(values: z.infer<typeof vetSchema>) {
    await registerForVet.mutateAsync({ data: values });
    queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
    toast({ title: "Clinic registered" });
  }

  const user = me.data;

  return (
    <AppShell>
      <PageHeader title="Settings" />

      <div className="space-y-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(saveProfile)} className="space-y-4">
                <FormField control={profileForm.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name</FormLabel>
                    <FormControl><Input {...field} data-testid="input-name" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={profileForm.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone number</FormLabel>
                    <FormControl><Input {...field} placeholder="+62 812..." data-testid="input-phone" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={updateMe.isPending} data-testid="btn-save-profile">
                  {updateMe.isPending ? "Saving..." : "Save changes"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Account roles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!user?.isPetOwner && (
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Pet owner</p>
                  <p className="text-xs text-muted-foreground">Track your own pets</p>
                </div>
                <Button size="sm" variant="outline" onClick={registerPetOwner} disabled={registerAsPetOwner.isPending} data-testid="btn-register-pet-owner">
                  {registerAsPetOwner.isPending ? "..." : "Enable"}
                </Button>
              </div>
            )}
            {user?.isPetOwner && (
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-primary">Pet owner</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
                <span className="text-xs text-primary font-medium">Enabled</span>
              </div>
            )}
            <Separator />
            {!user?.isVetOwner && (
              <div>
                <p className="text-sm font-medium mb-1">Veterinary clinic</p>
                <p className="text-xs text-muted-foreground mb-3">Register your clinic to manage visits and staff</p>
                <Form {...vetForm}>
                  <form onSubmit={vetForm.handleSubmit(registerVet)} className="space-y-3">
                    <FormField control={vetForm.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Clinic name</FormLabel>
                        <FormControl><Input {...field} data-testid="input-clinic-name" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={vetForm.control} name="address" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl><Input {...field} data-testid="input-clinic-address" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Button type="submit" size="sm" className="w-full" disabled={registerForVet.isPending} data-testid="btn-register-vet">
                      {registerForVet.isPending ? "Registering..." : "Register clinic"}
                    </Button>
                  </form>
                </Form>
              </div>
            )}
            {user?.isVetOwner && (
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-primary">Clinic owner</p>
                  <p className="text-xs text-muted-foreground">Managing a clinic</p>
                </div>
                <span className="text-xs text-primary font-medium">Enabled</span>
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
          Sign out
        </Button>
      </div>
    </AppShell>
  );
}
