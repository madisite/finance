import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, LockKeyhole, Mail, UserRound } from "lucide-react";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !email.trim() || !password || !confirm) {
      setError("Please fill all fields.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await response.json() as { user?: { email: string; name: string; role: string }; message?: string };
      if (!response.ok || !data.user) {
        setError(data.message ?? "Unable to create your account.");
        return;
      }
      localStorage.setItem("finance_user", JSON.stringify(data.user));
      navigate("/dashboard", { replace: true });
    } catch {
      setError("The server is unavailable. Start the app and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f8f5] p-6">
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="w-full max-w-md rounded-2xl border border-[#d9e6df] bg-white p-6 shadow-[0_18px_50px_rgba(0,59,47,0.10)]"
        role="region"
        aria-labelledby="signup-heading"
      >
        <img src="/logo.png" alt="Finance" className="mx-auto mb-5 h-24 w-24 rounded-xl object-cover" />
        <h1 id="signup-heading" className="text-2xl font-extrabold tracking-[-0.03em] text-[#003b2f]">Create an account</h1>
        <p className="mt-1 text-sm text-[#60766d]">Sign up to access Finance</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" aria-live="polite">
          {error && (
            <div role="alert" className="rounded-lg border border-[#f0c7c0] bg-[#fff4f1] p-2 text-sm text-[#9f3e32]">{error}</div>
          )}

          <div>
            <label className="block text-sm font-semibold text-[#304d43]">Full name</label>
            <div className="relative"><UserRound size={16} className="pointer-events-none absolute left-3 top-3 text-[#7fb735]" />
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-[#cbdcd3] py-2 pl-10 pr-3 text-[#003b2f] outline-none transition focus:border-[#7fb735] focus:ring-2 focus:ring-[#d9eab9]"
              placeholder="Your name"
              aria-label="Full name"
              required
            />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#304d43]">Email</label>
            <div className="relative"><Mail size={16} className="pointer-events-none absolute left-3 top-3 text-[#7fb735]" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-[#cbdcd3] py-2 pl-10 pr-3 text-[#003b2f] outline-none transition focus:border-[#7fb735] focus:ring-2 focus:ring-[#d9eab9]"
              placeholder="you@example.com"
              aria-label="Email address"
              required
            />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#304d43]">Password</label>
            <div className="relative"><LockKeyhole size={16} className="pointer-events-none absolute left-3 top-3 text-[#7fb735]" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-[#cbdcd3] py-2 pl-10 pr-3 text-[#003b2f] outline-none transition focus:border-[#7fb735] focus:ring-2 focus:ring-[#d9eab9]"
              placeholder="Create a password"
              aria-label="Password"
              required
            />
            </div>
            <p className="mt-1 text-xs text-[#82918d]">Use at least 8 characters.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#304d43]">Confirm password</label>
            <div className="relative"><LockKeyhole size={16} className="pointer-events-none absolute left-3 top-3 text-[#7fb735]" />
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1 block w-full rounded-md border border-[#cbdcd3] py-2 pl-10 pr-3 text-[#003b2f] outline-none transition focus:border-[#7fb735] focus:ring-2 focus:ring-[#d9eab9]"
              placeholder="Confirm password"
              aria-label="Confirm password"
              required
            />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#003b2f] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#075443] focus:outline-none focus:ring-2 focus:ring-[#b8d978] disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Create account"
            disabled={isLoading}
          >
            {isLoading ? "Creating account..." : <>Create account <ArrowRight size={16} /></>}
          </motion.button>
        </form>

        <div className="mt-4 text-center text-sm text-[#60766d]">
          Already have an account? <a href="/signin" className="font-semibold text-[#4e7e20] hover:underline">Sign in</a>
        </div>
      </motion.div>
    </div>
  );
}
