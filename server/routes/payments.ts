import { RequestHandler } from "express";
import pg from "pg";
import crypto from "node:crypto";

const { Pool } = pg;
const pool = process.env.DATABASE_URL ? new Pool({ connectionString: process.env.DATABASE_URL }) : null;
pool?.on("error", (error) => console.error("PostgreSQL pool error:", error.message));

type PaymentRequirements = {
  scheme: string;
  network: string;
  asset: string;
  amount: string;
  payTo: string;
  maxTimeoutSeconds: number;
  description: string;
  mimeType: string;
  resource: string;
};

export const handleCreateInvoice: RequestHandler = async (req, res) => {
  if (!pool) return res.status(503).json({ message: "DATABASE_URL is not configured." });
  try {
    const { customerName, customerEmail, description, amountIdr } = req.body as Record<string, string | number>;
    const amount = Number(amountIdr);
    if (!customerName || !customerEmail || !description || !Number.isInteger(amount) || amount <= 0) {
      return res.status(400).json({ message: "customerName, customerEmail, description, and a positive integer amountIdr are required." });
    }
    if (!process.env.X402_RECIPIENT || !process.env.X402_NETWORK || !process.env.X402_ASSET) {
      return res.status(503).json({ message: "Configure X402_RECIPIENT, X402_NETWORK, and X402_ASSET first." });
    }

    const invoiceNumber = `INV-${new Date().getUTCFullYear()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    const invoiceId = crypto.randomUUID();
    const usdcRate = Number(process.env.IDR_PER_USDC ?? 16500);
    const amountUsdc = (amount / usdcRate).toFixed(6);
    const result = await pool.query(
      `INSERT INTO erp_invoices (id, invoice_number, customer_name, customer_email, description, amount_idr, amount_usdc, currency, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'IDR', 'open')
       RETURNING id, invoice_number, customer_name, customer_email, description, amount_idr, amount_usdc, currency, status, created_at`,
      [invoiceId, invoiceNumber, customerName, customerEmail, description, amount, amountUsdc],
    );
    return res.status(201).json(toInvoice(result.rows[0]));
  } catch (error) {
    return sendDatabaseError(res, "Unable to create invoice", error);
  }
};

export const handleListInvoices: RequestHandler = async (_req, res) => {
  if (!pool) return res.status(503).json({ message: "DATABASE_URL is not configured." });
  try {
    const result = await pool.query("SELECT * FROM erp_invoices ORDER BY created_at DESC LIMIT 100");
    res.json(result.rows.map(toInvoice));
  } catch (error) {
    sendDatabaseError(res, "Unable to load invoices", error);
  }
};

export const handleGetInvoice: RequestHandler = async (req, res) => {
  if (!pool) return res.status(503).json({ message: "DATABASE_URL is not configured." });
  try {
    const result = await pool.query("SELECT * FROM erp_invoices WHERE id = $1", [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ message: "Invoice not found." });
    res.json(toInvoice(result.rows[0]));
  } catch (error) {
    sendDatabaseError(res, "Unable to load invoice", error);
  }
};

export const handleUpdateInvoice: RequestHandler = async (req, res) => {
  if (!pool) return res.status(503).json({ message: "DATABASE_URL is not configured." });
  const { customerName, customerEmail, description, amountIdr } = req.body ?? {};
  const amount = Number(amountIdr);
  const email = typeof customerEmail === "string" ? customerEmail.trim() : "";
  const atIndex = email.indexOf("@");
  if (typeof customerName !== "string" || !customerName.trim() || atIndex < 1 || atIndex !== email.lastIndexOf("@") || !email.slice(atIndex + 1).includes(".") || typeof description !== "string" || !description.trim() || !Number.isSafeInteger(amount) || amount <= 0) {
    return res.status(400).json({ message: "Enter a customer name, valid email, description, and positive integer IDR amount." });
  }
  const rate = Number(process.env.IDR_PER_USDC ?? 16500);
  if (!Number.isFinite(rate) || rate <= 0) return res.status(503).json({ message: "IDR_PER_USDC must be a positive number." });
  try {
    const result = await pool.query(
      `UPDATE erp_invoices SET customer_name = $2, customer_email = $3, description = $4, amount_idr = $5, amount_usdc = $6
       WHERE id = $1 AND status = 'open' RETURNING *`,
      [req.params.id, customerName.trim(), email.toLowerCase(), description.trim(), amount, (amount / rate).toFixed(6)],
    );
    if (!result.rows[0]) {
      const existing = await pool.query("SELECT status FROM erp_invoices WHERE id = $1", [req.params.id]);
      if (!existing.rows[0]) return res.status(404).json({ message: "Invoice not found." });
      return res.status(409).json({ message: "Only open invoices can be edited." });
    }
    return res.json(toInvoice(result.rows[0]));
  } catch (error) {
    return sendDatabaseError(res, "Unable to update invoice", error);
  }
};

export const handleDeleteInvoice: RequestHandler = async (req, res) => {
  if (!pool) return res.status(503).json({ message: "DATABASE_URL is not configured." });
  try {
    const result = await pool.query("DELETE FROM erp_invoices WHERE id = $1 AND status = 'open' RETURNING id", [req.params.id]);
    if (!result.rows[0]) {
      const existing = await pool.query("SELECT status FROM erp_invoices WHERE id = $1", [req.params.id]);
      if (!existing.rows[0]) return res.status(404).json({ message: "Invoice not found." });
      return res.status(409).json({ message: "Only open invoices can be deleted." });
    }
    return res.status(204).end();
  } catch (error) {
    return sendDatabaseError(res, "Unable to delete invoice", error);
  }
};

export const handleInvoicePayment: RequestHandler = async (req, res) => {
  if (!pool) return res.status(503).json({ message: "DATABASE_URL is not configured." });
  let invoiceResult;
  try {
    invoiceResult = await pool.query("SELECT * FROM erp_invoices WHERE id = $1", [req.params.id]);
  } catch (error) {
    sendDatabaseError(res, "Unable to load invoice for payment", error);
    return;
  }
  const invoice = invoiceResult.rows[0];
  if (!invoice) return res.status(404).json({ message: "Invoice not found." });
  if (invoice.status === "paid") return res.json(toInvoice(invoice));

  const requirements = paymentRequirements(invoice, req);
  const paymentSignature = req.header("PAYMENT-SIGNATURE") ?? req.header("X-PAYMENT");
  if (!paymentSignature) {
    const paymentRequired = { x402Version: 2, accepts: [requirements] };
    const encoded = Buffer.from(JSON.stringify(paymentRequired)).toString("base64");
    res.setHeader("PAYMENT-REQUIRED", encoded);
    res.setHeader("X-PAYMENT-REQUIRED", encoded);
    return res.status(402).json({ x402Version: 2, accepts: [requirements], message: "Payment required" });
  }
  if (!process.env.X402_FACILITATOR_URL) {
    return res.status(503).json({ message: "X402_FACILITATOR_URL is not configured; payment was not accepted." });
  }

  try {
    const paymentPayload = decodePayment(paymentSignature);
    const verifyResponse = await fetch(`${process.env.X402_FACILITATOR_URL.replace(/\/$/, "")}/verify`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paymentPayload, paymentRequirements: requirements }),
    });
    const verification = await verifyResponse.json() as { isValid?: boolean; payer?: string; invalidReason?: string };
    if (!verifyResponse.ok || !verification.isValid) return res.status(402).json({ message: verification.invalidReason ?? "Payment signature could not be verified." });

    const settleResponse = await fetch(`${process.env.X402_FACILITATOR_URL.replace(/\/$/, "")}/settle`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paymentPayload, paymentRequirements: requirements }),
    });
    const settlement = await settleResponse.json() as { success?: boolean; transaction?: string; txHash?: string; errorReason?: string };
    if (!settleResponse.ok || !settlement.success) return res.status(402).json({ message: settlement.errorReason ?? "Payment settlement failed." });

    const updated = await pool.query(
      `UPDATE erp_invoices SET status = 'paid', payer_address = $2, transaction_hash = $3, paid_at = now()
       WHERE id = $1 AND status = 'open' RETURNING *`,
      [req.params.id, verification.payer ?? paymentPayload.payload?.from ?? null, settlement.txHash ?? settlement.transaction ?? null],
    );
    if (!updated.rows[0]) return res.status(409).json({ message: "Invoice was already paid." });
    const paymentResponse = Buffer.from(JSON.stringify({
      success: true,
      transaction: settlement.txHash ?? settlement.transaction,
      payer: verification.payer ?? paymentPayload.payload?.from,
    })).toString("base64");
    res.setHeader("PAYMENT-RESPONSE", paymentResponse);
    return res.json(toInvoice(updated.rows[0]));
  } catch (error) {
    console.error("x402 payment failed:", error);
    if (isDatabaseError(error)) return sendDatabaseError(res, "Unable to save payment", error);
    return res.status(400).json({ message: "Invalid x402 payment payload." });
  }
};

function sendDatabaseError(res: Parameters<RequestHandler>[1], message: string, error: unknown) {
  const rawCode = typeof error === "object" && error !== null && "code" in error
    ? (error as { code?: unknown }).code
    : undefined;
  const code = typeof rawCode === "string" ? rawCode : "";
  console.error(`${message}:`, error instanceof Error ? error.message : error);
  const detail = code === "ECONNREFUSED" || code === "57P03"
    ? "PostgreSQL is not running at the configured DATABASE_URL. Start a PostgreSQL cluster, then run pnpm db:migrate."
    : "Check the database schema with pnpm db:migrate.";
  return res.status(503).json({ message: `${message}. ${detail}` });
}

function isDatabaseError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error;
}

function paymentRequirements(invoice: Record<string, string>, req: Parameters<RequestHandler>[0]): PaymentRequirements {
  return {
    scheme: process.env.X402_SCHEME ?? "exact",
    network: process.env.X402_NETWORK!,
    asset: process.env.X402_ASSET!,
    amount: toAtomicUnits(invoice.amount_usdc),
    payTo: process.env.X402_RECIPIENT!,
    maxTimeoutSeconds: Number(process.env.X402_TIMEOUT_SECONDS ?? 300),
    description: invoice.description,
    mimeType: "application/json",
    resource: `${req.protocol}://${req.get("host")}${req.originalUrl}`,
  };
}

function toAtomicUnits(value: string) {
  const [whole, fraction = ""] = String(value).split(".");
  return `${BigInt(whole) * 1_000_000n + BigInt(fraction.padEnd(6, "0").slice(0, 6))}`;
}

function decodePayment(value: string): { payload?: { from?: string }; [key: string]: unknown } {
  const decoded = Buffer.from(value, "base64").toString("utf8");
  return JSON.parse(decoded);
}

function toInvoice(row: Record<string, unknown>) {
  return {
    id: row.id, invoiceNumber: row.invoice_number, customerName: row.customer_name, customerEmail: row.customer_email,
    description: row.description, amountIdr: Number(row.amount_idr), amountUsdc: row.amount_usdc, currency: row.currency,
    status: row.status, payerAddress: row.payer_address, transactionHash: row.transaction_hash, createdAt: row.created_at, paidAt: row.paid_at,
  };
}