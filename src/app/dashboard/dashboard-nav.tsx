"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, Key, MessageCircle, User } from "lucide-react";

type NavItem = { href: string; label: string; icon: React.ElementType; badge?: number };

export function DashboardNav({ openTickets }: { openTickets: number }) {
  const pathname = usePathname();

  const items: NavItem[] = [
    { href: "/dashboard",           label: "Tableau de bord", icon: LayoutDashboard },
    { href: "/dashboard/commandes", label: "Commandes",       icon: Package },
    { href: "/dashboard/cles",      label: "Mes clés",        icon: Key },
    { href: "/dashboard/support",   label: "Support",         icon: MessageCircle, badge: openTickets },
    { href: "/dashboard/profil",    label: "Mon profil",      icon: User },
  ];

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <nav className="border-b border-gray-800 bg-gray-950">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex gap-1 overflow-x-auto scrollbar-none">
          {items.map(({ href, label, icon: Icon, badge }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-3 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  active
                    ? "border-purple-500 text-white"
                    : "border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-600"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">{label}</span>
                {badge !== undefined && badge > 0 && (
                  <span className="ml-0.5 bg-purple-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center shrink-0">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
