import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptKey } from "@/lib/crypto";
import { KeysClient } from "./keys-client";

export default async function ClesPage() {
  const session = await auth();
  if (!session) redirect("/connexion");

  const deliveredOrders = await prisma.order.findMany({
    where: { userId: session.user.id, status: "delivered" },
    include: {
      items: {
        include: {
          product: true,
          key: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const keys = deliveredOrders.flatMap((order) =>
    order.items
      .filter((item) => item.key)
      .map((item) => {
        const raw = (() => { try { return decryptKey(item.key!.keyValue) ?? ""; } catch { return ""; } })();
        const isAccount = raw.startsWith("ACCOUNT::");
        let accountEmail = "";
        let accountPassword = "";
        let keyValue = raw;
        if (isAccount) {
          try {
            const json = JSON.parse(raw.slice("ACCOUNT::".length));
            accountEmail = json.email ?? "";
            accountPassword = json.password ?? "";
            keyValue = "";
          } catch { /* leave empty */ }
        }
        return {
          id: item.id,
          productName: item.product.name,
          platform: item.product.platform,
          orderNumber: order.orderNumber,
          deliveredAt: order.updatedAt.toISOString(),
          type: isAccount ? ("account" as const) : ("key" as const),
          keyValue,
          accountEmail,
          accountPassword,
        };
      })
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="text-gray-500 hover:text-gray-300 text-sm">Dashboard</Link>
        <span className="text-gray-700">/</span>
        <h1 className="text-xl font-bold text-white">Mes clés reçues</h1>
      </div>
      <KeysClient keys={keys} />
    </div>
  );
}
