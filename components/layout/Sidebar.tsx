"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  Bot,
  CheckSquare,
  FileText,
  History,
  LayoutDashboard,
  Megaphone,
  Search,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { RinuLogo } from "@/components/brand/RinuLogo";
import { cn } from "@/lib/utils";

const navGroups = [
  {
    label: null,
    items: [
      { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
      { href: "/dashboard/google", label: "Google Ads", icon: Search },
      { href: "/dashboard/meta", label: "Meta Ads", icon: Megaphone },
      { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Agentes",
    items: [
      { href: "/dashboard/agents", label: "Centro de Agentes", icon: Bot },
      { href: "/dashboard/agents/actions", label: "Aprovações", icon: CheckSquare },
      { href: "/dashboard/agents/skills", label: "Skills", icon: BookOpen },
      { href: "/dashboard/agents/runs", label: "Histórico", icon: History },
      { href: "/dashboard/agents/settings", label: "Controlo", icon: ShieldCheck },
    ],
  },
  {
    label: null,
    items: [
      { href: "/dashboard/reports", label: "Relatórios", icon: FileText },
      { href: "/dashboard/settings", label: "Integrações", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-[#e9ecef] bg-white">
      <div className="border-b border-[#e9ecef] px-6 py-5">
        <Link href="/dashboard" className="flex flex-col gap-1">
          <RinuLogo />
          <span className="text-xs font-medium text-[#6a7178]">Marketing AI</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-4 overflow-y-auto p-3">
        {navGroups.map((group, gi) => (
          <div key={gi} className="space-y-1">
            {group.label && (
              <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-[#9aa3ab]">
                {group.label}
              </p>
            )}
            {group.items.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/dashboard" &&
                  item.href !== "/dashboard/agents" &&
                  pathname.startsWith(item.href + "/"));
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-[#e5eff9] text-[#4080aa]"
                      : "text-[#54606b] hover:bg-[#f8f9fa] hover:text-[#272b30]"
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="border-t border-[#e9ecef] p-4">
        <Link
          href="/onboarding"
          className="text-xs font-medium text-[#5cb7f3] hover:text-[#4e9ccf]"
        >
          Rever configuração inicial
        </Link>
      </div>
    </aside>
  );
}
