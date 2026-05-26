import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardNav } from "./dashboard-nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/connexion");

  const openTickets = await prisma.supportTicket.count({
    where: { userId: session.user.id, status: { in: ["open", "in_progress"] } },
  });

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <DashboardNav openTickets={openTickets} />
      <div>{children}</div>
    </div>
  );
}
