import { useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  FileCheck2,
  LockKeyhole,
  MoreHorizontal,
  Play,
  Plus,
  ShieldCheck,
  Sparkles,
  ToggleLeft,
  WalletCards,
} from "lucide-react";

const forecast = [
  { day: "Today", value: 63, amount: "$148k" },
  { day: "Fri 20", value: 69, amount: "$162k" },
  { day: "Mon 23", value: 57, amount: "$134k" },
  { day: "Tue 24", value: 74, amount: "$174k" },
  { day: "Wed 25", value: 61, amount: "$143k" },
  { day: "Thu 26", value: 82, amount: "$193k" },
  { day: "Fri 27", value: 72, amount: "$169k" },
];

const activity = [
  { icon: ArrowUpRight, label: "Moved reserve to USYC", detail: "$42,800 · Reserve sweep", time: "8 min ago", tone: "text-emerald-700 bg-emerald-50" },
  { icon: FileCheck2, label: "Milestone verified", detail: "Maya Chen · API integration", time: "34 min ago", tone: "text-sky-700 bg-sky-50" },
  { icon: ArrowDownRight, label: "Payroll redemption queued", detail: "$18,400 · Due tomorrow", time: "1 hr ago", tone: "text-amber-700 bg-amber-50" },
];

export default function Index() {
  const [activeTab, setActiveTab] = useState("Overview");
  const [automationOn, setAutomationOn] = useState(true);
  const [simulated, setSimulated] = useState(false);

  return (
    <div className="min-h-[calc(100vh-8rem)] text-[#182321]">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#5b716b]"><Sparkles size={14} /> Treasury control room</div>
          <h1 className="max-w-2xl text-4xl font-extrabold tracking-[-0.04em] text-[#182321] sm:text-5xl">Let your cash do the work.</h1>
          <p className="mt-3 max-w-xl text-base leading-7 text-[#62736f]">Northstar watches your ledger, forecasts every obligation, and moves idle capital while keeping every decision reviewable.</p>
        </div>
        <div className="flex items-center gap-3"><button className="flex items-center gap-2 rounded-xl border border-[#d9e3df] bg-white px-4 py-2.5 text-sm font-semibold text-[#344742] shadow-sm"><LockKeyhole size={15} /> Review log</button><button className="flex items-center gap-2 rounded-xl bg-[#d9f36b] px-4 py-2.5 text-sm font-bold text-[#18301f] shadow-[0_6px_20px_rgba(170,210,73,0.22)]"><Plus size={16} /> New rule</button></div>
      </div>

      <nav className="mt-9 flex gap-6 border-b border-[#dce6e2] text-sm font-semibold" aria-label="Treasury views">{["Overview", "Automations", "Ledger", "Payouts"].map((tab) => <button key={tab} onClick={() => setActiveTab(tab)} className={`border-b-2 pb-3 transition ${activeTab === tab ? "border-[#183f35] text-[#183f35]" : "border-transparent text-[#82918d] hover:text-[#344742]"}`}>{tab}</button>)}</nav>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Available cash" value="$286,420" change="+12.8%" icon={WalletCards} accent="bg-[#e6f4ed] text-[#267153]" /><Metric label="Yield this month" value="$1,842.16" change="+8.4%" icon={CircleDollarSign} accent="bg-[#fff1c9] text-[#9b6a00]" /><Metric label="Next obligation" value="$18,400" change="Tomorrow · payroll" icon={Clock3} accent="bg-[#e7f0f6] text-[#3d6d87]" /><Metric label="Runway" value="47 days" change="Healthy buffer" icon={ShieldCheck} accent="bg-[#f1e9f5] text-[#7a4d88]" /></section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <div className="overflow-hidden rounded-2xl border border-[#dce6e2] bg-white shadow-[0_12px_30px_rgba(32,60,50,0.04)]"><div className="flex flex-col gap-3 border-b border-[#edf1ef] p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-bold text-[#20332f]">Cash forecast</h2><p className="mt-1 text-xs text-[#82918d]">Projected available balance · next 7 days</p></div><div className="flex items-center gap-2 text-xs font-semibold text-[#5b716b]"><span className="h-2 w-2 rounded-full bg-[#82bf61]" /> Above reserve threshold</div></div><div className="p-5"><div className="flex h-48 items-end gap-2 sm:gap-4">{forecast.map((item, index) => <div key={item.day} className="group flex h-full flex-1 flex-col justify-end gap-2 text-center"><div className="relative flex flex-1 items-end justify-center"><div className={`w-full max-w-12 rounded-t-lg transition-all duration-500 group-hover:bg-[#b4df59] ${index === 0 ? "bg-[#183f35]" : "bg-[#dcefd0]"}`} style={{ height: `${item.value}%` }}><span className="absolute -top-6 left-1/2 hidden -translate-x-1/2 text-[11px] font-bold text-[#456058] group-hover:block">{item.amount}</span></div></div><span className="text-[10px] font-semibold text-[#82918d] sm:text-xs">{item.day}</span></div>)}</div><div className="mt-5 flex items-center justify-between border-t border-[#edf1ef] pt-4"><span className="text-xs text-[#82918d]">Minimum operating reserve <strong className="text-[#344742]">$120,000</strong></span><button className="flex items-center gap-1 text-xs font-bold text-[#267153]">View forecast <ChevronRight size={14} /></button></div></div></div>
        <div className="rounded-2xl border border-[#dce6e2] bg-[#183f35] p-5 text-white shadow-[0_12px_30px_rgba(32,60,50,0.08)]"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#a7c9af]">Active automation</p><h2 className="mt-2 text-xl font-bold">Idle cash sweep</h2></div><button onClick={() => setAutomationOn(!automationOn)} aria-label="Toggle idle cash sweep" className="text-[#d9f36b]">{automationOn ? <ToggleLeft size={32} className="rotate-180" /> : <ToggleLeft size={32} />}</button></div><p className="mt-5 max-w-sm text-sm leading-6 text-[#c0d4c8]">Keep 14 days of payroll liquid. Put the rest to work in USYC, and redeem 24 hours before a known obligation.</p><div className="mt-6 rounded-xl border border-white/10 bg-white/10 p-3"><div className="flex items-center justify-between text-xs"><span className="text-[#a7c9af]">Current sweepable balance</span><span className="font-bold text-[#d9f36b]">$42,800</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[68%] rounded-full bg-[#d9f36b]" /></div></div><button onClick={() => setSimulated(true)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#d9f36b] py-3 text-sm font-bold text-[#18301f]"><Play size={15} fill="currentColor" /> {simulated ? "Simulation ready" : "Simulate next sweep"}</button></div>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr]"><div className="rounded-2xl border border-[#dce6e2] bg-white p-5"><div className="flex items-center justify-between"><div><h2 className="font-bold">Decision log</h2><p className="mt-1 text-xs text-[#82918d]">Signed activity across your financial stack</p></div><button aria-label="More decision log options" className="text-[#82918d]"><MoreHorizontal size={20} /></button></div><div className="mt-5 space-y-4">{activity.map(({ icon: Icon, label, detail, time, tone }) => <div key={label} className="flex items-center gap-3"><div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tone}`}><Icon size={16} /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-[#344742]">{label}</p><p className="truncate text-xs text-[#82918d]">{detail}</p></div><span className="shrink-0 text-[11px] text-[#9aa7a3]">{time}</span></div>)}</div><button className="mt-5 flex items-center gap-1 text-xs font-bold text-[#267153]">Open full ledger <ChevronRight size={14} /></button></div><div className="rounded-2xl border border-[#dce6e2] bg-[#f7faf8] p-5"><div className="flex items-center justify-between"><div><h2 className="font-bold">Upcoming payouts</h2><p className="mt-1 text-xs text-[#82918d]">Milestones verified, funds ready</p></div><button className="flex items-center gap-1 text-xs font-bold text-[#267153]">See all <ChevronRight size={14} /></button></div><div className="mt-5 space-y-3"><Payout name="Maya Chen" role="API integration" amount="$4,200" date="Today" initials="MC" /><Payout name="Studio North" role="Brand system v2" amount="$8,750" date="Sep 22" initials="SN" /><Payout name="Jon Bell" role="QA milestone" amount="$1,680" date="Sep 24" initials="JB" /></div></div></section>
    </div>
  );
}

function Metric({ label, value, change, icon: Icon, accent }: { label: string; value: string; change: string; icon: typeof Banknote; accent: string }) { return <div className="rounded-2xl border border-[#dce6e2] bg-white p-4 shadow-[0_8px_20px_rgba(32,60,50,0.03)]"><div className="flex items-start justify-between"><div className={`flex h-9 w-9 items-center justify-center rounded-xl ${accent}`}><Icon size={17} /></div><ArrowUpRight size={15} className="text-[#82bf61]" /></div><p className="mt-4 text-xs font-semibold text-[#82918d]">{label}</p><p className="mt-1 text-2xl font-extrabold tracking-[-0.04em] text-[#20332f]">{value}</p><p className="mt-1 text-[11px] font-semibold text-[#5e9271]">{change}</p></div>; }

function Payout({ name, role, amount, date, initials }: { name: string; role: string; amount: string; date: string; initials: string }) { return <div className="flex items-center gap-3 rounded-xl border border-[#e4ece8] bg-white p-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#dcefd0] text-xs font-bold text-[#386744]">{initials}</div><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-[#344742]">{name}</p><p className="truncate text-xs text-[#82918d]">{role}</p></div><div className="text-right"><p className="text-sm font-bold text-[#344742]">{amount}</p><p className="text-[11px] text-[#82918d]">{date}</p></div><Check size={15} className="text-[#72aa61]" /></div>; }
