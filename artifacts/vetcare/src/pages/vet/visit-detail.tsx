import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  useGetVisit, useUpdateVisit, useAddVisitItem, useDeleteVisitItem,
  useCreateDailyReport, getGetVisitQueryKey, useGetMe
} from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Printer, Plus, Trash2 } from "lucide-react";

const itemSchema = z.object({
  category: z.enum(["service", "medicine", "supporting", "other"]),
  name: z.string().min(1),
  description: z.string().optional(),
  quantity: z.string().min(1),
  unitPrice: z.string().min(1),
});

const reportSchema = z.object({
  reportDate: z.string().min(1),
  condition: z.string().optional(),
  treatment: z.string().optional(),
  notes: z.string().optional(),
  cost: z.string().optional(),
});

const visitSchema = z.object({
  anamnesis: z.string().optional(),
  therapy: z.string().optional(),
  status: z.enum(["active", "completed", "cancelled"]).optional(),
  dischargeDate: z.string().optional(),
});

const CATEGORY_LABELS: Record<string, string> = {
  service: "Service",
  medicine: "Medicine",
  supporting: "Supporting",
  other: "Other",
};

export default function VisitDetailPage() {
  const { visitId } = useParams<{ visitId: string }>();
  const id = parseInt(visitId);
  const visit = useGetVisit(id, { query: { queryKey: getGetVisitQueryKey(id) } });
  const updateVisit = useUpdateVisit();
  const addItem = useAddVisitItem();
  const deleteItem = useDeleteVisitItem();
  const createReport = useCreateDailyReport();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  const v = visit.data;

  const visitForm = useForm<z.infer<typeof visitSchema>>({
    resolver: zodResolver(visitSchema),
    values: { anamnesis: v?.anamnesis ?? "", therapy: v?.therapy ?? "", status: (v?.status as "active" | "completed" | "cancelled" | undefined) ?? "active", dischargeDate: v?.dischargeDate ?? "" },
  });

  const itemForm = useForm<z.infer<typeof itemSchema>>({
    resolver: zodResolver(itemSchema),
    defaultValues: { category: "service", name: "", description: "", quantity: "1", unitPrice: "0" },
  });

  const reportForm = useForm<z.infer<typeof reportSchema>>({
    resolver: zodResolver(reportSchema),
    defaultValues: { reportDate: new Date().toISOString().split("T")[0], condition: "", treatment: "", notes: "", cost: "0" },
  });

  async function saveVisit(values: z.infer<typeof visitSchema>) {
    await updateVisit.mutateAsync({ visitId: id, data: values });
    queryClient.invalidateQueries({ queryKey: getGetVisitQueryKey(id) });
    toast({ title: "Visit updated" });
  }

  async function addVisitItem(values: z.infer<typeof itemSchema>) {
    await addItem.mutateAsync({
      visitId: id,
      data: {
        ...values,
        quantity: parseFloat(values.quantity),
        unitPrice: parseFloat(values.unitPrice),
      },
    });
    queryClient.invalidateQueries({ queryKey: getGetVisitQueryKey(id) });
    setItemDialogOpen(false);
    itemForm.reset();
    toast({ title: "Item added" });
  }

  async function removeItem(itemId: number) {
    await deleteItem.mutateAsync({ itemId });
    queryClient.invalidateQueries({ queryKey: getGetVisitQueryKey(id) });
    toast({ title: "Item removed" });
  }

  async function addDailyReport(values: z.infer<typeof reportSchema>) {
    await createReport.mutateAsync({
      visitId: id,
      data: {
        reportDate: values.reportDate,
        condition: values.condition,
        treatment: values.treatment,
        notes: values.notes,
        cost: values.cost ? parseFloat(values.cost) : 0,
      },
    });
    queryClient.invalidateQueries({ queryKey: getGetVisitQueryKey(id) });
    setReportDialogOpen(false);
    reportForm.reset({ reportDate: new Date().toISOString().split("T")[0], condition: "", treatment: "", notes: "", cost: "0" });
    toast({ title: "Daily report added" });
  }

  if (visit.isLoading) return (
    <AppShell>
      <div className="space-y-4 pt-4">
        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />)}
      </div>
    </AppShell>
  );

  if (!v) return <AppShell><p className="text-center text-muted-foreground pt-8">Visit not found</p></AppShell>;

  const items = v.items ?? [];
  const reports = v.dailyReports ?? [];
  const totalCost = v.totalCost ?? 0;

  return (
    <AppShell>
      <PageHeader
        title={`Visit — ${v.petName}`}
        subtitle={v.visitDate}
        back
        action={
          <Button size="sm" variant="ghost" onClick={() => window.print()} data-testid="btn-print">
            <Printer className="h-4 w-4" />
          </Button>
        }
      />

      <div className="space-y-5 print:space-y-4">
        <div className="flex items-center gap-2">
          <StatusBadge status={v.type ?? "outpatient"} />
          <StatusBadge status={v.status ?? "active"} />
          <span className="text-sm text-muted-foreground flex-1 text-right">
            Total: <span className="font-semibold text-foreground">Rp {totalCost.toLocaleString("id-ID")}</span>
          </span>
        </div>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Clinical notes</CardTitle></CardHeader>
          <CardContent>
            <Form {...visitForm}>
              <form onSubmit={visitForm.handleSubmit(saveVisit)} className="space-y-3">
                <FormField control={visitForm.control} name="anamnesis" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Anamnesis</FormLabel>
                    <FormControl><Textarea {...field} rows={3} placeholder="History and complaints..." data-testid="input-anamnesis" /></FormControl>
                  </FormItem>
                )} />
                <FormField control={visitForm.control} name="therapy" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Therapy</FormLabel>
                    <FormControl><Textarea {...field} rows={3} placeholder="Prescribed therapy..." data-testid="input-therapy" /></FormControl>
                  </FormItem>
                )} />
                <div className="flex gap-3">
                  <FormField control={visitForm.control} name="status" render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? ""}>
                        <FormControl><SelectTrigger data-testid="select-status"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                  <FormField control={visitForm.control} name="dischargeDate" render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Discharge date</FormLabel>
                      <FormControl><Input type="date" {...field} data-testid="input-discharge" /></FormControl>
                    </FormItem>
                  )} />
                </div>
                <Button type="submit" size="sm" className="w-full" disabled={updateVisit.isPending} data-testid="btn-save-visit">
                  {updateVisit.isPending ? "Saving..." : "Save notes"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 flex-row items-center justify-between">
            <CardTitle className="text-sm">Visit items</CardTitle>
            <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" data-testid="btn-add-item">
                  <Plus className="h-4 w-4 mr-1" />Add
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add visit item</DialogTitle></DialogHeader>
                <Form {...itemForm}>
                  <form onSubmit={itemForm.handleSubmit(addVisitItem)} className="space-y-4 pt-2">
                    <FormField control={itemForm.control} name="category" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="service">Service</SelectItem>
                            <SelectItem value="medicine">Medicine</SelectItem>
                            <SelectItem value="supporting">Supporting</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    <FormField control={itemForm.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl><Input {...field} placeholder="Item name" data-testid="input-item-name" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={itemForm.control} name="description" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl><Input {...field} data-testid="input-item-desc" /></FormControl>
                      </FormItem>
                    )} />
                    <div className="flex gap-3">
                      <FormField control={itemForm.control} name="quantity" render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Quantity</FormLabel>
                          <FormControl><Input type="number" step="0.01" min="0" {...field} data-testid="input-item-qty" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={itemForm.control} name="unitPrice" render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Unit price (Rp)</FormLabel>
                          <FormControl><Input type="number" min="0" {...field} data-testid="input-item-price" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <Button type="submit" className="w-full" disabled={addItem.isPending} data-testid="btn-submit-item">
                      {addItem.isPending ? "Adding..." : "Add item"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="pb-4">
            {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-3">No items yet</p>}
            <div className="space-y-2">
              {items.map((item: any) => (
                <div key={item.id} className="flex items-center gap-2 py-2 border-b border-border last:border-0" data-testid={`row-item-${item.id}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{CATEGORY_LABELS[item.category] ?? item.category}</Badge>
                      <span className="text-sm font-medium truncate">{item.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.quantity} × Rp {(item.unitPrice ?? 0).toLocaleString("id-ID")} = Rp {(item.totalPrice ?? 0).toLocaleString("id-ID")}
                    </p>
                  </div>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:bg-destructive/10 shrink-0" onClick={() => removeItem(item.id)} data-testid={`btn-delete-item-${item.id}`}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {v.type === "inpatient" && (
          <Card>
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <CardTitle className="text-sm">Daily reports</CardTitle>
              <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" data-testid="btn-add-report"><Plus className="h-4 w-4 mr-1" />Add</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add daily report</DialogTitle></DialogHeader>
                  <Form {...reportForm}>
                    <form onSubmit={reportForm.handleSubmit(addDailyReport)} className="space-y-4 pt-2">
                      <FormField control={reportForm.control} name="reportDate" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date</FormLabel>
                          <FormControl><Input type="date" {...field} data-testid="input-report-date" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={reportForm.control} name="condition" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Condition</FormLabel>
                          <FormControl><Textarea {...field} rows={2} placeholder="Patient's condition today..." data-testid="input-condition" /></FormControl>
                        </FormItem>
                      )} />
                      <FormField control={reportForm.control} name="treatment" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Treatment</FormLabel>
                          <FormControl><Textarea {...field} rows={2} placeholder="Treatments administered..." data-testid="input-treatment" /></FormControl>
                        </FormItem>
                      )} />
                      <FormField control={reportForm.control} name="notes" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl><Textarea {...field} rows={2} data-testid="input-report-notes" /></FormControl>
                        </FormItem>
                      )} />
                      <FormField control={reportForm.control} name="cost" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cost (Rp)</FormLabel>
                          <FormControl><Input type="number" min="0" {...field} data-testid="input-report-cost" /></FormControl>
                        </FormItem>
                      )} />
                      <Button type="submit" className="w-full" disabled={createReport.isPending} data-testid="btn-submit-report">
                        {createReport.isPending ? "Adding..." : "Add report"}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="pb-4">
              {reports.length === 0 && <p className="text-sm text-muted-foreground text-center py-3">No reports yet</p>}
              <div className="space-y-3">
                {reports.map((r: any) => (
                  <Link key={r.id} href={`/vet/daily-reports/${r.id}`}>
                    <Card className="hover:border-primary/50 cursor-pointer" data-testid={`card-report-${r.id}`}>
                      <CardContent className="py-3">
                        <p className="text-xs font-semibold text-muted-foreground">{r.reportDate}</p>
                        <p className="text-sm mt-1 text-foreground">{r.condition ?? "—"}</p>
                        {r.cost > 0 && <p className="text-xs text-muted-foreground mt-1">Cost: Rp {r.cost.toLocaleString("id-ID")}</p>}
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
