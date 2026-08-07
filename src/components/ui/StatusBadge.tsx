import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    upcoming:  ["bg-blue-50 text-blue-700 border border-blue-200", "Upcoming"],
    completed: ["bg-green-50 text-green-700 border border-green-200", "Completed"],
    cancelled: ["bg-red-50 text-red-700 border border-red-200",   "Cancelled"],
  };
  const [cls, label] = map[status] ?? ["bg-gray-100 text-gray-600", status];
  return <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", cls)}>{label}</span>;
}
