import DashboardLayout from "@/components/DashboardLayout";
import type { AdminOverview, AdminTransaction, ErpInvoice, KimaiSummary, LumaGeneration, TransactionType } from "@shared/api";
import { ArrowDownLeft, ArrowUpRight, BarChart3, Boxes, CircleDollarSign, ContactRound, Database, ExternalLink, Film, ReceiptText, RefreshCw, Search, ShoppingCart, Timer, WalletCards } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

type Filter = "all" | TransactionType;

const filters: { label: string; value: Filter }[] = [
  { label: "All activity", value: "all" },
  { label: "Deposits", value: "deposit" },
  { label: "Withdrawals", value: "withdrawal" },
  { label: "Transfers", value: "transfer" },
];

export default function Dashboard() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refreshData() {
    setIsLoading(true);
    try {
      const syncResponse = await fetch("/api/admin/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ limit: 50 }) });
      if (!syncResponse.ok && syncResponse.status !== 503) {
        const syncError = await syncResponse.json() as { message?: string };
        throw new Error(syncError.message ?? "Unable to sync Firefly III");
      }
      setRefreshKey((key) => key + 1);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to sync Firefly III");
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    const params = new URLSearchParams({ limit: "10", type: filter });
    fetch(`/api/admin/overview?${params}`, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json() as AdminOverview & { message?: string };
        if (!response.ok) throw new Error(data.message ?? "Unable to load dashboard");
        setOverview(data);
        setError(null);
      })
      .catch((requestError: Error) => {
        if (requestError.name !== "AbortError") setError(requestError.message);
      })
      .finally(() => setIsLoading(false));

    return () => controller.abort();
  }, [filter, refreshKey]);

  const transactions = overview?.transactions.filter((transaction) => {
    const query = search.toLowerCase();
    return !query || `${transaction.description} ${transaction.counterparty} ${transaction.category}`.toLowerCase().includes(query);
  }) ?? [];
  const income = overview?.transactions.filter((transaction) => transaction.amount > 0).reduce((sum, transaction) => sum + transaction.amount, 0) ?? 0;
  const spending = Math.abs(overview?.transactions.filter((transaction) => transaction.amount < 0).reduce((sum, transaction) => sum + transaction.amount, 0) ?? 0);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5">
        <header className="flex flex-col gap-4 border-b border-[#dce6e2] pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#60766d]"><ShieldIcon /> Admin workspace</div>
            <h1 className="text-3xl font-extrabold tracking-[-0.04em] text-[#00382f]">Good morning, Madi.</h1>
            <p className="mt-1 text-sm text-[#60766d]">Monitor your demo account and review every account transaction.</p>
          </div>
          <button onClick={refreshData} className="flex items-center justify-center gap-2 rounded-xl border border-[#cbdcd3] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#344742]" disabled={isLoading}>
            <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} /> Refresh data
          </button>
        </header>

        {error && <div role="alert" className="rounded-xl border border-[#f0c7c0] bg-[#fff4f1] px-4 py-3 text-sm text-[#9f3e32]">{error}</div>}

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Account balance" value={money(overview?.account.balance ?? 0)} change={overview?.account.name ?? "Loading account..."} icon={WalletCards} />
          <Stat label="Incoming" value={money(income)} change="From current transactions" icon={ArrowDownLeft} />
          <Stat label="Outgoing" value={money(spending)} change="From current transactions" icon={ArrowUpRight} />
          <Stat label="Transactions" value={String(overview?.pagination.total ?? 0)} change={overview ? `Page ${overview.pagination.page}` : "Loading..."} icon={CircleDollarSign} />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
          <div className="rounded-2xl border border-[#dce6e2] bg-white p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div><h2 className="font-bold text-[#344742]">Account activity</h2><p className="mt-1 text-xs text-[#60766d]">Transactions from the Firefly III account endpoint</p></div>
              <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-[#e6f4ed] px-2.5 py-1 text-[11px] font-bold text-[#267153]"><Database size={12} /> {overview?.source ?? "loading"}</span>
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 overflow-x-auto">{filters.map((item) => <button key={item.value} onClick={() => setFilter(item.value)} className={`mr-1 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[11px] font-bold ${filter === item.value ? "bg-[#e6f4ed] text-[#267153]" : "text-[#60766d] hover:bg-[#f4f7f5]"}`}>{item.label}</button>)}</div>
              <label className="flex items-center gap-2 rounded-lg border border-[#dce6e2] px-3 py-2 text-xs text-[#60766d]"><Search size={14} /><input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full min-w-0 bg-transparent outline-none placeholder:text-[#82918d]" placeholder="Search transactions" aria-label="Search transactions" /></label>
            </div>
            <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[620px] text-left"><thead><tr className="border-b border-[#dce6e2] text-[11px] uppercase tracking-[0.12em] text-[#60766d]"><th className="py-3 font-bold">Transaction</th><th className="py-3 font-bold">Category</th><th className="py-3 font-bold">Date</th><th className="py-3 text-right font-bold">Amount</th></tr></thead><tbody className="divide-y divide-[#dce6e2]">{transactions.map((transaction) => <TransactionRow key={transaction.id} transaction={transaction} />)}</tbody></table>{!isLoading && transactions.length === 0 && <p className="py-10 text-center text-sm text-[#60766d]">No transactions match this view.</p>}</div>
          </div>

          <div className="rounded-2xl border border-[#dce6e2] bg-[#267153] p-5 text-white"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-[#b9d3c3]">Account profile</p><h2 className="mt-2 text-2xl font-extrabold tracking-[-0.04em]">{overview?.account.name ?? "Demo account"}</h2></div><WalletCards size={22} className="text-[#d9f36b]" /></div><dl className="mt-8 space-y-4 text-sm"><ProfileRow label="Account type" value={overview?.account.type ?? "asset"} /><ProfileRow label="Currency" value={overview?.account.currency ?? "USD"} /><ProfileRow label="Data source" value={overview?.source ?? "PostgreSQL"} /></dl><div className="mt-8 border-t border-white/10 pt-4 text-xs text-[#b9d3c3]">Admin access · demo organization</div></div>
        </section>
        <PaymentSnapshot />
        <ErpCommandCenter refreshKey={refreshKey} />
        <ConnectedOperations />
      </div>
    </DashboardLayout>
  );
}

type ErpRow = Record<string, string | number | boolean | null>;

function ErpCommandCenter({ refreshKey }: Readonly<{ refreshKey: number }>) {
  const [report, setReport] = useState<Record<string, ErpRow> | null>(null);
  const [records, setRecords] = useState<Record<string, ErpRow[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/erp/report").then((response) => response.ok ? response.json() : null),
      fetch("/api/erp/contacts").then((response) => response.ok ? response.json() : []),
      fetch("/api/erp/products").then((response) => response.ok ? response.json() : []),
      fetch("/api/erp/sales-orders").then((response) => response.ok ? response.json() : []),
      fetch("/api/erp/expenses").then((response) => response.ok ? response.json() : []),
    ]).then(([nextReport, contacts, products, orders, expenses]) => {
      setReport(nextReport);
      setRecords({ contacts, products, orders, expenses });
    }).catch(() => undefined).finally(() => setLoading(false));
  }, [refreshKey]);

  const modules = [
    { key: "contacts", label: "Contacts", icon: ContactRound, count: report?.contacts?.count, accent: "bg-[#e6f4ed] text-[#267153]" },
    { key: "products", label: "Products & stock", icon: Boxes, count: report?.products?.count, accent: "bg-[#e6f4ed] text-[#267153]" },
    { key: "orders", label: "Sales orders", icon: ShoppingCart, count: report?.salesOrders?.count, accent: "bg-[#fff1c9] text-[#9b6a00]" },
    { key: "expenses", label: "Expenses", icon: ReceiptText, count: report?.expenses?.count, accent: "bg-[#f1e9f5] text-[#7a4d88]" },
  ];

  return <section className="rounded-2xl border border-[#dce6e2] bg-[#f7faf8] p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-[#60766d]"><BarChart3 size={14} /> ERP command center</div><h2 className="font-bold text-[#344742]">Every operational module, visible here.</h2><p className="mt-1 text-xs text-[#60766d]">Live records and totals persisted in PostgreSQL.</p></div><Link to="/operations" className="inline-flex items-center gap-2 rounded-xl border border-[#b9d3c3] bg-white px-3.5 py-2.5 text-xs font-bold text-[#267153]">Manage all modules <ExternalLink size={14} /></Link></div><div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{modules.map(({ key, label, icon: Icon, count, accent }) => <div className="rounded-xl border border-[#dce6e2] bg-white p-4" key={key}><div className="flex items-center justify-between"><div className={`flex h-9 w-9 items-center justify-center rounded-xl ${accent}`}><Icon size={17} /></div><span className="text-2xl font-extrabold text-[#1e293b]">{loading ? "--" : String(count ?? 0)}</span></div><p className="mt-4 text-sm font-bold text-[#344742]">{label}</p><p className="mt-1 text-xs text-[#60766d]">{moduleSummary(key, report)}</p></div>)}</div><div className="mt-4 grid gap-4 xl:grid-cols-2"><RecentRecords title="Recent contacts" icon={ContactRound} rows={records.contacts} empty="No contacts created yet." render={(row) => `${text(row.name)} · ${text(row.kind)}`} /><RecentRecords title="Inventory snapshot" icon={Boxes} rows={records.products} empty="No products created yet." render={(row) => `${text(row.name)} · ${text(row.stock_quantity)} ${text(row.unit)}`} /><RecentRecords title="Latest sales orders" icon={ShoppingCart} rows={records.orders} empty="No sales orders created yet." render={(row) => `${text(row.order_number)} · ${text(row.customer_name) || "Walk-in customer"}`} /><RecentRecords title="Latest expenses" icon={ReceiptText} rows={records.expenses} empty="No expenses recorded yet." render={(row) => `${text(row.description)} · ${text(row.category)}`} /></div></section>;
}

function RecentRecords({ title, icon: Icon, rows, empty, render }: Readonly<{ title: string; icon: typeof Boxes; rows?: ErpRow[]; empty: string; render: (row: ErpRow) => string }>) {
  return <div className="rounded-xl border border-[#dce6e2] bg-white p-4"><div className="flex items-center gap-2"><Icon size={16} className="text-[#267153]" /><h3 className="text-sm font-bold text-[#344742]">{title}</h3></div>{!rows?.length ? <p className="mt-4 text-xs text-[#60766d]">{empty}</p> : <div className="mt-3 divide-y divide-[#dce6e2]">{rows.slice(0, 3).map((row, index) => <div className="flex items-center justify-between gap-3 py-2 text-xs" key={text(row.id) || String(index)}><span className="truncate font-semibold text-[#475569]">{render(row)}</span><span className="shrink-0 text-[#82918d]">{formatDate(row.created_at || row.expense_date)}</span></div>)}</div>}</div>;
}

function moduleSummary(key: string, report: Record<string, ErpRow> | null) {
  if (key === "products") return `Stock value ${text(report?.products?.inventory_value) || "0"}`;
  if (key === "orders") return `Value ${text(report?.salesOrders?.value) || "0"}`;
  if (key === "expenses") return `Value ${text(report?.expenses?.value) || "0"}`;
  return "Active records";
}

function text(value: unknown) { return typeof value === "string" || typeof value === "number" ? String(value) : ""; }
function formatDate(value: unknown) { const date = text(value); return date ? new Date(date).toLocaleDateString() : ""; }

function PaymentSnapshot() {
  const [invoices, setInvoices] = useState<ErpInvoice[]>([]);

  useEffect(() => {
    fetch("/api/erp/invoices")
      .then((response) => response.ok ? response.json() as Promise<ErpInvoice[]> : [])
      .then(setInvoices)
      .catch(() => setInvoices([]));
  }, []);

  const paid = invoices.filter((invoice) => invoice.status === "paid").length;
  const open = invoices.filter((invoice) => invoice.status === "open").length;
  const latest = invoices[0];

  return <section className="rounded-2xl border border-[#dce6e2] bg-white p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-[#60766d]"><CircleDollarSign size={14} /> Payment operations</div><h2 className="font-bold text-[#344742]">x402 invoice register</h2><p className="mt-1 text-xs text-[#60766d]">IDR invoices settled in USDC from the demo workspace</p></div><Link to="/erp" className="inline-flex items-center gap-2 rounded-xl bg-[#267153] px-3.5 py-2.5 text-xs font-bold text-white">Open payment desk <ExternalLink size={14} /></Link></div><div className="mt-5 grid gap-3 sm:grid-cols-3"><PaymentMetric label="Open invoices" value={String(open)} tone="amber" /><PaymentMetric label="Settled invoices" value={String(paid)} tone="green" /><PaymentMetric label="Latest invoice" value={latest?.invoiceNumber ?? "No invoices"} tone="lime" /></div>{latest && <div className="mt-4 flex flex-col gap-2 rounded-xl border border-[#dce6e2] bg-[#f7faf8] px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-[#344742]">{latest.description}</p><p className="text-xs text-[#60766d]">{latest.customerName} · {latest.amountUsdc} USDC quote</p></div><span className={`text-xs font-bold capitalize ${latest.status === "paid" ? "text-[#267153]" : "text-[#9b6a00]"}`}>{latest.status}</span></div>}</section>;
}

function PaymentMetric({ label, value, tone }: Readonly<{ label: string; value: string; tone: "amber" | "green" | "lime" }>) {
  const styles = { amber: "bg-[#fff1c9] text-[#9b6a00]", green: "bg-[#e6f4ed] text-[#267153]", lime: "bg-[#f2f8df] text-[#36521c]" };
  return <div className="rounded-xl border border-[#dce6e2] p-3"><div className={`mb-3 flex h-8 w-8 items-center justify-center rounded-lg ${styles[tone]}`}><CircleDollarSign size={15} /></div><p className="text-xs text-[#60766d]">{label}</p><p className="mt-1 truncate text-lg font-extrabold text-[#344742]">{value}</p></div>;
}

function ConnectedOperations() {
  const [kimai, setKimai] = useState<KimaiSummary | null>(null);
  const [luma, setLuma] = useState<LumaGeneration | null>(null);
  const [prompt, setPrompt] = useState("");
  const [lumaMessage, setLumaMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/integrations/kimai/summary")
      .then((response) => response.ok ? response.json() as Promise<KimaiSummary> : null)
      .then(setKimai)
      .catch(() => setKimai(null));
  }, []);

  async function generateWithLuma() {
    if (!prompt.trim()) return setLumaMessage("Enter a prompt first.");
    setBusy(true);
    setLumaMessage("Submitting generation job...");
    try {
      const response = await fetch("/api/integrations/luma/generations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt }) });
      const data = await response.json() as LumaGeneration & { message?: string };
      if (!response.ok) throw new Error(data.message ?? "Unable to start Luma generation");
      setLuma(data);
      setPrompt("");
      setLumaMessage(data.id ? `Job ${data.id} queued.` : "Luma job queued.");
    } catch (error) {
      setLumaMessage(error instanceof Error ? error.message : "Unable to start Luma generation");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!luma?.id || luma.state === "completed" || luma.state === "failed") return;
    const timer = window.setInterval(() => {
      fetch(`/api/integrations/luma/generations/${luma.id}`)
        .then((response) => response.ok ? response.json() as Promise<LumaGeneration> : null)
        .then((data) => data && setLuma(data))
        .catch(() => undefined);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [luma]);

  return <section className="grid gap-4 xl:grid-cols-[1fr_1.2fr]"><div className="rounded-2xl border border-[#dce6e2] bg-white p-5"><div className="flex items-start justify-between"><div><div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-[#60766d]"><Timer size={14} /> Kimai</div><h2 className="font-bold text-[#344742]">Team time pulse</h2><p className="mt-1 text-xs text-[#60766d]">Live work hours from your Kimai workspace</p></div><span className="rounded-full bg-[#e6f4ed] px-2.5 py-1 text-[11px] font-bold text-[#267153]">{kimai?.configured ? "connected" : "not configured"}</span></div><p className="mt-7 text-4xl font-extrabold tracking-[-0.05em] text-[#1e293b]">{kimai?.totalHours ?? "--"}<span className="ml-2 text-sm font-semibold tracking-normal text-[#60766d]">hours tracked</span></p><div className="mt-5 flex items-center justify-between border-t border-[#dce6e2] pt-3 text-xs text-[#60766d]"><span>{kimai?.count ?? 0} time entries</span><span>{kimai?.timesheets[0]?.project ?? "Awaiting Kimai data"}</span></div></div><div className="rounded-2xl border border-[#dce6e2] bg-[#f7faf8] p-5"><div className="flex items-start justify-between"><div><div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-[#60766d]"><Film size={14} /> Luma AI</div><h2 className="font-bold text-[#344742]">Creative operations</h2><p className="mt-1 text-xs text-[#60766d]">Generate a visual brief or payment campaign asset</p></div><span className="rounded-full bg-[#f1e9f5] px-2.5 py-1 text-[11px] font-bold text-[#7a4d88]">{luma?.state ?? "ready"}</span></div><div className="mt-4 flex gap-2"><input value={prompt} onChange={(event) => setPrompt(event.target.value)} className="min-w-0 flex-1 rounded-lg border border-[#cbdcd3] bg-white px-3 py-2 text-sm outline-none" placeholder="e.g. Payment settled scene for Jakarta team" aria-label="Luma prompt" /><button type="button" onClick={generateWithLuma} disabled={busy} className="rounded-lg bg-[#267153] px-3 py-2 text-xs font-bold text-white">{busy ? "Sending" : "Generate"}</button></div>{lumaMessage && <p className="mt-3 text-xs text-[#267153]">{lumaMessage}</p>}{luma?.videoUrl && <video controls className="mt-4 w-full rounded-xl" src={luma.videoUrl}><track kind="captions" /></video>}</div></section>;
}

function TransactionRow({ transaction }: Readonly<{ transaction: AdminTransaction }>) {
  const positive = transaction.amount >= 0;
  return <tr><td className="py-3 pr-4"><p className="font-semibold text-[#344742]">{transaction.description}</p><p className="mt-0.5 text-xs text-[#60766d]">{transaction.counterparty}</p></td><td className="py-3 pr-4 text-xs text-[#60766d]">{transaction.category}</td><td className="py-3 pr-4 text-xs text-[#60766d]">{new Date(transaction.date).toLocaleDateString()}</td><td className={`py-3 text-right text-sm font-bold ${positive ? "text-[#267153]" : "text-[#9f3e32]"}`}>{positive ? "+" : ""}{money(transaction.amount)}</td></tr>;
}

function Stat({ label, value, change, icon: Icon }: Readonly<{ label: string; value: string; change: string; icon: typeof WalletCards }>) {
  return <div className="rounded-2xl border border-[#dce6e2] bg-white p-4 shadow-[0_8px_20px_rgba(32,60,50,0.03)]"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e6f4ed] text-[#267153]"><Icon size={17} /></div><p className="mt-4 text-xs font-semibold text-[#60766d]">{label}</p><p className="mt-1 text-2xl font-extrabold tracking-[-0.04em] text-[#1e293b]">{value}</p><p className="mt-1 truncate text-[11px] font-semibold text-[#267153]">{change}</p></div>;
}

function ProfileRow({ label, value }: Readonly<{ label: string; value: string }>) {
  return <div className="flex items-center justify-between border-b border-white/10 pb-3"><dt className="text-[#b9d3c3]">{label}</dt><dd className="font-bold capitalize text-[#d9f36b]">{value}</dd></div>;
}

function ShieldIcon() {
  return <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-[#60766d]" aria-hidden="true" />;
}

function money(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}
