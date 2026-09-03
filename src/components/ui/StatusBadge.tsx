import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    pending_payment: ["bg-amber-50 text-amber-700 border border-amber-200", "Menunggu Pembayaran"],
    upcoming:        ["bg-blue-50 text-blue-700 border border-blue-200", "Upcoming"],
    completed:       ["bg-green-50 text-green-700 border border-green-200", "Completed"],
    cancelled:       ["bg-red-50 text-red-700 border border-red-200",   "Cancelled"],
    expired:         ["bg-gray-100 text-gray-500 border border-gray-200", "Kadaluarsa"],
  };
  const [cls, label] = map[status] ?? ["bg-gray-100 text-gray-600", status];
  return <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", cls)}>{label}</span>;
}
