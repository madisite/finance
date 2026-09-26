import { RequestHandler } from "express";
import pg from "pg";
import crypto from "node:crypto";
import { AdminOverview, DemoAuthResponse, TransactionType } from "@shared/api";

const { Pool } = pg;
const pool = process.env.DATABASE_URL ? new Pool({ connectionString: process.env.DATABASE_URL }) : null;

const demoCredentials = {
  email: process.env.DEMO_EMAIL ?? "demo@example.com",
  password: process.env.DEMO_PASSWORD ?? "demo1234",
};

export const handleDemoAuth: RequestHandler = (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (email !== demoCredentials.email || password !== demoCredentials.password) {
    res.status(401).json({ message: "Use the demo credentials shown on this page." });
    return;
  }

  const response: DemoAuthResponse = {
    user: { email: demoCredentials.email, name: "Madi", role: "admin" },
  };
  res.json(response);
};

export const handleAdminOverview: RequestHandler = async (req, res) => {
  if (!pool) {
    res.status(503).json({ message: "DATABASE_URL is not configured." });
    return;
  }

  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
  const page = Math.max(Number(req.query.page) || 1, 1);
  const offset = (page - 1) * limit;
  const type = typeof req.query.type === "string" ? req.query.type : "all";
  const start = typeof req.query.start === "string" ? req.query.start : null;
  const end = typeof req.query.end === "string" ? req.query.end : null;

  try {
    const accountResult = await pool.query<{
      id: string;
      name: string;
      type: string;
      currency_code: string;
      current_balance: string;
    }>(
      `SELECT id, name, type, currency_code, current_balance
       FROM accounts
       WHERE organization_id = 'demo' ORDER BY created_at ASC LIMIT 1`,
    );

    if (!accountResult.rows[0]) {
      res.status(404).json({ message: "Demo account not found. Run pnpm db:migrate first." });
      return;
    }

    const account = accountResult.rows[0];
    let transactionRows;
    let totalResult;
    const values: (string | number | null)[] = [account.id, start, end];
    const typeClause = type === "all" ? "" : " AND transaction_type = $4";
    if (type !== "all") values.push(type);

    const query = `
      SELECT id, occurred_at, description, transaction_type, amount, currency_code, counterparty, category
      FROM account_transactions
      WHERE account_id = $1 AND ($2::date IS NULL OR occurred_at::date >= $2::date)
        AND ($3::date IS NULL OR occurred_at::date <= $3::date)${typeClause}
      ORDER BY occurred_at DESC
      LIMIT ${limit} OFFSET ${offset}`;
    const totalQuery = `
      SELECT COUNT(*)::int AS count
      FROM account_transactions
      WHERE account_id = $1 AND ($2::date IS NULL OR occurred_at::date >= $2::date)
        AND ($3::date IS NULL OR occurred_at::date <= $3::date)${typeClause}`;

    [transactionRows, totalResult] = await Promise.all([
      pool.query(query, values),
      pool.query(totalQuery, values),
    ]);

    const transactions = transactionRows.rows.map((row) => ({
      id: row.id,
      date: row.occurred_at,
      description: row.description,
      type: row.transaction_type as TransactionType,
      amount: Number(row.amount),
      currency: row.currency_code,
      counterparty: row.counterparty,
      category: row.category,
    }));

    const overview: AdminOverview = {
      account: {
        id: account.id,
        name: account.name,
        type: account.type,
        currency: account.currency_code,
        balance: Number(account.current_balance),
      },
      transactions,
      pagination: { page, limit, total: totalResult.rows[0].count },
      source: process.env.FIREFLY_API_URL && process.env.FIREFLY_TOKEN ? "firefly" : "postgresql",
    };

    res.json(overview);
  } catch (error) {
    console.error("Admin overview failed:", error);
    res.status(500).json({ message: "Unable to load the admin dashboard." });
  }
};

export const handleFireflySync: RequestHandler = async (req, res) => {
  if (!pool) {
    res.status(503).json({ message: "DATABASE_URL is not configured." });
    return;
  }
  if (!process.env.FIREFLY_API_URL || !process.env.FIREFLY_TOKEN || !process.env.FIREFLY_ACCOUNT_ID) {
    res.status(503).json({ message: "Set FIREFLY_API_URL, FIREFLY_TOKEN, and FIREFLY_ACCOUNT_ID to sync Firefly III." });
    return;
  }

  const accountId = process.env.FIREFLY_ACCOUNT_ID;
  const limit = Math.min(Math.max(Number(req.body?.limit) || 50, 1), 100);
  const page = Math.max(Number(req.body?.page) || 1, 1);
  const fireflyUrl = new URL(`v1/accounts/${encodeURIComponent(accountId)}/transactions`, ensureApiBase(process.env.FIREFLY_API_URL));
  const fireflyAccountUrl = new URL(`v1/accounts/${encodeURIComponent(accountId)}`, ensureApiBase(process.env.FIREFLY_API_URL));
  fireflyUrl.searchParams.set("limit", String(limit));
  fireflyUrl.searchParams.set("page", String(page));
  if (typeof req.body?.start === "string") fireflyUrl.searchParams.set("start", req.body.start);
  if (typeof req.body?.end === "string") fireflyUrl.searchParams.set("end", req.body.end);

  try {
    const headers = { Accept: "application/vnd.api+json", Authorization: `Bearer ${process.env.FIREFLY_TOKEN}` };
    const [fireflyResponse, accountResponse] = await Promise.all([
      fetch(fireflyUrl, { headers }),
      fetch(fireflyAccountUrl, { headers }),
    ]);
    const fireflyData = await fireflyResponse.json() as { data?: unknown[]; message?: string; meta?: { pagination?: { total?: number } } };
    const accountData = await accountResponse.json() as { data?: { attributes?: Record<string, unknown> }; message?: string };
    if (!fireflyResponse.ok || !accountResponse.ok) {
      const failedResponse = !fireflyResponse.ok ? fireflyResponse : accountResponse;
      const failedData = !fireflyResponse.ok ? fireflyData : accountData;
      res.status(failedResponse.status).json({ message: failedData.message ?? "Firefly III rejected the request." });
      return;
    }

    const normalized = normalizeFireflyTransactions(fireflyData.data ?? []);
    const accountAttributes = accountData.data?.attributes ?? {};
    const accountName = String(accountAttributes.name ?? `Firefly account ${accountId}`);
    const accountType = String(accountAttributes.type ?? "asset");
    const currencyCode = String(accountAttributes.currency_code ?? "USD");
    const currentBalance = Number(accountAttributes.current_balance ?? 0);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const accountResult = await client.query<{ id: string }>(
        `INSERT INTO accounts (id, organization_id, external_id, name, type, currency_code, current_balance)
         VALUES ($1, 'demo', $2, $3, $4, $5, $6)
         ON CONFLICT (organization_id, external_id) DO UPDATE SET
           name = EXCLUDED.name, type = EXCLUDED.type, currency_code = EXCLUDED.currency_code,
           current_balance = EXCLUDED.current_balance
         RETURNING id`,
        [crypto.randomUUID(), accountId, accountName, accountType, currencyCode, currentBalance],
      );
      const localAccountId = accountResult.rows[0].id;
      for (const transaction of normalized) {
        await client.query(
          `INSERT INTO account_transactions (id, account_id, external_id, occurred_at, description, transaction_type, amount, currency_code, counterparty, category)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (account_id, external_id) DO UPDATE SET
             occurred_at = EXCLUDED.occurred_at, description = EXCLUDED.description,
             transaction_type = EXCLUDED.transaction_type, amount = EXCLUDED.amount,
             currency_code = EXCLUDED.currency_code, counterparty = EXCLUDED.counterparty,
             category = EXCLUDED.category`,
          [crypto.randomUUID(), localAccountId, transaction.id, transaction.date, transaction.description, transaction.type, transaction.amount, transaction.currency, transaction.counterparty, transaction.category],
        );
      }
      await client.query("COMMIT");
      res.json({ synced: normalized.length, total: fireflyData.meta?.pagination?.total ?? normalized.length, source: "firefly" });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Firefly sync failed:", error);
    res.status(502).json({ message: "Unable to reach Firefly III." });
  }
};

function normalizeFireflyTransactions(data: unknown[]) {
  return data.flatMap((item) => {
    const record = item as { attributes?: { transactions?: Array<Record<string, string>> } };
    return (record.attributes?.transactions ?? []).map((transaction) => ({
      id: transaction.transaction_journal_id ?? transaction.transaction_id ?? `${transaction.date}-${transaction.description}`,
      date: transaction.date,
      description: transaction.description ?? "Untitled transaction",
      type: transaction.type as TransactionType,
      amount: Number(transaction.amount),
      currency: transaction.currency_code ?? "USD",
      counterparty: transaction.destination_name ?? transaction.source_name ?? "Unknown",
      category: transaction.category_name ?? "Uncategorized",
    }));
  });
}

function ensureApiBase(value: string) {
  return value.endsWith("/") ? value : `${value}/`;
}