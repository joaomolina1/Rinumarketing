"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface TopBarProps {
  userEmail?: string;
}

export function TopBar({ userEmail }: TopBarProps) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-[#e9ecef] bg-white px-6">
      <p className="text-sm text-[#6a7178]">Dashboard de marketing com agentes IA</p>
      <div className="flex items-center gap-4">
        {userEmail && (
          <span className="text-sm text-[#54606b]">{userEmail}</span>
        )}
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="size-4" />
          Sair
        </Button>
      </div>
    </header>
  );
}
