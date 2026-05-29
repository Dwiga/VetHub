import { useParams, Link } from "wouter";
import { useGetSharedVisit } from "@workspace/api-client-react";
import { useAuth } from "@clerk/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Banknote, PawPrint, Calendar, User, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";

function formatDate(dateStr: string) {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

function formatRp(n: number) {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

const categoryLabel: Record<string, string> = {
  service: "Layanan",
  medicine: "Obat",
  supporting: "Penunjang",
  other: "Lainnya",
};

function StatusBadgeSimple({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    active: { label: "Aktif", className: "bg-blue-100 text-blue-700" },
    completed: { label: "Selesai", className: "bg-green-100 text-green-700" },
    cancelled: { label: "Dibatalkan", className: "bg-red-100 text-red-700" },
    inpatient: { label: "Rawat Inap", className: "bg-purple-100 text-purple-700" },
    outpatient: { label: "Rawat Jalan", className: "bg-teal-100 text-teal-700" },
  };
  const { label, className } = map[status] ?? { label: status, className: "bg-muted text-muted-foreground" };
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", className)}>{label}</span>;
}

export default function SharedVisitPage() {
  const { token } = useParams<{ token: string }>();
  const { isSignedIn } = useAuth();
  const query = useGetSharedVisit(token ?? "");

  if (query.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-3 w-full max-w-lg px-4">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4">
        <PawPrint className="h-12 w-12 text-muted-foreground" />
        <p className="text-center text-muted-foreground">Link kunjungan tidak ditemukan atau sudah tidak berlaku.</p>
      </div>
    );
  }

  const v = query.data;
  const items = v.items ?? [];
  const reports = v.dailyReports ?? [];
  const deposit = v.deposit ?? 0;
  const billedCost = v.billedCost ?? 0;
  const paidDirectly = (v.totalCost ?? 0) - billedCost;
  const netDue = billedCost - deposit;

  const grouped = items.reduce((acc: Record<string, typeof items>, item) => {
    const d = item.itemDate || "";
    if (!acc[d]) acc[d] = [];
    acc[d].push(item);
    return acc;
  }, {});
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-semibold text-lg">
            <PawPrint className="h-5 w-5" />
            {v.petName ?? "Peliharaan"}
          </div>
          <div className="flex gap-2 flex-wrap">
            <StatusBadgeSimple status={v.type ?? "outpatient"} />
            <StatusBadgeSimple status={v.status ?? "active"} />
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground pt-1">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(v.visitDate)}
          </div>
          {v.vetName && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              Drh. {v.vetName}
            </div>
          )}
        </div>

        {/* Billing Summary */}
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Banknote className="h-4 w-4 text-primary" />
              Ringkasan Tagihan
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Perawatan</span>
              <span>{formatRp(v.totalCost ?? 0)}</span>
            </div>
            {paidDirectly > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sudah Dibayar Langsung</span>
                <span className="text-green-600">− {formatRp(paidDirectly)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-medium border-t pt-1.5 mt-1.5">
              <span>Total Ditagihkan</span>
              <span>{formatRp(billedCost)}</span>
            </div>
            {deposit > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Uang Muka</span>
                <span className="text-blue-600">− {formatRp(deposit)}</span>
              </div>
            )}
            <div className={cn(
              "flex justify-between text-base font-bold border-t pt-2 mt-1",
              netDue < 0 ? "text-blue-600" : netDue === 0 ? "text-green-600" : "text-foreground"
            )}>
              <span>{netDue < 0 ? "Kembalian" : netDue === 0 ? "Lunas" : "Sisa Tagihan"}</span>
              <span>{formatRp(Math.abs(netDue))}</span>
            </div>
          </CardContent>
        </Card>

        {/* Visit Items by date */}
        {sortedDates.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Rincian Biaya
            </h3>
            {sortedDates.map(date => {
              const grpItems = grouped[date];
              const subtotal = grpItems.reduce((s: number, i: any) => s + (i.totalPrice ?? 0), 0);
              return (
                <Card key={date}>
                  <CardHeader className="pb-2 pt-3 px-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">{formatDate(date)}</span>
                      <span className="text-xs font-medium">{formatRp(subtotal)}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-3 space-y-2">
                    {grpItems.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {categoryLabel[item.category] ?? item.category} · {item.quantity} × {formatRp(item.unitPrice)}
                          </p>
                        </div>
                        <span className="text-sm font-medium shrink-0">{formatRp(item.totalPrice ?? 0)}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Daily Reports */}
        {reports.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Laporan Harian</h3>
            {reports.map((r: any) => (
              <Card key={r.id}>
                <CardHeader className="pb-2 pt-3 px-4">
                  <span className="text-xs text-muted-foreground">{formatDate(r.reportDate)}</span>
                </CardHeader>
                <CardContent className="px-4 pb-3 space-y-1">
                  {r.condition && <p className="text-sm"><span className="text-muted-foreground">Kondisi: </span>{r.condition}</p>}
                  {r.treatment && <p className="text-sm"><span className="text-muted-foreground">Tindakan: </span>{r.treatment}</p>}
                  {r.notes && <p className="text-sm"><span className="text-muted-foreground">Catatan: </span>{r.notes}</p>}
                  {r.cost > 0 && (
                    <p className="text-sm font-medium text-right">{formatRp(r.cost)}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* CTA banner for non-signed-in users */}
        {!isSignedIn && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-4 pb-4 text-center space-y-3">
              <PawPrint className="h-8 w-8 text-primary mx-auto" />
              <div>
                <p className="font-semibold text-sm">Ingin memantau peliharaan?</p>
                <p className="text-xs text-muted-foreground mt-0.5">Silahkan daftar untuk melacak kesehatan hewan peliharaan Anda</p>
              </div>
              <div className="flex gap-2 justify-center">
                <Button size="sm" asChild><Link href="/sign-up">Daftar</Link></Button>
                <Button size="sm" variant="outline" asChild><Link href="/sign-in">Masuk</Link></Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground pb-4">
          PetHub · Rekam Medis Digital
        </p>
      </div>
    </div>
  );
}
