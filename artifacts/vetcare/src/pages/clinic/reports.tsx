import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { useGetMe, useGetReportSummary, useGetVisitStats, getGetReportSummaryQueryKey, getGetVisitStatsQueryKey } from "@workspace/api-client-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { TrendingUp, Users, Activity, Heart, Skull, LogOut } from "lucide-react";

type Period = "daily" | "weekly" | "monthly" | "quarterly" | "yearly";

const PERIODS: { key: Period; label: string }[] = [
  { key: "daily", label: "Today" },
  { key: "weekly", label: "Week" },
  { key: "monthly", label: "Month" },
  { key: "quarterly", label: "Quarter" },
  { key: "yearly", label: "Year" },
];

function formatRp(n: number) {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}K`;
  return `Rp ${n.toLocaleString("id-ID")}`;
}

function formatXLabel(label: string, period: Period) {
  if (period === "daily" || period === "weekly") return label.replace(/^\d{4}-/, "");
  return label;
}

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

  const trendData = v
    ? (v.labels ?? []).map((label: string, i: number) => ({
        label: formatXLabel(label, period),
        visits: (v.visitCounts ?? [])[i] ?? 0,
        revenue: (v.revenues ?? [])[i] ?? 0,
      }))
    : [];

  const isLoading = summary.isLoading || stats.isLoading;

  return (
    <AppShell>
      <PageHeader title="Reports" subtitle="Clinic analytics" />

      <div className="space-y-5">
        {/* Period selector */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {PERIODS.map(p => (
            <Button
              key={p.key}
              size="sm"
              variant={period === p.key ? "default" : "outline"}
              onClick={() => setPeriod(p.key)}
              className="flex-1 min-w-0 text-xs"
              data-testid={`btn-period-${p.key}`}
            >
              {p.label}
            </Button>
          ))}
        </div>

        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />)}
          </div>
        )}

        {s && (
          <>
            {/* Revenue highlight */}
            <Card className="bg-primary text-primary-foreground">
              <CardContent className="py-4">
                <p className="text-xs opacity-75 mb-1">Total revenue</p>
                <p className="text-2xl font-bold" data-testid="text-total-revenue">
                  {formatRp(s.totalRevenue ?? 0)}
                </p>
                {(s.totalVisits ?? 0) > 0 && (
                  <p className="text-xs opacity-70 mt-1">
                    Avg {formatRp(s.averageRevenuePerVisit ?? 0)} / visit
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Visit breakdown */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Visits</p>
              <div className="grid grid-cols-3 gap-2">
                <Card>
                  <CardContent className="py-3 text-center">
                    <Users className="h-4 w-4 text-primary mx-auto mb-1" />
                    <p className="text-xl font-bold" data-testid="text-total-visits">{s.totalVisits ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="py-3 text-center">
                    <Activity className="h-4 w-4 text-chart-2 mx-auto mb-1" />
                    <p className="text-xl font-bold" data-testid="text-inpatient">{s.inpatientVisits ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Inpatient</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="py-3 text-center">
                    <Activity className="h-4 w-4 text-chart-3 mx-auto mb-1" />
                    <p className="text-xl font-bold" data-testid="text-outpatient">{s.outpatientVisits ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Outpatient</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Patient outcomes */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Patient outcomes</p>
              <div className="grid grid-cols-3 gap-2">
                <Card>
                  <CardContent className="py-3 text-center">
                    <Heart className="h-4 w-4 text-green-600 mx-auto mb-1" />
                    <p className="text-xl font-bold text-green-600" data-testid="text-survived">{s.survivedCount ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Survived</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="py-3 text-center">
                    <Skull className="h-4 w-4 text-destructive mx-auto mb-1" />
                    <p className="text-xl font-bold text-destructive" data-testid="text-died">{s.diedCount ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Passed away</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="py-3 text-center">
                    <LogOut className="h-4 w-4 text-amber-500 mx-auto mb-1" />
                    <p className="text-xl font-bold text-amber-500" data-testid="text-early">{s.earlyDischargeCount ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Early exit</p>
                  </CardContent>
                </Card>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 px-1">
                Survived / Passed away = completed inpatient. Early exit = cancelled before completion.
              </p>
            </div>

            {/* Trend chart */}
            {trendData.length > 0 && (
              <div className="space-y-3">
                <Card>
                  <CardHeader className="pb-2 pt-4"><CardTitle className="text-sm">Visit trend</CardTitle></CardHeader>
                  <CardContent className="pb-4">
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={trendData} margin={{ left: -10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="label" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
                        <YAxis tick={{ fontSize: 10 }} width={28} allowDecimals={false} />
                        <Tooltip formatter={(val) => [val, "visits"]} />
                        <Bar dataKey="visits" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {trendData.some(d => d.revenue > 0) && (
                  <Card>
                    <CardHeader className="pb-2 pt-4"><CardTitle className="text-sm">Revenue trend</CardTitle></CardHeader>
                    <CardContent className="pb-4">
                      <ResponsiveContainer width="100%" height={160}>
                        <LineChart data={trendData} margin={{ left: -10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="label" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
                          <YAxis tick={{ fontSize: 9 }} width={50} tickFormatter={v => v >= 1_000_000 ? `${(v/1_000_000).toFixed(0)}M` : v >= 1_000 ? `${(v/1_000).toFixed(0)}K` : String(v)} />
                          <Tooltip formatter={(val: number) => [formatRp(val), "revenue"]} />
                          <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Top services */}
            {s.topServices && s.topServices.length > 0 && (
              <Card>
                <CardHeader className="pb-2 pt-4"><CardTitle className="text-sm">Top services</CardTitle></CardHeader>
                <CardContent className="pb-4">
                  <div className="space-y-2">
                    {s.topServices.map((svc: any, i: number) => (
                      <div key={svc.name} className="flex items-center gap-2" data-testid={`row-service-${i}`}>
                        <span className="text-xs text-muted-foreground w-4 shrink-0">{i + 1}.</span>
                        <p className="text-sm font-medium truncate flex-1">{svc.name}</p>
                        <span className="text-xs text-muted-foreground shrink-0">{svc.count}x</span>
                        <span className="text-xs font-semibold text-foreground shrink-0 min-w-[4rem] text-right">{formatRp(svc.revenue)}</span>
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
