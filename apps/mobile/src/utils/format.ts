export function formatPrice(price: number): string {
  return `${price.toFixed(2)} TND`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "En attente",
    processing: "En cours",
    delivered: "Livré",
    cancelled: "Annulé",
    refunded: "Remboursé",
    open: "Ouvert",
    in_progress: "En cours",
    resolved: "Résolu",
    closed: "Fermé",
    paid: "Payé",
    failed: "Échoué",
  };
  return labels[status] ?? status;
}

export function statusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: "#facc15",
    processing: "#60a5fa",
    delivered: "#4ade80",
    cancelled: "#f87171",
    refunded: "#f87171",
    open: "#60a5fa",
    in_progress: "#a78bfa",
    resolved: "#4ade80",
    closed: "#6b7280",
    paid: "#4ade80",
    failed: "#f87171",
  };
  return colors[status] ?? "#9ca3af";
}
