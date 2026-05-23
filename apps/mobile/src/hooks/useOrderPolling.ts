import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/auth";
import { useNewOrderAlertStore } from "@/store/newOrderAlert";
import { api } from "@/api/client";
import { scheduleChingSound } from "@/lib/notifications";

const POLL_INTERVAL_MS = 12_000;

type SlimOrder = {
  orderNumber: string;
  totalAmount: number;
  createdAt: string;
  user?: { name?: string | null; email: string } | null;
  guestEmail?: string | null;
  items: { product: { name: string } }[];
};

export function useOrderPolling() {
  const user = useAuthStore((s) => s.user);
  const show = useNewOrderAlertStore((s) => s.show);
  const sinceRef = useRef<string>(new Date().toISOString());

  useEffect(() => {
    if (user?.role !== "admin") return;

    // Reset cursor to now so pre-existing orders don't fire alerts.
    sinceRef.current = new Date().toISOString();

    async function poll() {
      try {
        const since = encodeURIComponent(sinceRef.current);
        const data = await api.get<{ orders: SlimOrder[] }>(
          `/api/mobile/admin/orders?since=${since}`
        );
        const orders = data?.orders ?? [];
        if (orders.length === 0) return;

        // Advance cursor so we don't re-alert the same order.
        sinceRef.current = orders[0].createdAt;

        const newest = orders[0];
        const clientLabel =
          newest.user?.name ??
          newest.user?.email ??
          newest.guestEmail ??
          "Client";
        const items = newest.items.map((i) => i.product.name).slice(0, 2).join(", ");

        // Show the in-app banner.
        show({ orderNumber: newest.orderNumber, clientLabel, items, total: newest.totalAmount });

        // Play ching via a silent local notification — the OS reads the sound
        // from the "new-orders" channel (ching.wav) without showing a banner
        // (setNotificationHandler sets shouldShowAlert: false).
        scheduleChingSound();
      } catch {
        // network error — retry on next tick
      }
    }

    // Immediate first poll + regular interval.
    poll();
    const id = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [user?.id, user?.role]);
}
