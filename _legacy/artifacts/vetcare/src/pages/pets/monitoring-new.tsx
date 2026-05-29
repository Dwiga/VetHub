import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { useAddMonitoring, getListMonitoringQueryKey } from "@workspace/api-client-react";
import { useParams, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  weight: z.string().optional(),
  height: z.string().optional(),
  temperature: z.string().optional(),
  notes: z.string().optional(),
});

export default function MonitoringNewPage() {
  const { petId } = useParams<{ petId: string }>();
  const id = parseInt(petId);
  const addMonitoring = useAddMonitoring();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { weight: "", height: "", temperature: "", notes: "" },
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    await addMonitoring.mutateAsync({
      petId: id,
      data: {
        weight: values.weight ? parseFloat(values.weight) : undefined,
        height: values.height ? parseFloat(values.height) : undefined,
        temperature: values.temperature ? parseFloat(values.temperature) : undefined,
        notes: values.notes || undefined,
      },
    });
    queryClient.invalidateQueries({ queryKey: getListMonitoringQueryKey(id) });
    toast({ title: "Monitoring record added" });
    setLocation(`/pets/${id}`);
  }

  return (
    <AppShell>
      <PageHeader title="Add monitoring record" back backHref={`/pets/${id}`} />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField control={form.control} name="weight" render={({ field }) => (
            <FormItem>
              <FormLabel>Weight (kg)</FormLabel>
              <FormControl><Input type="number" step="0.01" {...field} placeholder="e.g. 4.5" data-testid="input-weight" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="height" render={({ field }) => (
            <FormItem>
              <FormLabel>Height (cm)</FormLabel>
              <FormControl><Input type="number" step="0.1" {...field} placeholder="e.g. 25" data-testid="input-height" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="temperature" render={({ field }) => (
            <FormItem>
              <FormLabel>Body temperature (°C)</FormLabel>
              <FormControl><Input type="number" step="0.1" {...field} placeholder="e.g. 38.5" data-testid="input-temperature" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="notes" render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl><Textarea {...field} placeholder="Any observations..." rows={3} data-testid="input-notes" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <Button type="submit" className="w-full" disabled={addMonitoring.isPending} data-testid="btn-submit">
            {addMonitoring.isPending ? "Saving..." : "Save record"}
          </Button>
        </form>
      </Form>
    </AppShell>
  );
}
