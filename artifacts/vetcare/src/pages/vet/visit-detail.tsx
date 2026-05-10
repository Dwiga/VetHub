import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  useGetVisit, useUpdateVisit, useAddVisitItem, useDeleteVisitItem, useUpdateVisitItem,
  useCreateDailyReport, getGetVisitQueryKey, useGetMe
} from "@workspace/api-client-react";
import { useRole } from "@/contexts/RoleContext";
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
import { Printer, Plus, Trash2, CheckCircle2, Circle, Banknote } from "lucide-react";
import { cn } from "@/lib/utils";

const itemSchema = z.object({
  itemDate: z.string().min(1, "Date is required"),
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
  deposit: z.string().optional(),
});

const CATEGORY_LABELS: Record<string, string> = {
  service: "Service",
  medicine: "Medicine",
  supporting: "Supporting",
  other: "Other",
};

function formatDate(dateStr: string) {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

function groupItemsByDate(items: any[]): { date: string; items: any[]; subtotal: number; billedSubtotal: number }[] {
  const map = new Map<string, any[]>();
  for (const item of items) {
    const d = item.itemDate || "";
    if (!map.has(d)) map.set(d, []);
    map.get(d)!.push(item);
  }
  const groups: { date: string; items: any[]; subtotal: number; billedSubtotal: number }[] = [];
  for (const [date, grpItems] of map.entries()) {
    const subtotal = grpItems.reduce((s: number, i: any) => s + (i.totalPrice ?? 0), 0);
    const billedSubtotal = grpItems.filter((i: any) => !i.isPaid).reduce((s: number, i: any) => s + (i.totalPrice ?? 0), 0);
    groups.push({ date, items: grpItems, subtotal, billedSubtotal });
  }
  return groups.sort((a, b) => (b.date > a.date ? 1 : -1));
}

function BillingSummary({ v, isVet }: { v: any; isVet: boolean }) {
  const deposit = v.deposit ?? 0;
  const billedCost = v.billedCost ?? 0;
  const paidDirectly = (v.totalCost ?? 0) - billedCost;
  const netDue = billedCost - deposit;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Banknote className="h-4 w-4 text-primary" />
          Billing summary
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4 space-y-1.5">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Total items &amp; care</span>
          <span>Rp {(v.totalCost ?? 0).toLocaleString("id-ID")}</span>
        </div>
        {paidDirectly > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Paid directly</span>
            <span className="text-green-600">− Rp {paidDirectly.toLocaleString("id-ID")}</span>
          </div>
        )}
        <div className="flex justify-between text-sm font-medium border-t border-border pt-1.5 mt-1.5">
          <span>Billed total</span>
          <span>Rp {billedCost.toLocaleString("id-ID")}</span>
        </div>
        {deposit > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Deposit received</span>
            <span className="text-blue-600">− Rp {deposit.toLocaleString("id-ID")}</span>
          </div>
        )}
        <div className={cn(
          "flex justify-between text-base font-bold border-t border-border pt-2 mt-1",
          netDue < 0 ? "text-blue-600" : netDue === 0 ? "text-green-600" : "text-foreground"
        )}>
          <span>{netDue < 0 ? "Refund to owner" : netDue === 0 ? "Settled" : "Amount due"}</span>
          <span>Rp {Math.abs(netDue).toLocaleString("id-ID")}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function VisitDetailPage() {
  const { visitId } = useParams<{ visitId: string }>();
  const id = parseInt(visitId);
  const visit = useGetVisit(id, { query: { queryKey: getGetVisitQueryKey(id) } });
  const me = useGetMe({ query: { queryKey: ["me"] } });
  const updateVisit = useUpdateVisit();
  const addItem = useAddVisitItem();
  const deleteItem = useDeleteVisitItem();
  const updateItem = useUpdateVisitItem();
  const createReport = useCreateDailyReport();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const v = visit.data;
  const { activeRole } = useRole();
  const isVet = activeRole === "vet";
  const today = new Date().toISOString().split("T")[0];

  const visitForm = useForm<z.infer<typeof visitSchema>>({
    resolver: zodResolver(visitSchema),
    values: {
      anamnesis: v?.anamnesis ?? "",
      therapy: v?.therapy ?? "",
      status: (v?.status as "active" | "completed" | "cancelled" | undefined) ?? "active",
      dischargeDate: v?.dischargeDate ?? "",
      deposit: v?.deposit != null ? String(v.deposit) : "",
    },
  });

  const itemForm = useForm<z.infer<typeof itemSchema>>({
    resolver: zodResolver(itemSchema),
    defaultValues: { itemDate: today, category: "service", name: "", description: "", quantity: "1", unitPrice: "0" },
  });

  const reportForm = useForm<z.infer<typeof reportSchema>>({
    resolver: zodResolver(reportSchema),
    defaultValues: { reportDate: today, condition: "", treatment: "", notes: "", cost: "0" },
  });

  async function saveVisit(values: z.infer<typeof visitSchema>) {
    const depositVal = values.deposit && values.deposit.trim() !== "" ? parseFloat(values.deposit) : null;
    await updateVisit.mutateAsync({
      visitId: id,
      data: {
        anamnesis: values.anamnesis,
        therapy: values.therapy,
        status: values.status,
        dischargeDate: values.dischargeDate,
        deposit: depositVal as number | undefined,
      },
    });
    queryClient.invalidateQueries({ queryKey: getGetVisitQueryKey(id) });
    toast({ title: "Visit updated" });
  }

  async function addVisitItem(values: z.infer<typeof itemSchema>) {
    await addItem.mutateAsync({
      visitId: id,
      data: {
        itemDate: values.itemDate,
        category: values.category,
        name: values.name,
        description: values.description,
        quantity: parseFloat(values.quantity),
        unitPrice: parseFloat(values.unitPrice),
      },
    });
    queryClient.invalidateQueries({ queryKey: getGetVisitQueryKey(id) });
    setItemDialogOpen(false);
    itemForm.reset({ itemDate: today, category: "service", name: "", description: "", quantity: "1", unitPrice: "0" });
    toast({ title: "Item added" });
  }

  async function removeItem(itemId: number) {
    await deleteItem.mutateAsync({ itemId });
    queryClient.invalidateQueries({ queryKey: getGetVisitQueryKey(id) });
    toast({ title: "Item removed" });
  }

  async function togglePaid(item: any) {
    setTogglingId(item.id);
    try {
      await updateItem.mutateAsync({ itemId: item.id, data: { isPaid: !item.isPaid } });
      queryClient.invalidateQueries({ queryKey: getGetVisitQueryKey(id) });
    } finally {
      setTogglingId(null);
    }
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
    reportForm.reset({ reportDate: today, condition: "", treatment: "", notes: "", cost: "0" });
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
  const dateGroups = groupItemsByDate(items);

  return (
    <AppShell>
      <PageHeader
        title={`Visit — ${v.petName}`}
        subtitle={[v.visitDate, v.vetName].filter(Boolean).join(" · ")}
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
            Due: <span className="font-semibold text-foreground">
              Rp {Math.max(0, (v.billedCost ?? 0) - (v.deposit ?? 0)).toLocaleString("id-ID")}
            </span>
          </span>
        </div>

        {isVet && (
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
                  <FormField control={visitForm.control} name="deposit" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deposit received (Rp)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          {...field}
                          data-testid="input-deposit"
                        />
                      </FormControl>
                    </FormItem>
                  )} />
                  <Button type="submit" size="sm" className="w-full" disabled={updateVisit.isPending} data-testid="btn-save-visit">
                    {updateVisit.isPending ? "Saving..." : "Save notes"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {!isVet && (v.anamnesis || v.therapy) && (
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Clinical notes</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {v.anamnesis && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Anamnesis</p>
                  <p className="text-sm">{v.anamnesis}</p>
                </div>
              )}
              {v.therapy && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Therapy</p>
                  <p className="text-sm">{v.therapy}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-3 flex-row items-center justify-between">
            <CardTitle className="text-sm">Visit items</CardTitle>
            {isVet && (
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
                      <FormField control={itemForm.control} name="itemDate" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date</FormLabel>
                          <FormControl><Input type="date" {...field} data-testid="input-item-date" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
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
            )}
          </CardHeader>
          <CardContent className="pb-4">
            {dateGroups.length === 0 && <p className="text-sm text-muted-foreground text-center py-3">No items yet</p>}
            <div className="space-y-5">
              {dateGroups.map(group => (
                <div key={group.date}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-primary">{formatDate(group.date)}</p>
                    <p className="text-xs text-muted-foreground">
                      Rp {group.billedSubtotal.toLocaleString("id-ID")}
                      {group.billedSubtotal < group.subtotal && (
                        <span className="ml-1 text-muted-foreground/60">(of Rp {group.subtotal.toLocaleString("id-ID")})</span>
                      )}
                    </p>
                  </div>
                  <div className="space-y-2">
                    {group.items.map((item: any) => (
                      <div
                        key={item.id}
                        className={cn(
                          "flex items-center gap-2 py-2 border-b border-border last:border-0",
                          item.isPaid && "opacity-60"
                        )}
                        data-testid={`row-item-${item.id}`}
                      >
                        {isVet && (
                          <button
                            onClick={() => togglePaid(item)}
                            disabled={togglingId === item.id}
                            className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
                            data-testid={`btn-toggle-paid-${item.id}`}
                            title={item.isPaid ? "Mark as billed" : "Mark as paid directly"}
                          >
                            {item.isPaid
                              ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                              : <Circle className="h-4 w-4" />
                            }
                          </button>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">{CATEGORY_LABELS[item.category] ?? item.category}</Badge>
                            <span className={cn("text-sm font-medium truncate", item.isPaid && "line-through")}>{item.name}</span>
                            {item.isPaid && (
                              <Badge variant="secondary" className="text-xs text-green-700 bg-green-100">Paid</Badge>
                            )}
                          </div>
                          {item.description && <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>}
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {item.quantity} × Rp {(item.unitPrice ?? 0).toLocaleString("id-ID")} = Rp {(item.totalPrice ?? 0).toLocaleString("id-ID")}
                          </p>
                        </div>
                        {isVet && (
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:bg-destructive/10 shrink-0" onClick={() => removeItem(item.id)} data-testid={`btn-delete-item-${item.id}`}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {v.type === "inpatient" && (
          <Card>
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <CardTitle className="text-sm">Daily reports</CardTitle>
              {isVet && (
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
              )}
            </CardHeader>
            <CardContent className="pb-4">
              {reports.length === 0 && <p className="text-sm text-muted-foreground text-center py-3">No reports yet</p>}
              <div className="space-y-3">
                {reports.map((r: any) => (
                  isVet ? (
                    <Link key={r.id} href={`/vet/daily-reports/${r.id}`}>
                      <Card className="hover:border-primary/50 cursor-pointer" data-testid={`card-report-${r.id}`}>
                        <CardContent className="py-3">
                          <p className="text-xs font-semibold text-primary">{formatDate(r.reportDate)}</p>
                          <p className="text-sm mt-1 text-foreground">{r.condition ?? "—"}</p>
                          {r.cost > 0 && <p className="text-xs text-muted-foreground mt-1">Cost: Rp {r.cost.toLocaleString("id-ID")}</p>}
                        </CardContent>
                      </Card>
                    </Link>
                  ) : (
                    <Card key={r.id} data-testid={`card-report-${r.id}`}>
                      <CardContent className="py-3">
                        <p className="text-xs font-semibold text-primary">{formatDate(r.reportDate)}</p>
                        {r.condition && <p className="text-sm mt-1">{r.condition}</p>}
                        {r.treatment && (
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground">Treatment</p>
                            <p className="text-sm">{r.treatment}</p>
                          </div>
                        )}
                        {r.notes && (
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground">Notes</p>
                            <p className="text-sm">{r.notes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <BillingSummary v={v} isVet={isVet} />
      </div>
    </AppShell>
  );
}
