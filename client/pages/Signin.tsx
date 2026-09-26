import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, LockKeyhole, Mail } from "lucide-react";

export default function Signin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json() as { user?: { email: string; name: string; role: string }; message?: string };
      if (!response.ok || !data.user) {
        setError(data.message ?? "Unable to sign in");
        return;
      }

      localStorage.removeItem("finance_user");
      sessionStorage.removeItem("finance_user");
      localStorage.removeItem("flare_user");
      sessionStorage.removeItem("flare_user");
      const storage = remember ? localStorage : sessionStorage;
      storage.setItem("finance_user", JSON.stringify(data.user));
      navigate("/dashboard", { replace: true });
    } catch {
      setError("The server is unavailable. Start the app and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f8f5] p-6">
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="w-full max-w-md rounded-2xl border border-[#d9e6df] bg-white p-6 shadow-[0_18px_50px_rgba(0,59,47,0.10)]"
        role="region"
        aria-labelledby="signin-heading"
      >
        <img src="/logo.png" alt="Finance" className="mx-auto mb-5 h-24 w-24 rounded-xl object-cover" />
        <h1 id="signin-heading" className="text-2xl font-extrabold tracking-[-0.03em] text-[#00382f]">Sign in</h1>
        <p className="mt-1 text-sm text-[#60766d]">Access your Finance admin workspace</p>
        <div className="mt-4 rounded-lg border border-[#d9eab9] bg-[#f2f8df] px-3 py-2 text-xs text-[#36521c]">
          Demo: <strong>demo@example.com</strong> / <strong>demo1234</strong>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" aria-live="polite">
          {error && (
            <div role="alert" className="rounded-lg border border-[#f0c7c0] bg-[#fff4f1] p-2 text-sm text-[#9f3e32]">{error}</div>
          )}

          <div>
            <label className="block text-sm font-semibold text-[#304d43]">Email</label>
            <div className="relative mt-1"><Mail size={16} className="pointer-events-none absolute left-3 top-3 text-[#7fb735]" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full rounded-md border border-[#cbdcd3] py-2 pl-10 pr-3 text-[#00382f] outline-none transition focus:border-[#7fb735] focus:ring-2 focus:ring-[#d9eab9]"
              placeholder="you@example.com"
              aria-label="Email address"
              required
            />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#304d43]">Password</label>
            <div className="relative mt-1"><LockKeyhole size={16} className="pointer-events-none absolute left-3 top-3 text-[#7fb735]" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full rounded-md border border-[#cbdcd3] py-2 pl-10 pr-3 text-[#00382f] outline-none transition focus:border-[#7fb735] focus:ring-2 focus:ring-[#d9eab9]"
              placeholder="demo1234"
              aria-label="Password"
              required
            />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="inline-flex items-center text-sm">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="mr-2" />
              Remember me
            </label>
            <button type="button" className="text-sm font-semibold text-[#4e7e20] hover:underline">Forgot password?</button>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#00382f] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#075443] focus:outline-none focus:ring-2 focus:ring-[#b8d978] disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Sign in"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : <>Sign in <ArrowRight size={16} /></>}
          </motion.button>
        </form>

        <div className="mt-4 text-center text-sm text-[#60766d]">
          Don’t have an account? <Link to="/signup" className="font-semibold text-[#4e7e20] hover:underline">Create one</Link>
        </div>
      </motion.div>
    </div>
  );
}
