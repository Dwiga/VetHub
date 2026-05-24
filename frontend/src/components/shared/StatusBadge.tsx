import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  healthy: { label: "Healthy", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  sick: { label: "Sick", className: "bg-amber-100 text-amber-800 border-amber-200" },
  hospitalized: { label: "Hospitalized", className: "bg-blue-100 text-blue-800 border-blue-200" },
  need_intensive_care: { label: "Intensive Care", className: "bg-red-100 text-red-800 border-red-200" },
  passed_away: { label: "Passed Away", className: "bg-gray-100 text-gray-600 border-gray-200" },
  active: { label: "Active", className: "bg-blue-100 text-blue-800 border-blue-200" },
  completed: { label: "Completed", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  cancelled: { label: "Cancelled", className: "bg-gray-100 text-gray-600 border-gray-200" },
  inpatient: { label: "Inpatient", className: "bg-purple-100 text-purple-800 border-purple-200" },
  outpatient: { label: "Outpatient", className: "bg-teal-100 text-teal-800 border-teal-200" },
};

export function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, className: "bg-gray-100 text-gray-700 border-gray-200" };
  return (
    <Badge
      variant="outline"
      className={cn("text-xs font-medium capitalize", cfg.className)}
      data-testid={`status-${status}`}
    >
      {cfg.label}
    </Badge>
  );
}
