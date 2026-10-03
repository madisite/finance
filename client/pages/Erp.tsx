import { wrapFetchWithPayment } from "@x402/fetch";
import { x402Client } from "@x402/core/client";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import type { ErpInvoice } from "@shared/api";
import { CircleDollarSign, Copy, FilePlus2, Link2, LoaderCircle, Pencil, Trash2, Wallet, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

type Eip1193Provider = { request(args: { method: string; params?: unknown[] }): Promise<unknown> };
type EthereumWindow = Window & { ethereum?: Eip1193Provider };
const ARC_TESTNET_CHAIN_ID = "0x4cef52";
const ARC_TESTNET_RPC_URL = import.meta.env.VITE_ARC_TESTNET_RPC_URL ?? "https://rpc.testnet.arc.network";

async function switchToArcTestnet(provider: Eip1193Provider) {
  try {
    await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: ARC_TESTNET_CHAIN_ID }] });
  } catch (error) {
    const code = typeof error === "object" && error !== null && "code" in error ? error.code : undefined;
    if (code !== 4902) throw error;
    await provider.request({
      method: "wallet_addEthereumChain",
      params: [{
        chainId: ARC_TESTNET_CHAIN_ID,
        chainName: "Arc Testnet",
        nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 6 },
        rpcUrls: [ARC_TESTNET_RPC_URL],
      }],
    });
  }
}

export default function FinanceErp() {
  const [invoices, setInvoices] = useState<ErpInvoice[]>([]);
  const [wallet, setWallet] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [editingInvoice, setEditingInvoice] = useState<string | null>(null);
  const [form, setForm] = useState({ customerName: "", customerEmail: "", description: "", amountIdr: "" });

  async function connectWallet() {
    const provider = (window as EthereumWindow).ethereum;
    if (!provider) {
      setMessage("Install MetaMask or another EVM wallet to connect.");
      return;
    }
    await switchToArcTestnet(provider);
    const accounts = await provider.request({ method: "eth_requestAccounts" }) as string[];
    setWallet(accounts[0] ?? "");
  }

  async function createInvoice(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(editingInvoice ? `/api/erp/invoices/${editingInvoice}` : "/api/erp/invoices", { method: editingInvoice ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, amountIdr: Number(form.amountIdr) }) });
      const data = await response.json() as ErpInvoice & { message?: string };
      if (!response.ok) throw new Error(data.message ?? "Unable to create invoice");
      setInvoices((current) => editingInvoice ? current.map((invoice) => invoice.id === data.id ? data : invoice) : [data, ...current]);
      setEditingInvoice(null);
      setForm({ customerName: "", customerEmail: "", description: "", amountIdr: "" });
      setMessage(editingInvoice ? `Invoice ${data.invoiceNumber} updated.` : `Invoice ${data.invoiceNumber} created.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create invoice");
    } finally {
      setBusy(false);
    }
  }

  function editInvoice(invoice: ErpInvoice) {
    setEditingInvoice(invoice.id);
    setForm({ customerName: invoice.customerName, customerEmail: invoice.customerEmail, description: invoice.description, amountIdr: String(invoice.amountIdr) });
    setMessage("");
  }

  async function deleteInvoice(invoice: ErpInvoice) {
    if (!window.confirm(`Delete open invoice ${invoice.invoiceNumber}?`)) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/erp/invoices/${invoice.id}`, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json() as { message?: string };
        throw new Error(data.message ?? "Unable to delete invoice.");
      }
      setInvoices((current) => current.filter((item) => item.id !== invoice.id));
      if (editingInvoice === invoice.id) {
        setEditingInvoice(null);
        setForm({ customerName: "", customerEmail: "", description: "", amountIdr: "" });
      }
      setMessage(`Invoice ${invoice.invoiceNumber} deleted.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to delete invoice.");
    } finally {
      setBusy(false);
    }
  }

  async function payInvoice(invoice: ErpInvoice) {
    const provider = (window as EthereumWindow).ethereum;
    if (!provider) return setMessage("Install MetaMask or another EVM wallet to pay.");
    if (!wallet) await connectWallet();
    setBusy(true);
    setMessage("Requesting x402 payment approval in your wallet...");
    try {
      await switchToArcTestnet(provider);
      const accounts = wallet ? [wallet] : await provider.request({ method: "eth_accounts" }) as string[];
      const address = accounts[0];
      if (!address) throw new Error("Connect a wallet first.");
      const chainId = await provider.request({ method: "eth_chainId" }) as string;
      const signer = {
        address: address as `0x${string}`,
        signTypedData: async (typedData: { domain: Record<string, unknown>; types: Record<string, unknown>; primaryType: string; message: Record<string, unknown> }) => provider.request({ method: "eth_signTypedData_v4", params: [address, JSON.stringify(typedData)] }) as Promise<`0x${string}`>,
      };
      const client = new x402Client();
      client.register("eip155:*", new ExactEvmScheme(signer));
      const paidFetch = wrapFetchWithPayment(fetch, client);
      const response = await paidFetch(`/api/erp/invoices/${invoice.id}/pay`, { method: "POST", headers: { "X-Wallet-Chain": chainId } });
      const data = await response.json() as ErpInvoice & { message?: string };
      if (!response.ok) throw new Error(data.message ?? "Payment was not settled");
      setInvoices((current) => current.map((item) => item.id === invoice.id ? data : item));
      setMessage(data.transactionHash ? `Payment settled: ${data.transactionHash}` : "Payment settled.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Payment failed");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    fetch("/api/erp/invoices")
      .then((response) => response.ok ? response.json() as Promise<ErpInvoice[]> : Promise.reject(new Error("Unable to load invoices")))
      .then(setInvoices)
      .catch(() => {
        const financeStored = localStorage.getItem("finance_erp_invoices");
        const legacyStored = localStorage.getItem("flare_erp_invoices");
        const stored = financeStored ?? legacyStored;
        if (stored) setInvoices(JSON.parse(stored) as ErpInvoice[]);
        if (!financeStored && legacyStored) localStorage.setItem("finance_erp_invoices", legacyStored);
      });
  }, []);

  useEffect(() => {
    if (invoices.length) {
      localStorage.setItem("finance_erp_invoices", JSON.stringify(invoices));
      localStorage.removeItem("flare_erp_invoices");
    }
  }, [invoices]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-col gap-4 border-b border-[#dce6e2] pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div><div className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#4e7e20]">ERP payments</div><h1 className="text-3xl font-extrabold tracking-[-0.04em] text-[#00382f]">Invoice, collect, reconcile.</h1><p className="mt-1 text-sm text-[#60766d]">Accept IDR-priced invoices settled in USDC through HTTP x402.</p></div>
        <button type="button" onClick={connectWallet} className="flex items-center justify-center gap-2 rounded-xl bg-[#00382f] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#075443]"><Wallet size={16} /> {wallet ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}` : "Connect wallet"}</button>
      </header>

      {message && <output className="block rounded-xl border border-[#c9ddd4] bg-[#edf5ef] px-4 py-3 text-sm text-[#00382f]">{message}</output>}
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.4fr]">
        <form onSubmit={createInvoice} className="rounded-2xl border border-[#dce6e2] bg-white p-5"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><FilePlus2 size={18} className="text-[#4e7e20]" /><h2 className="font-bold text-[#00382f]">{editingInvoice ? "Edit open invoice" : "New invoice"}</h2></div>{editingInvoice && <button type="button" onClick={() => { setEditingInvoice(null); setForm({ customerName: "", customerEmail: "", description: "", amountIdr: "" }); }} aria-label="Cancel invoice edit" className="rounded-md p-2 text-[#526761] hover:bg-[#f2f8df]"><X size={16} /></button>}</div><div className="mt-5 space-y-3"><Field label="Customer name" value={form.customerName} onChange={(value) => setForm({ ...form, customerName: value })} required /><Field label="Customer email" type="email" value={form.customerEmail} onChange={(value) => setForm({ ...form, customerEmail: value })} required /><Field label="Description" value={form.description} onChange={(value) => setForm({ ...form, description: value })} required /><Field label="Amount (IDR)" type="number" min="1" value={form.amountIdr} onChange={(value) => setForm({ ...form, amountIdr: value })} required /></div><button type="submit" disabled={busy} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#7fb735] px-4 py-3 text-sm font-bold text-[#00382f] hover:bg-[#91c849] disabled:opacity-60">{busy ? <LoaderCircle size={16} className="animate-spin" /> : <CircleDollarSign size={16} />} {editingInvoice ? "Update invoice" : "Create invoice"}</button><p className="mt-3 text-xs leading-5 text-[#82918d]">Prices are recorded in IDR and quoted in USDC using the server-side IDR/USDC rate.</p></form>
        <section className="rounded-2xl border border-[#dce6e2] bg-white p-5"><div className="flex items-center justify-between"><div><h2 className="font-bold text-[#00382f]">Invoice register</h2><p className="mt-1 text-xs text-[#82918d]">Payment proof and settlement status</p></div><Link2 size={19} className="text-[#4e7e20]" /></div>{invoices.length === 0 ? <div className="py-16 text-center text-sm text-[#82918d]">Create your first invoice to start collecting.</div> : <div className="mt-4 space-y-2">{invoices.map((invoice) => <div key={invoice.id} className="flex flex-col gap-3 rounded-xl border border-[#e4ece8] p-4 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><p className="text-sm font-bold text-[#00382f]">{invoice.invoiceNumber}</p><p className="truncate text-xs text-[#82918d]">{invoice.customerName} · {invoice.description}</p></div><div className="text-left sm:text-right"><p className="text-sm font-bold text-[#344742]">{formatIdr(invoice.amountIdr)}</p><p className="text-xs text-[#82918d]">{invoice.amountUsdc} USDC</p></div><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${invoice.status === "paid" ? "bg-[#e6f4ed] text-[#267153]" : "bg-[#f2f8df] text-[#36521c]"}`}>{invoice.status}</span>{invoice.status === "open" && <><button type="button" onClick={() => editInvoice(invoice)} aria-label={`Edit invoice ${invoice.invoiceNumber}`} className="rounded-md p-2 text-[#00382f] hover:bg-[#f2f8df]"><Pencil size={15} /></button><button type="button" onClick={() => deleteInvoice(invoice)} aria-label={`Delete invoice ${invoice.invoiceNumber}`} disabled={busy} className="rounded-md p-2 text-[#9f3e32] hover:bg-[#fff4f1]"><Trash2 size={15} /></button><button type="button" onClick={() => payInvoice(invoice)} disabled={busy} className="rounded-lg border border-[#c9ddd4] px-3 py-2 text-xs font-bold text-[#00382f] hover:bg-[#f2f8df]">Pay with wallet</button></>}{invoice.transactionHash && <button type="button" onClick={() => navigator.clipboard.writeText(invoice.transactionHash!)} aria-label="Copy transaction hash" className="text-[#82918d]"><Copy size={15} /></button>}</div>)}</div>}</section>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", min, required }: Readonly<{ label: string; value: string; onChange: (value: string) => void; type?: string; min?: string; required?: boolean }>) {
  return <label className="block text-sm font-semibold text-[#344742]">{label}<input required={required} type={type} min={min} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1.5 block w-full rounded-lg border border-[#d9e3df] px-3 py-2.5 text-sm font-normal outline-none focus:border-[#7fb735] focus:ring-2 focus:ring-[#d9eab9]" /></label>;
}

function formatIdr(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
}