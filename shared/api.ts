/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

export type TransactionType = "deposit" | "withdrawal" | "transfer" | "opening_balance" | "reconciliation";

export interface DemoAuthResponse {
  user: { email: string; name: string; role: "admin" };
}

export interface AdminTransaction {
  id: string;
  date: string;
  description: string;
  type: TransactionType;
  amount: number;
  currency: string;
  counterparty: string;
  category: string;
}

export interface AdminOverview {
  account: { id: string; name: string; type: string; currency: string; balance: number };
  transactions: AdminTransaction[];
  pagination: { page: number; limit: number; total: number };
  source: "firefly" | "postgresql";
}

export type InvoiceStatus = "open" | "paid" | "expired" | "cancelled";

export interface ErpInvoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  description: string;
  amountIdr: number;
  amountUsdc: string;
  currency: "IDR";
  status: InvoiceStatus;
  payerAddress?: string;
  transactionHash?: string;
  createdAt: string;
  paidAt?: string;
}

export interface KimaiSummary {
  configured: boolean;
  totalSeconds: number;
  totalHours: number;
  count: number;
  timesheets: Array<{ id?: number; begin?: string; end?: string; duration: number; description: string; project: string; activity: string }>;
}

export interface LumaGeneration {
  id?: string;
  state: string;
  videoUrl?: string;
  createdAt?: string;
}
