"use client";

import { createClient } from "@/lib/supabase";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import type { User } from "@supabase/supabase-js";

interface HeaderProps {
  user: User | null;
}

export default function Header({ user }: HeaderProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const handleSignOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const navItems = [
    { href: "/dashboard", label: "Passes" },
    { href: "/map", label: "Map & Stats" },
  ];

  return (
    <header className="border-b-2 border-ink/80 bg-paper/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <a
            href="/dashboard"
            className="font-display font-extrabold text-2xl tracking-tight text-ink"
          >
            <span className="text-teal">i</span>Flight
          </a>

          {user && (
            <nav className="hidden sm:flex items-center gap-1">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? "bg-teal/10 text-teal"
                      : "text-ink-soft hover:text-ink hover:bg-ink/5"
                  }`}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          )}
        </div>

        {user && (
          <div className="flex items-center gap-4">
            {user.is_anonymous ? (
              <span className="text-[10px] uppercase tracking-[0.14em] font-ticket px-2.5 py-1 rounded-full bg-teal/10 text-teal border border-teal/25">
                Guest mode
              </span>
            ) : (
              <span className="text-ink-soft text-sm hidden md:block font-ticket">
                {user.email}
              </span>
            )}
            <button
              onClick={handleSignOut}
              disabled={loading}
              className="text-sm text-ink-soft hover:text-brick transition-colors disabled:opacity-50"
            >
              {loading ? "..." : user.is_anonymous ? "Exit" : "Sign out"}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
