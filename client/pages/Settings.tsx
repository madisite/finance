import React, { useState } from "react";

export default function Settings() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [timezone, setTimezone] = useState("UTC");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For demo, just save to localStorage
    const profile = { name, email, timezone };
    localStorage.setItem("flare_profile", JSON.stringify(profile));
    alert("Settings saved (demo)");
  };

  return (
    <div className="w-full max-w-2xl">
      <h1 className="text-2xl font-semibold text-slate-900 mb-4">Settings</h1>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg border">
        <div>
          <label className="block text-sm font-medium text-slate-700">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full rounded border px-3 py-2" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="mt-1 block w-full rounded border px-3 py-2" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Timezone</label>
          <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="mt-1 block w-full rounded border px-3 py-2">
            <option>UTC</option>
            <option>America/New_York</option>
            <option>Europe/London</option>
            <option>Asia/Jakarta</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Save</button>
          <button type="button" onClick={() => { setName(""); setEmail(""); setTimezone("UTC"); }} className="px-4 py-2 border rounded">Reset</button>
        </div>
      </form>
    </div>
  );
}
