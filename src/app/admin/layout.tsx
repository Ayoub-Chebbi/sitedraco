import Link from "next/link";
import { auth } from "@/lib/auth";
import { LayoutDashboard, ShoppingBag, Package, Users, ImageIcon, Ticket, Sparkles } from "lucide-react";

const ADMIN_NAV = [
  { href: "/admin",             label: "Dashboard",      icon: LayoutDashboard },
  { href: "/admin/commandes",   label: "Commandes",      icon: ShoppingBag },
  { href: "/admin/tickets",     label: "Tickets",        icon: Ticket },
  { href: "/admin/produits",    label: "Produits",       icon: Package },
  { href: "/admin/utilisateurs",label: "Clients",        icon: Users },
  { href: "/admin/hero",        label: "Hero Carrousel", icon: ImageIcon },
];

const SUPPORT_NAV = [
  { href: "/admin/commandes",   label: "Commandes",      icon: ShoppingBag },
  { href: "/admin/tickets",     label: "Tickets",        icon: Ticket },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const isAdmin = session?.user.role === "admin";
  const nav = isAdmin ? ADMIN_NAV : SUPPORT_NAV;

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <aside className="w-56 shrink-0 border-r border-gray-800 bg-gray-950 hidden md:block">
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-400" />
            <div>
              <p className="text-sm font-semibold text-white">Administration</p>
              <p className="text-xs text-gray-600 capitalize">{session?.user.role}</p>
            </div>
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
  );
}
