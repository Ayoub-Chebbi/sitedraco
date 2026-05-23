import { ORDER_STATUS_LABELS } from "@/lib/utils";

export function OrderStatusBadge({ status }: { status: string }) {
  const config = ORDER_STATUS_LABELS[status] ?? { label: status, color: "bg-gray-700 text-gray-300" };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
}
