import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { useGetPet, useGetMe, useCreateVisit, getGetPetQueryKey, getListVisitsQueryKey } from "@workspace/api-client-react";
import { useParams, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  type: z.enum(["inpatient", "outpatient"]),
  visitDate: z.string().min(1),
  anamnesis: z.string().optional(),
  therapy: z.string().optional(),
});

export default function NewVisitPage() {
  const { petId } = useParams<{ petId: string }>();
  const id = parseInt(petId);
  const pet = useGetPet(id, { query: { queryKey: getGetPetQueryKey(id) } });
  const me = useGetMe();
  const createVisit = useCreateVisit();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: "outpatient",
      visitDate: new Date().toISOString().split("T")[0],
      anamnesis: "",
      therapy: "",
    },
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    const clinicId = me.data?.clinicId;
    if (!clinicId) {
      toast({ title: "No clinic assigned", variant: "destructive" });
      return;
    }
    const visit = await createVisit.mutateAsync({
      petId: id,
      data: {
        clinicId,
        vetId: me.data?.id ?? undefined,
        type: values.type,
        visitDate: values.visitDate,
        anamnesis: values.anamnesis || undefined,
        therapy: values.therapy || undefined,
      },
    });
    queryClient.invalidateQueries({ queryKey: getListVisitsQueryKey(id) });
    toast({ title: "Visit created" });
    setLocation(`/vet/visits/${visit.id}`);
  }

  const p = pet.data;

  return (
    <AppShell>
      <PageHeader
        title="New visit"
        subtitle={p ? `${p.name} — ${p.speciesName}` : "..."}
        back
      />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField control={form.control} name="type" render={({ field }) => (
            <FormItem>
              <FormLabel>Visit type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-type"><SelectValue /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="outpatient">Outpatient</SelectItem>
                  <SelectItem value="inpatient">Inpatient (hospitalization)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="visitDate" render={({ field }) => (
            <FormItem>
              <FormLabel>Visit date</FormLabel>
              <FormControl><Input type="date" {...field} data-testid="input-date" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="anamnesis" render={({ field }) => (
            <FormItem>
              <FormLabel>Anamnesis</FormLabel>
              <FormControl><Textarea {...field} rows={3} placeholder="Patient history and complaints..." data-testid="input-anamnesis" /></FormControl>
            </FormItem>
          )} />
          <FormField control={form.control} name="therapy" render={({ field }) => (
            <FormItem>
              <FormLabel>Initial therapy</FormLabel>
              <FormControl><Textarea {...field} rows={3} placeholder="Planned treatments..." data-testid="input-therapy" /></FormControl>
            </FormItem>
          )} />
          <Button type="submit" className="w-full" disabled={createVisit.isPending} data-testid="btn-submit">
            {createVisit.isPending ? "Creating..." : "Create visit"}
          </Button>
        </form>
      </Form>
    </AppShell>
  );
}
