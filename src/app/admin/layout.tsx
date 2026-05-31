import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LayoutDashboard, ShoppingBag, Package, Users, ImageIcon, Ticket, Settings, Tag, Monitor, Sparkles, BadgePercent } from "lucide-react";
import { TicketNotificationBell } from "@/components/admin/TicketNotificationBell";

const ADMIN_NAV = [
  { href: "/admin",              label: "Dashboard",      icon: LayoutDashboard },
  { href: "/admin/commandes",    label: "Commandes",      icon: ShoppingBag },
  { href: "/admin/tickets",      label: "Tickets",        icon: Ticket },
  { href: "/admin/produits",     label: "Produits",       icon: Package },
  { href: "/admin/utilisateurs", label: "Clients",        icon: Users },
  { href: "/admin/coupons",       label: "Coupons",        icon: BadgePercent },
  { href: "/admin/categories",   label: "Catégories",     icon: Tag },
  { href: "/admin/platforms",    label: "Plateformes",    icon: Monitor },
  { href: "/admin/hero",         label: "Hero Carrousel", icon: ImageIcon },
  { href: "/admin/settings",     label: "Paramètres",     icon: Settings },
];

const SUPPORT_NAV = [
  { href: "/admin/commandes",   label: "Commandes",      icon: ShoppingBag },
  { href: "/admin/tickets",     label: "Tickets",        icon: Ticket },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || !["admin", "support"].includes(session.user.role ?? "")) {
    redirect("/connexion");
  }
  const isAdmin = session!.user.role === "admin";
  const nav = isAdmin ? ADMIN_NAV : SUPPORT_NAV;

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Mobile top nav — scrollable, shown on small screens */}
      <div className="md:hidden border-b border-gray-800 bg-gray-950 overflow-x-auto">
        <div className="flex items-center gap-1 px-2 py-2 min-w-max">
          <div className="flex items-center gap-2 px-2 py-1 mr-2 border-r border-gray-800 shrink-0">
            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            <span className="text-xs font-semibold text-white capitalize">{session?.user.role}</span>
            <TicketNotificationBell />
          </div>
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-gray-800 transition-colors whitespace-nowrap shrink-0"
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              {label}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <aside className="w-56 shrink-0 border-r border-gray-800 bg-gray-950 hidden md:block">
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-400" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">Administration</p>
                <p className="text-xs text-gray-600 capitalize">{session?.user.role}</p>
              </div>
              <TicketNotificationBell />
            </div>
          </div>
          <nav className="p-2 space-y-0.5">
            {nav.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
