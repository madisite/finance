import { useEffect, useState } from "react";
import { BarChart3, BookOpen, Boxes, ContactRound, FilePlus2, Pencil, ReceiptText, RefreshCw, Search, ShoppingCart, Trash2, TrendingUp, X } from "lucide-react";

type Section = "report" | "contacts" | "products" | "orders" | "expenses";
type Row = Record<string, string | number | boolean | null>;

export default function Operations() {
  const [section, setSection] = useState<Section>("report");
  const [rows, setRows] = useState<Row[]>([]);
  const [report, setReport] = useState<Record<string, Row> | null>(null);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const [refresh, setRefresh] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);

  useEffect(() => {
    const resource = section === "orders" ? "sales-orders" : section;
    const endpoint = section === "report" ? "/api/erp/report" : `/api/erp/${resource}`;
    setLoading(true);
    fetch(endpoint).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? "Unable to load ERP data");
      if (section === "report") setReport(data);
      else setRows(data);
      setMessage("");
    }).catch((error: Error) => { setMessageTone("error"); setMessage(error.message); }).finally(() => setLoading(false));
  }, [section, refresh]);

  async function saveRecord(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const values = Object.fromEntries(form.entries());
    const endpoint = section === "orders" ? "sales-orders" : section;
    let payload: Record<string, unknown> = values;
    if (section === "products") {
      payload = { ...values, salePrice: Number(values.salePrice), costPrice: Number(values.costPrice), stockQuantity: Number(values.stockQuantity) };
    }
    if (section === "expenses") {
      payload = { ...values, amount: Number(values.amount) };
    }
    if (section === "orders") {
      payload = editing
        ? { status: values.status, contactId: values.contactId || null }
        : { items: [{ description: toText(values.description), quantity: toNumber(values.quantity), unitPrice: toNumber(values.unitPrice) }], tax: toNumber(values.tax) };
    }
    try {
      const recordPath = editing ? `/${editing.id}` : "";
      const response = await fetch(`/api/erp/${endpoint}${recordPath}`, { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? "Unable to save record.");
      setMessageTone("success");
      setMessage(editing ? "Record updated." : "Record created.");
      setEditing(null);
      formElement.reset();
      setRefresh((value) => value + 1);
    } catch (error) { setMessageTone("error"); setMessage(error instanceof Error ? error.message : "Unable to save record"); }
  }

  async function removeRecord(row: Row) {
    if (!window.confirm("Delete this record? This action cannot be undone.")) return;
    const resource = section === "orders" ? "sales-orders" : section;
    try {
      const response = await fetch(`/api/erp/${resource}/${row.id}`, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json() as { message?: string };
        throw new Error(data.message ?? "Unable to delete record.");
      }
      if (editing?.id === row.id) setEditing(null);
      setMessageTone("success");
      setMessage("Record deleted.");
      setRefresh((value) => value + 1);
    } catch (error) {
      setMessageTone("error");
      setMessage(error instanceof Error ? error.message : "Unable to delete record.");
    }
  }

  const navigation = [
    ["report", "Report", BarChart3], ["contacts", "Contacts", ContactRound], ["products", "Products & stock", Boxes], ["orders", "Sales orders", ShoppingCart], ["expenses", "Expenses", ReceiptText],
  ] as const;

  const filteredRows = rows.filter((row) => !search || Object.values(row).some((value) => toText(value).toLowerCase().includes(search.toLowerCase())));
  return <div className="mx-auto max-w-6xl space-y-5"><header className="flex flex-col gap-4 border-b border-[#dce6e2] pb-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#4e7e20]">ERP operations</p><h1 className="text-3xl font-extrabold tracking-[-0.04em] text-[#00382f]">Run the business from one desk.</h1><p className="mt-1 text-sm text-[#60766d]">Contacts, inventory, sales, expenses, and payment reporting backed by PostgreSQL.</p></div><button type="button" onClick={() => setRefresh((value) => value + 1)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#cbdcd3] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#00382f]" disabled={loading}><RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh</button></header>{message && <output className={`block rounded-xl border px-4 py-3 text-sm ${messageTone === "success" ? "border-[#d9eab9] bg-[#f2f8df] text-[#36521c]" : "border-[#f0c7c0] bg-[#fff4f1] text-[#9f3e32]"}`}>{message}</output>}<nav className="flex gap-2 overflow-x-auto">{navigation.map(([value, label, Icon]) => <button type="button" key={value} onClick={() => { setSection(value); setSearch(""); setEditing(null); setMessage(""); }} className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold ${section === value ? "bg-[#00382f] text-white" : "bg-white text-[#526761]"}`}><Icon size={16} />{label}</button>)}</nav>{section === "report" ? <Report report={report} /> : <div className="space-y-4"><div className="flex items-center gap-2 rounded-xl border border-[#d9e3df] bg-white px-3 py-2 text-sm text-[#82918d] sm:max-w-sm"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} className="min-w-0 flex-1 bg-transparent outline-none" placeholder={`Search ${section}...`} aria-label={`Search ${section}`} /></div><div className="grid gap-5 xl:grid-cols-[0.8fr_1.5fr]"><RecordForm key={`${section}-${toText(editing?.id) || "new"}`} section={section} editing={editing} onSubmit={saveRecord} onCancel={() => setEditing(null)} /><DataTable section={section} rows={filteredRows} loading={loading} onEdit={setEditing} onDelete={removeRecord} /></div></div>}</div>;
}

function RecordForm({ section, editing, onSubmit, onCancel }: Readonly<{ section: Section; editing: Row | null; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void; onCancel: () => void }>) {
  if (section === "contacts") return <Form title={editing ? "Edit contact" : "New contact"} editing={Boolean(editing)} onSubmit={onSubmit} onCancel={onCancel}><Input name="name" label="Name" required defaultValue={toText(editing?.name)} /><Input name="email" label="Email" type="email" defaultValue={toText(editing?.email)} /><Select name="kind" label="Type" options={["customer", "vendor", "both"]} defaultValue={toText(editing?.kind) || "customer"} /><Input name="phone" label="Phone" defaultValue={toText(editing?.phone)} /><Input name="address" label="Address" defaultValue={toText(editing?.address)} /><Input name="taxId" label="Tax ID" defaultValue={toText(editing?.tax_id)} /></Form>;
  if (section === "products") return <Form title={editing ? "Edit product" : "New product"} editing={Boolean(editing)} onSubmit={onSubmit} onCancel={onCancel}><Input name="sku" label="SKU" required defaultValue={toText(editing?.sku)} /><Input name="name" label="Product name" required defaultValue={toText(editing?.name)} /><Input name="description" label="Description" defaultValue={toText(editing?.description)} /><Input name="unit" label="Unit" defaultValue={toText(editing?.unit) || "unit"} /><Input name="salePrice" label="Sale price" type="number" min="0" required defaultValue={toText(editing?.sale_price) || "0"} /><Input name="costPrice" label="Cost price" type="number" min="0" defaultValue={toText(editing?.cost_price) || "0"} /><Input name="stockQuantity" label="Stock quantity" type="number" min="0" step="0.001" defaultValue={toText(editing?.stock_quantity) || "0"} /></Form>;
  if (section === "expenses") return <Form title={editing ? "Edit expense" : "New expense"} editing={Boolean(editing)} onSubmit={onSubmit} onCancel={onCancel}><Input name="description" label="Description" required defaultValue={toText(editing?.description)} /><Input name="category" label="Category" required defaultValue={toText(editing?.category)} /><Input name="amount" label="Amount" type="number" min="0.01" step="0.01" required defaultValue={toText(editing?.amount)} /><Input name="currency" label="Currency" defaultValue={toText(editing?.currency) || "IDR"} /><Input name="expenseDate" label="Date" type="date" defaultValue={dateValue(editing?.expense_date)} /><Select name="status" label="Status" options={["submitted", "approved", "paid", "rejected"]} defaultValue={toText(editing?.status) || "submitted"} /><Input name="contactId" label="Contact ID" defaultValue={toText(editing?.contact_id)} /></Form>;
  if (editing) return <Form title="Edit sales order" editing onSubmit={onSubmit} onCancel={onCancel}><Select name="status" label="Status" options={["draft", "confirmed", "fulfilled", "cancelled"]} defaultValue={toText(editing.status) || "draft"} /><Input name="contactId" label="Contact ID" defaultValue={toText(editing.contact_id)} /></Form>;
  return <Form title="New sales order" onSubmit={onSubmit}><Input name="description" label="Item description" required /><Input name="quantity" label="Quantity" type="number" min="0.001" step="0.001" required /><Input name="unitPrice" label="Unit price" type="number" min="0" step="0.01" required /><Input name="tax" label="Tax" type="number" min="0" step="0.01" defaultValue="0" /></Form>;
}

function Form({ title, editing = false, onSubmit, onCancel, children }: Readonly<{ title: string; editing?: boolean; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void; onCancel?: () => void; children: React.ReactNode }>) { return <form onSubmit={onSubmit} className="rounded-2xl border border-[#dce6e2] bg-white p-5"><div className="flex items-center gap-2"><FilePlus2 size={17} className="text-[#267153]" /><h2 className="font-bold text-[#243a34]">{title}</h2></div><div className="mt-5 space-y-3">{children}</div><button type="submit" className="mt-5 w-full rounded-xl bg-[#7fb735] px-4 py-3 text-sm font-bold text-[#00382f] hover:bg-[#91c849]">{editing ? "Update record" : "Create record"}</button>{editing && <button type="button" onClick={onCancel} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-[#cbdcd3] px-4 py-2.5 text-sm font-semibold text-[#344742]"><X size={15} /> Cancel edit</button>}</form>; }
function Input({ name, label, type = "text", required, defaultValue, min, step }: Readonly<{ name: string; label: string; type?: string; required?: boolean; defaultValue?: string; min?: string; step?: string }>) { return <label className="block text-sm font-semibold text-[#344742]">{label}<input name={name} type={type} required={required} defaultValue={defaultValue} min={min} step={step} className="mt-1.5 block w-full rounded-lg border border-[#d9e3df] px-3 py-2.5 text-sm font-normal outline-none focus:border-[#7fb735] focus:ring-2 focus:ring-[#d9eab9]" /></label>; }
function Select({ name, label, options, defaultValue }: Readonly<{ name: string; label: string; options: string[]; defaultValue?: string }>) { return <label className="block text-sm font-semibold text-[#344742]">{label}<select name={name} defaultValue={defaultValue} className="mt-1.5 block w-full rounded-lg border border-[#d9e3df] bg-white px-3 py-2.5 text-sm font-normal focus:border-[#7fb735] focus:ring-2 focus:ring-[#d9eab9]">{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>; }

function dateValue(value: unknown) {
  const date = toText(value);
  return date ? date.slice(0, 10) : "";
}

function DataTable({ section, rows, loading, onEdit, onDelete }: Readonly<{ section: Section; rows: Row[]; loading: boolean; onEdit: (row: Row) => void; onDelete: (row: Row) => void }>) {
  const keys = rows[0] ? Object.keys(rows[0]).filter((key) => !["id", "organization_id", "created_at"].includes(key)) : [];
  let content: React.ReactNode = <p className="py-12 text-center text-sm text-[#82918d]">No records yet.</p>;
  if (loading) content = <div className="py-12 text-center text-sm text-[#82918d]">Loading PostgreSQL data...</div>;
  if (!loading && rows.length > 0) content = <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead><tr className="border-b border-[#edf1ef] text-xs uppercase tracking-wide text-[#82918d]">{keys.map((key) => <th className="px-2 py-3" key={key}>{formatColumn(key)}</th>)}<th className="px-2 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-[#edf1ef]">{rows.map((row, index) => <tr className="hover:bg-[#f7faf8]" key={toText(row.id) || String(index)}>{keys.map((key) => <td className="px-2 py-3 text-[#526761]" key={key}>{key === "status" ? <Status value={toText(row[key])} /> : toText(row[key]) || "-"}</td>)}<td className="px-2 py-2"><div className="flex justify-end gap-1"><button type="button" onClick={() => onEdit(row)} aria-label={`Edit ${section} record ${index + 1}`} className="rounded-md p-2 text-[#00382f] hover:bg-[#f2f8df]"><Pencil size={15} /></button><button type="button" onClick={() => onDelete(row)} aria-label={`Delete ${section} record ${index + 1}`} className="rounded-md p-2 text-[#9f3e32] hover:bg-[#fff4f1]"><Trash2 size={15} /></button></div></td></tr>)}</tbody></table></div>;
  return <section className="overflow-hidden rounded-2xl border border-[#dce6e2] bg-white p-5"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><BookOpen size={17} className="text-[#267153]" /><h2 className="font-bold capitalize text-[#243a34]">{section}</h2></div><span className="text-xs text-[#82918d]">{rows.length} records</span></div>{content}</section>;
}

function Report({ report }: Readonly<{ report: Record<string, Row> | null }>) { const cards = [["contacts", "Contacts"], ["products", "Products & stock"], ["salesOrders", "Sales orders"], ["expenses", "Expenses"], ["invoices", "Invoices"]]; return <section className="space-y-5"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{cards.map(([key, label]) => <div className="rounded-2xl border border-[#dce6e2] bg-white p-4 shadow-[0_8px_20px_rgba(32,60,50,0.03)]" key={key}><div className="flex items-center justify-between"><p className="text-xs font-semibold text-[#82918d]">{label}</p><TrendingUp size={15} className="text-[#5e9271]" /></div><p className="mt-3 text-2xl font-extrabold text-[#20332f]">{toText(report?.[key]?.count) || "--"}</p><p className="mt-1 text-xs text-[#5e9271]">{reportSummary(key, report?.[key])}</p></div>)}</div><div className="rounded-2xl border border-[#dce6e2] bg-white p-5"><h2 className="font-bold text-[#243a34]">PostgreSQL workspace</h2><p className="mt-1 text-sm text-[#82918d]">All operational records are persisted in the demo organization database.</p><div className="mt-4 grid gap-3 sm:grid-cols-3"><MiniMetric label="Paid invoice value" value={toText(report?.invoices?.paid_value) || "0"} /><MiniMetric label="Inventory value" value={toText(report?.products?.inventory_value) || "0"} /><MiniMetric label="Expense value" value={toText(report?.expenses?.value) || "0"} /></div></div></section>; }

function MiniMetric({ label, value }: Readonly<{ label: string; value: string }>) { return <div className="rounded-xl bg-[#f7faf8] p-3"><p className="text-xs text-[#82918d]">{label}</p><p className="mt-1 font-bold text-[#344742]">{value}</p></div>; }
function Status({ value }: Readonly<{ value: string }>) {
  let style = "bg-[#f2f8df] text-[#36521c]";
  switch (value) {
    case "paid":
    case "approved":
    case "fulfilled":
      style = "bg-[#e6f4ed] text-[#267153]";
      break;
    case "rejected":
    case "cancelled":
      style = "bg-[#fff4f1] text-[#9f3e32]";
      break;
  }
  return <span className={`rounded-full px-2 py-1 text-[11px] font-bold capitalize ${style}`}>{value}</span>;
}

function formatColumn(key: string) {
  let label = "";
  for (const character of key) label += character === "_" ? " " : character;
  return label;
}

function toText(value: unknown) { return typeof value === "string" || typeof value === "number" ? String(value) : ""; }
function toNumber(value: unknown) { return Number(toText(value) || 0); }
function reportSummary(key: string, row?: Row) {
  if (key === "invoices") return `Paid ${toText(row?.paid_value) || "--"}`;
  if (key === "products") return `Stock value ${toText(row?.inventory_value) || "--"}`;
  if (key === "salesOrders" || key === "expenses") return `Value ${toText(row?.value) || "--"}`;
  return "Active records";
}