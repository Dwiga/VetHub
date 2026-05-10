import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { useGetMe, useGetReportSummary, useGetVisitStats, getGetReportSummaryQueryKey, getGetVisitStatsQueryKey } from "@workspace/api-client-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { TrendingUp, Users, Activity } from "lucide-react";

type Period = "daily" | "monthly" | "yearly";

export default function ClinicReportsPage() {
  const me = useGetMe();
  const clinicId = me.data?.clinicId;
  const [period, setPeriod] = useState<Period>("monthly");
  const [date] = useState(() => new Date().toISOString().split("T")[0]);

  const summary = useGetReportSummary(
    clinicId!,
    { period, date },
    { query: { enabled: !!clinicId, queryKey: getGetReportSummaryQueryKey(clinicId!, { period, date }) } }
  );

  const stats = useGetVisitStats(
    clinicId!,
    { period, date },
    { query: { enabled: !!clinicId, queryKey: getGetVisitStatsQueryKey(clinicId!, { period, date }) } }
  );

  const s = summary.data;
  const v = stats.data;

  const chartData = v
    ? (v.labels ?? []).map((label: string, i: number) => ({
        label,
        visits: (v.visitCounts ?? [])[i] ?? 0,
      }))
    : [];

  function formatRp(n: number) {
    if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}K`;
    return `Rp ${n.toLocaleString("id-ID")}`;
  }

  return (
    <AppShell>
      <PageHeader title="Reports" subtitle="Revenue & visits" />

      <div className="space-y-5">
        <div className="flex gap-2">
          {(["daily", "monthly", "yearly"] as Period[]).map(p => (
            <Button
              key={p}
              size="sm"
              variant={period === p ? "default" : "outline"}
              onClick={() => setPeriod(p)}
              className="flex-1 capitalize"
              data-testid={`btn-period-${p}`}
            >
              {p}
            </Button>
          ))}
        </div>

        {summary.isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />)}
          </div>
        )}

        {s && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="py-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Revenue</span>
                  </div>
                  <p className="text-lg font-bold text-foreground" data-testid="text-total-revenue">
                    {formatRp(s.totalRevenue ?? 0)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Visits</span>
                  </div>
                  <p className="text-lg font-bold text-foreground" data-testid="text-total-visits">
                    {s.totalVisits ?? 0}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-4 w-4 text-chart-2" />
                    <span className="text-xs text-muted-foreground">Inpatient</span>
                  </div>
                  <p className="text-lg font-bold text-foreground" data-testid="text-inpatient">
                    {s.inpatientVisits ?? 0}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-4 w-4 text-chart-3" />
                    <span className="text-xs text-muted-foreground">Outpatient</span>
                  </div>
                  <p className="text-lg font-bold text-foreground" data-testid="text-outpatient">
                    {s.outpatientVisits ?? 0}
                  </p>
                </CardContent>
              </Card>
            </div>

            {chartData.length > 0 && (
              <Card>
                <CardHeader className="pb-2 pt-4"><CardTitle className="text-sm">Visit trend</CardTitle></CardHeader>
                <CardContent className="pb-4">
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                      <YAxis tick={{ fontSize: 11 }} width={28} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="visits" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {s.topServices && s.topServices.length > 0 && (
              <Card>
                <CardHeader className="pb-2 pt-4"><CardTitle className="text-sm">Top services</CardTitle></CardHeader>
                <CardContent className="pb-4">
                  <div className="space-y-2">
                    {s.topServices.map((svc: any, i: number) => (
                      <div key={svc.name} className="flex items-center justify-between gap-2" data-testid={`row-service-${i}`}>
                        <p className="text-sm font-medium truncate flex-1">{svc.name}</p>
                        <span className="text-xs text-muted-foreground shrink-0">{svc.count}x</span>
                        <span className="text-xs font-semibold text-foreground shrink-0">{formatRp(svc.revenue)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
