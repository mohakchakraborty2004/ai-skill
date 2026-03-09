"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Signup } from "@/actions/auth.action";

export default function SignupPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      await Signup(formData);
      router.push("/getScore");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center font-sans p-6">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="flex items-center gap-3 mb-10 justify-center">
          <div className="w-10 h-10 rounded border-2 border-[#b026ff] flex items-center justify-center bg-black">
            <span className="text-[#b026ff] font-bold text-xs">DI</span>
          </div>
          <h1 className="text-white font-bold tracking-widest text-lg">DEV INSIGHT</h1>
        </div>

        {/* Card */}
        <div className="bg-[#050505] border border-[#1a1a1a] rounded-2xl shadow-2xl p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-[#b026ff] opacity-[0.03] pointer-events-none"></div>

          <h2 className="text-2xl font-bold text-white mb-1 tracking-wide relative z-10">Create account</h2>
          <p className="text-gray-500 mb-8 text-sm relative z-10">Get your skills evaluated by AI.</p>

          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                placeholder="John Doe"
                required
                disabled={loading}
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#222] rounded-lg text-white focus:ring-1 focus:ring-[#b026ff] focus:border-[#b026ff] outline-none transition-all disabled:opacity-50 placeholder:text-gray-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                required
                disabled={loading}
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#222] rounded-lg text-white focus:ring-1 focus:ring-[#b026ff] focus:border-[#b026ff] outline-none transition-all disabled:opacity-50 placeholder:text-gray-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                required
                minLength={6}
                disabled={loading}
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#222] rounded-lg text-white focus:ring-1 focus:ring-[#b026ff] focus:border-[#b026ff] outline-none transition-all disabled:opacity-50 placeholder:text-gray-600"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-950/30 border border-red-900/50 text-red-400 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#b026ff] hover:bg-[#9015d8] text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 shadow-[0_0_15px_rgba(176,38,255,0.2)]"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="text-gray-500 text-sm text-center mt-6 relative z-10">
            Already have an account?{" "}
            <Link href="/login" className="text-[#b026ff] hover:text-[#9015d8] font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
