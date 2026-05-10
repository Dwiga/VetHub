import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { useGetPet, useUpdatePet, useListSpecies, getGetPetQueryKey } from "@workspace/api-client-react";
import { useParams, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  name: z.string().min(1),
  speciesId: z.string().min(1),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["male", "female", "unknown"]),
  sterilized: z.boolean(),
  color: z.string().optional(),
});

export default function EditPetPage() {
  const { petId } = useParams<{ petId: string }>();
  const id = parseInt(petId);
  const pet = useGetPet(id, { query: { queryKey: getGetPetQueryKey(id) } });
  const updatePet = useUpdatePet();
  const species = useListSpecies();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", speciesId: "", gender: "unknown", sterilized: false, color: "", dateOfBirth: "" },
  });

  useEffect(() => {
    if (pet.data) {
      form.reset({
        name: pet.data.name,
        speciesId: String(pet.data.speciesId),
        dateOfBirth: pet.data.dateOfBirth ?? "",
        gender: (pet.data.gender as "male" | "female" | "unknown") ?? "unknown",
        sterilized: pet.data.sterilized ?? false,
        color: pet.data.color ?? "",
      });
    }
  }, [pet.data]);

  async function onSubmit(values: z.infer<typeof schema>) {
    await updatePet.mutateAsync({
      petId: id,
      data: {
        name: values.name,
        speciesId: parseInt(values.speciesId),
        dateOfBirth: values.dateOfBirth || undefined,
        gender: values.gender,
        sterilized: values.sterilized,
        color: values.color || undefined,
      },
    });
    queryClient.invalidateQueries({ queryKey: getGetPetQueryKey(id) });
    toast({ title: "Pet updated" });
    setLocation(`/pets/${id}`);
  }

  return (
    <AppShell>
      <PageHeader title="Edit pet" back backHref={`/pets/${id}`} />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel>Pet name</FormLabel>
              <FormControl><Input {...field} data-testid="input-pet-name" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="speciesId" render={({ field }) => (
            <FormItem>
              <FormLabel>Species</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-species"><SelectValue placeholder="Select species" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(species.data ?? []).map(s => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="dateOfBirth" render={({ field }) => (
            <FormItem>
              <FormLabel>Date of birth</FormLabel>
              <FormControl><Input type="date" {...field} data-testid="input-dob" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="gender" render={({ field }) => (
            <FormItem>
              <FormLabel>Gender</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-gender"><SelectValue /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="color" render={({ field }) => (
            <FormItem>
              <FormLabel>Color / markings</FormLabel>
              <FormControl><Input {...field} data-testid="input-color" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="sterilized" render={({ field }) => (
            <FormItem className="flex items-center justify-between">
              <FormLabel className="mb-0">Sterilized</FormLabel>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-sterilized" />
              </FormControl>
            </FormItem>
          )} />
          <Button type="submit" className="w-full" disabled={updatePet.isPending} data-testid="btn-submit">
            {updatePet.isPending ? "Saving..." : "Save changes"}
          </Button>
        </form>
      </Form>
    </AppShell>
  );
}
