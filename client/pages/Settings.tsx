import React, { useState } from "react";

export default function Settings() {
  const sessionUser = readSessionUser();
  const savedProfile = readSavedProfile();
  const [name, setName] = useState(savedProfile?.name ?? sessionUser?.name ?? "");
  const [email, setEmail] = useState(savedProfile?.email ?? sessionUser?.email ?? "");
  const [timezone, setTimezone] = useState(savedProfile?.timezone ?? "UTC");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const profile = { name, email, timezone };
    localStorage.setItem("finance_profile", JSON.stringify(profile));
    if (sessionUser) {
      const nextUser = { ...sessionUser, name, email };
      const storage = localStorage.getItem("finance_user") || localStorage.getItem("flare_user") ? localStorage : sessionStorage;
      storage.setItem("finance_user", JSON.stringify(nextUser));
      localStorage.removeItem("flare_user");
      sessionStorage.removeItem("flare_user");
      window.dispatchEvent(new CustomEvent("finance:profile-updated", { detail: nextUser }));
    }
    setMessage("Profile updated.");
  };

  return (
    <div className="w-full max-w-2xl">
      <h1 className="mb-1 text-2xl font-extrabold text-[#00382f]">Edit profile</h1>
      <p className="mb-4 text-sm text-[#60766d]">Update your account details and timezone.</p>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg border">
        {message && <p role="status" className="rounded-lg border border-[#d9eab9] bg-[#f2f8df] px-3 py-2 text-sm text-[#36521c]">{message}</p>}
        <div>
          <label className="block text-sm font-medium text-[#304d43]">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full rounded border border-[#cbdcd3] px-3 py-2 outline-none focus:border-[#7fb735] focus:ring-2 focus:ring-[#d9eab9]" />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#304d43]">Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="mt-1 block w-full rounded border border-[#cbdcd3] px-3 py-2 outline-none focus:border-[#7fb735] focus:ring-2 focus:ring-[#d9eab9]" />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#304d43]">Timezone</label>
          <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="mt-1 block w-full rounded border border-[#cbdcd3] px-3 py-2 outline-none focus:border-[#7fb735] focus:ring-2 focus:ring-[#d9eab9]">
            <option>UTC</option>
            <option>America/New_York</option>
            <option>Europe/London</option>
            <option>Asia/Jakarta</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" className="rounded-lg bg-[#00382f] px-4 py-2 font-semibold text-white hover:bg-[#075443]">Save profile</button>
          <button type="button" onClick={() => { setName(sessionUser?.name ?? ""); setEmail(sessionUser?.email ?? ""); setTimezone("UTC"); setMessage(""); }} className="rounded-lg border border-[#cbdcd3] px-4 py-2 font-semibold text-[#344742]">Reset</button>
        </div>
      </form>
    </div>
  );
}

function readSessionUser() {
  const stored = localStorage.getItem("finance_user") ?? sessionStorage.getItem("finance_user") ?? localStorage.getItem("flare_user") ?? sessionStorage.getItem("flare_user");
  if (!stored) return null;
  try {
    const user = JSON.parse(stored) as { name?: string; email?: string };
    return typeof user.name === "string" && typeof user.email === "string" ? user : null;
  } catch {
    return null;
  }
}

function readSavedProfile() {
  const stored = localStorage.getItem("finance_profile") ?? localStorage.getItem("flare_profile");
  if (!stored) return null;
  try {
    return JSON.parse(stored) as { name?: string; email?: string; timezone?: string };
  } catch {
    return null;
  }
}
