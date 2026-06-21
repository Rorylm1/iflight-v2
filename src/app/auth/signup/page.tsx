"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import GuestButton from "@/components/GuestButton";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // Email verification disabled - user is signed in immediately
      router.push("/dashboard");
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <h1 className="font-display font-extrabold text-4xl mb-2 text-center text-ink">
          <span className="text-teal">i</span>Flight
        </h1>
        <p className="text-ink-soft text-center mb-8">Create your account</p>

        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block font-ticket text-[11px] uppercase tracking-[0.16em] text-ink-soft mb-1.5"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-pass border border-line rounded-md text-ink placeholder-ink-faint focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block font-ticket text-[11px] uppercase tracking-[0.16em] text-ink-soft mb-1.5"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 bg-pass border border-line rounded-md text-ink placeholder-ink-faint focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal"
              placeholder="••••••••"
            />
            <p className="text-ink-faint text-xs mt-1">Minimum 6 characters</p>
          </div>

          {error && (
            <div className="text-brick text-sm bg-brick/10 border border-brick/30 px-4 py-2 rounded-md">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-teal text-pass font-semibold rounded-md hover:bg-teal-soft transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <p className="text-ink-soft text-center mt-6">
          Already have an account?{" "}
          <Link href="/auth/signin" className="text-teal hover:underline">
            Sign in
          </Link>
        </p>

        {/* Divider + no-signup path */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-line"></div>
          <span className="text-ink-faint font-ticket text-[10px] uppercase tracking-[0.18em]">or</span>
          <div className="flex-1 h-px bg-line"></div>
        </div>
        <GuestButton variant="ghost" />
      </div>
    </main>
  );
}
