import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NewTicketForm } from "./new-ticket-form";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default async function NewTicketPage() {
  const session = await auth();
  if (!session) redirect("/connexion");

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    select: { id: true, orderNumber: true, status: true, totalAmount: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-6">
        <Link href="/dashboard" className="hover:text-gray-300">Mon compte</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/dashboard/support" className="hover:text-gray-300">Support</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-gray-300">Nouveau ticket</span>
      </nav>
      <h1 className="text-2xl font-bold text-white mb-6">Créer un ticket</h1>
      <NewTicketForm orders={orders} />
    </div>
  );
}
