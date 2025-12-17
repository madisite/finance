import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function Signin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    // Demo auth: store user and redirect
    const user = { email };
    if (remember) localStorage.setItem("flare_user", JSON.stringify(user));
    else sessionStorage.setItem("flare_user", JSON.stringify(user));

    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="w-full max-w-md bg-white rounded-xl shadow-lg border p-6"
        role="region"
        aria-labelledby="signin-heading"
      >
        <h1 id="signin-heading" className="text-2xl font-semibold text-slate-900">Sign in</h1>
        <p className="mt-1 text-sm text-slate-600">Access your Flare account</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" aria-live="polite">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 p-2 rounded">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="you@example.com"
              aria-label="Email address"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="••••••••"
              aria-label="Password"
              required
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="inline-flex items-center text-sm">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="mr-2" />
              Remember me
            </label>
            <a className="text-sm text-indigo-600 hover:underline" href="#">Forgot password?</a>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full inline-flex justify-center items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Sign in"
          >
            Sign in
          </motion.button>
        </form>

        <div className="mt-4 text-sm text-center text-slate-600">
          Don’t have an account? <a href="/signup" className="text-indigo-600 hover:underline">Create one</a>
        </div>
      </motion.div>
    </div>
  );
}
