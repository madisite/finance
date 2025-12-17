import DashboardLayout from "@/components/DashboardLayout";
import { DemoResponse } from "@shared/api";
import { useEffect, useState, useMemo } from "react";
import { Users, DollarSign, Activity } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

function ResponsiveChart() {
  const data = useMemo(() => {
    const arr = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const label = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      // deterministic sample values (could be replaced with real API data)
      const value = Math.round(800 + Math.sin(i / 2) * 120 + i * 8);
      arr.push({ date: label, value });
    }
    return arr;
  }, []);

  return (
    <ResponsiveContainer width="100%" height="100%" aria-label="Weekly traffic chart">
      <LineChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(2,6,23,0.04)" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Line type="monotone" dataKey="value" stroke="#6366F1" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default function Dashboard() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async function () {
      try {
        const res = await fetch("/api/demo");
        const data = (await res.json()) as DemoResponse;
        setMessage(data.message);
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-600">Overview & quick stats</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-slate-600 hidden sm:block">{message}</div>
          <button className="px-3 py-1 bg-indigo-600 text-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">New report</button>
        </div>
      </div>

      <section className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white border rounded-lg shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-indigo-50 rounded-md text-indigo-600">
              <Users size={20} aria-hidden />
            </div>
            <div className="flex-1">
              <div className="text-sm text-slate-500">Users</div>
              <div className="mt-1 text-2xl font-bold text-slate-900">1,234</div>
              <div className="mt-2 text-xs text-green-600">▲ 4.2% since last week</div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white border rounded-lg shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-50 rounded-md text-emerald-600">
              <DollarSign size={20} aria-hidden />
            </div>
            <div className="flex-1">
              <div className="text-sm text-slate-500">Revenue</div>
              <div className="mt-1 text-2xl font-bold text-slate-900">$12.3k</div>
              <div className="mt-2 text-xs text-red-600">▼ 1.1% since last week</div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white border rounded-lg shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-pink-50 rounded-md text-pink-600">
              <Activity size={20} aria-hidden />
            </div>
            <div className="flex-1">
              <div className="text-sm text-slate-500">Active</div>
              <div className="mt-1 text-2xl font-bold text-slate-900">87%</div>
              <div className="mt-2 text-xs text-green-600">▲ 0.8% since last week</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white border rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-slate-900">Weekly traffic</h2>
            <div className="text-sm text-slate-500">Last 7 days</div>
          </div>
            <div className="mt-4 h-48 rounded-md border-dashed border-0 border-slate-100">
              <div className="h-48">
                {/* Recharts responsive chart showing last 7 days */}
                <ResponsiveChart />
              </div>
            </div>
        </div>

        <aside className="bg-white border rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-medium text-slate-900">Recent activity</h3>
          <ul className="mt-3 space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">A</div>
              <div>
                <div className="text-slate-800">Anna created a new report</div>
                <div className="text-xs text-slate-500">2 hours ago</div>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">$</div>
              <div>
                <div className="text-slate-800">Payment received</div>
                <div className="text-xs text-slate-500">6 hours ago</div>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600">!</div>
              <div>
                <div className="text-slate-800">Server restarted</div>
                <div className="text-xs text-slate-500">Yesterday</div>
              </div>
            </li>
          </ul>

          <div className="mt-4">
            <a className="text-sm text-indigo-600 hover:underline" href="#">View all activity</a>
          </div>
        </aside>
      </section>
    </DashboardLayout>
  );
}
