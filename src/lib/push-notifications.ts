import { prisma } from "./prisma";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

interface PushMessage {
  to: string;
  title: string;
  body: string;
  sound: string;
  data?: Record<string, unknown>;
  channelId?: string;
  priority?: "default" | "normal" | "high";
}

async function sendExpoPush(messages: PushMessage[]) {
  if (messages.length === 0) return;
  try {
    await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(messages),
      signal: AbortSignal.timeout(5_000),
    });
  } catch (err) {
    console.error("[push] Failed to send Expo push:", err);
  }
}

export async function notifyAdminsNewOrder(params: {
  orderNumber: string;
  clientEmail: string;
  clientName?: string | null;
  itemNames: string[];
  totalAmount: number;
  orderId: string;
}) {
  const admins = await prisma.user.findMany({
    where: { role: "admin", pushToken: { not: null } },
    select: { pushToken: true },
  });

  if (admins.length === 0) return;

  const client = params.clientName ?? params.clientEmail;
  const items = params.itemNames.slice(0, 2).join(", ") +
    (params.itemNames.length > 2 ? ` +${params.itemNames.length - 2}` : "");

  const messages: PushMessage[] = admins.map((admin) => ({
    to: admin.pushToken!,
    title: `💰 Nouvelle commande #${params.orderNumber}`,
    body: `${client} — ${items} · ${params.totalAmount.toFixed(2)} TND`,
    sound: "ching.wav",
    channelId: "new-orders",
    priority: "high",
    data: {
      type: "new_order",
      orderId: params.orderId,
      orderNumber: params.orderNumber,
    },
  }));

  await sendExpoPush(messages);
}

export async function notifySupportNewTicket(params: {
  ticketId: string;
  subject: string;
  fromEmail: string;
  fromName?: string | null;
}) {
  // Notify admins + support agents who have push tokens
  const staff = await prisma.user.findMany({
    where: { role: { in: ["admin", "support"] }, pushToken: { not: null } },
    select: { pushToken: true },
  });

  if (staff.length === 0) return;

  const from = params.fromName ?? params.fromEmail;

  const messages: PushMessage[] = staff.map((s) => ({
    to: s.pushToken!,
    title: "🎫 Nouveau ticket support",
    body: `${from} — ${params.subject}`,
    sound: null,
    channelId: "tickets",
    priority: "normal",
    data: {
      type: "new_ticket",
      ticketId: params.ticketId,
    },
  }));

  await sendExpoPush(messages);
}
