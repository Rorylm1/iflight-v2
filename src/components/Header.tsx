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
    { href: "/dashboard", label: "Flights", icon: "✈️" },
    { href: "/map", label: "Map & Stats", icon: "🌍" },
  ];

  return (
    <header className="border-b border-gray-800 bg-gray-950/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <a href="/dashboard" className="text-xl font-bold">
            <span className="text-amber">i</span>Flight
          </a>

          {user && (
            <nav className="hidden sm:flex items-center gap-1">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                    pathname === item.href
                      ? "bg-amber/10 text-amber"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </a>
              ))}
            </nav>
          )}
        </div>

        {user && (
          <div className="flex items-center gap-4">
            {user.is_anonymous ? (
              <span className="text-xs px-2 py-1 rounded-full bg-amber/10 text-amber border border-amber/20">
                Guest mode
              </span>
            ) : (
              <span className="text-gray-400 text-sm hidden md:block">
                {user.email}
              </span>
            )}
            <button
              onClick={handleSignOut}
              disabled={loading}
              className="text-sm text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            >
              {loading ? "..." : user.is_anonymous ? "Exit" : "Sign out"}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
