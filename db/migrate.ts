import "dotenv/config";
import pg from "pg";

const { Pool } = pg;
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("Set DATABASE_URL before running db:migrate.");
}

function connectionHint(error: unknown) {
  const code = typeof error === "object" && error !== null && "code" in error ? String((error as { code?: unknown }).code ?? "") : "";
  if (code === "28P01") {
    return "PostgreSQL rejected the configured role. Run: sudo -u postgres psql -c \"CREATE ROLE \\\"madi-site\\\" LOGIN;\" -c \"CREATE DATABASE northstar OWNER \\\"madi-site\\\";\" then rerun pnpm db:migrate.";
  }
  if (code === "3D000") return "Database northstar does not exist. Run: sudo -u postgres createdb -O \"madi-site\" northstar.";
  if (code === "ECONNREFUSED") return "PostgreSQL is not listening on the configured host and port.";
  return "Check DATABASE_URL and PostgreSQL authentication rules.";
}

const pool = new Pool({ connectionString: databaseUrl });

async function migrate() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        name text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS accounts (
        id uuid PRIMARY KEY,
        organization_id text NOT NULL,
        external_id text,
        name text NOT NULL DEFAULT 'Demo operating account',
        type text NOT NULL DEFAULT 'asset',
        currency_code text NOT NULL DEFAULT 'USD',
        current_balance numeric(14, 2) NOT NULL DEFAULT 0,
        created_at timestamptz NOT NULL DEFAULT now()
      );

      ALTER TABLE accounts ADD COLUMN IF NOT EXISTS name text NOT NULL DEFAULT 'Demo operating account';
      ALTER TABLE accounts ADD COLUMN IF NOT EXISTS external_id text;
      ALTER TABLE accounts ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'asset';
      ALTER TABLE accounts ADD COLUMN IF NOT EXISTS currency_code text NOT NULL DEFAULT 'USD';
      ALTER TABLE accounts ADD COLUMN IF NOT EXISTS current_balance numeric(14, 2) NOT NULL DEFAULT 0;

      CREATE TABLE IF NOT EXISTS users (
        id uuid PRIMARY KEY,
        email text UNIQUE NOT NULL,
        display_name text NOT NULL,
        role text NOT NULL DEFAULT 'admin',
        password_hash text,
        created_at timestamptz NOT NULL DEFAULT now()
      );

      ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash text;

      CREATE TABLE IF NOT EXISTS account_transactions (
        id uuid PRIMARY KEY,
        account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        external_id text,
        occurred_at timestamptz NOT NULL,
        description text NOT NULL,
        transaction_type text NOT NULL,
        amount numeric(14, 2) NOT NULL,
        currency_code text NOT NULL DEFAULT 'USD',
        counterparty text NOT NULL,
        category text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS erp_invoices (
        id uuid PRIMARY KEY,
        invoice_number text UNIQUE NOT NULL,
        customer_name text NOT NULL,
        customer_email text NOT NULL,
        description text NOT NULL,
        amount_idr bigint NOT NULL CHECK (amount_idr > 0),
        amount_usdc numeric(18, 6) NOT NULL CHECK (amount_usdc > 0),
        currency text NOT NULL DEFAULT 'IDR',
        status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'paid', 'expired', 'cancelled')),
        payer_address text,
        transaction_hash text UNIQUE,
        created_at timestamptz NOT NULL DEFAULT now(),
        paid_at timestamptz
      );

      CREATE INDEX IF NOT EXISTS erp_invoices_status_created_at_idx ON erp_invoices (status, created_at DESC);

      CREATE TABLE IF NOT EXISTS contacts (
        id uuid PRIMARY KEY,
        organization_id text NOT NULL DEFAULT 'demo',
        kind text NOT NULL CHECK (kind IN ('customer', 'vendor', 'both')),
        name text NOT NULL,
        email text,
        phone text,
        address text,
        tax_id text,
        created_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS products (
        id uuid PRIMARY KEY,
        organization_id text NOT NULL DEFAULT 'demo',
        sku text NOT NULL,
        name text NOT NULL,
        description text,
        unit text NOT NULL DEFAULT 'unit',
        sale_price numeric(14, 2) NOT NULL DEFAULT 0,
        cost_price numeric(14, 2) NOT NULL DEFAULT 0,
        stock_quantity numeric(14, 3) NOT NULL DEFAULT 0,
        active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (organization_id, sku)
      );

      CREATE TABLE IF NOT EXISTS sales_orders (
        id uuid PRIMARY KEY,
        organization_id text NOT NULL DEFAULT 'demo',
        order_number text UNIQUE NOT NULL,
        contact_id uuid REFERENCES contacts(id),
        status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'fulfilled', 'cancelled')),
        currency text NOT NULL DEFAULT 'IDR',
        subtotal numeric(14, 2) NOT NULL DEFAULT 0,
        tax numeric(14, 2) NOT NULL DEFAULT 0,
        total numeric(14, 2) NOT NULL DEFAULT 0,
        created_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS sales_order_items (
        id uuid PRIMARY KEY,
        order_id uuid NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
        product_id uuid REFERENCES products(id),
        description text NOT NULL,
        quantity numeric(14, 3) NOT NULL CHECK (quantity > 0),
        unit_price numeric(14, 2) NOT NULL CHECK (unit_price >= 0),
        line_total numeric(14, 2) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS expenses (
        id uuid PRIMARY KEY,
        organization_id text NOT NULL DEFAULT 'demo',
        description text NOT NULL,
        category text NOT NULL,
        amount numeric(14, 2) NOT NULL CHECK (amount > 0),
        currency text NOT NULL DEFAULT 'IDR',
        status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'approved', 'paid', 'rejected')),
        expense_date date NOT NULL DEFAULT current_date,
        contact_id uuid REFERENCES contacts(id),
        created_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS contacts_organization_name_idx ON contacts (organization_id, name);
      CREATE INDEX IF NOT EXISTS products_organization_active_idx ON products (organization_id, active);
      CREATE INDEX IF NOT EXISTS sales_orders_organization_created_idx ON sales_orders (organization_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS expenses_organization_date_idx ON expenses (organization_id, expense_date DESC);

      CREATE TABLE IF NOT EXISTS ledger_entries (
        id uuid PRIMARY KEY,
        organization_id text NOT NULL,
        occurred_at timestamptz NOT NULL,
        external_id text,
        UNIQUE (organization_id, external_id)
      );

      CREATE TABLE IF NOT EXISTS automation_rules (
        id uuid PRIMARY KEY,
        organization_id text NOT NULL,
        enabled boolean NOT NULL DEFAULT true
      );

      CREATE TABLE IF NOT EXISTS payouts (
        id uuid PRIMARY KEY,
        organization_id text NOT NULL,
        status text NOT NULL,
        due_at timestamptz NOT NULL
      );

      CREATE INDEX IF NOT EXISTS accounts_organization_created_at_idx
        ON accounts (organization_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS account_transactions_account_occurred_at_idx
        ON account_transactions (account_id, occurred_at DESC);
      CREATE UNIQUE INDEX IF NOT EXISTS accounts_organization_external_id_idx
        ON accounts (organization_id, external_id) WHERE external_id IS NOT NULL;
      CREATE UNIQUE INDEX IF NOT EXISTS account_transactions_account_external_id_idx
        ON account_transactions (account_id, external_id) WHERE external_id IS NOT NULL;
      CREATE INDEX IF NOT EXISTS ledger_entries_organization_occurred_at_idx
        ON ledger_entries (organization_id, occurred_at DESC);
      CREATE INDEX IF NOT EXISTS automation_rules_organization_enabled_idx
        ON automation_rules (organization_id, enabled);
      CREATE INDEX IF NOT EXISTS payouts_organization_status_due_at_idx
        ON payouts (organization_id, status, due_at);

      INSERT INTO migrations (name)
      VALUES ('001_initial_finance_collections')
      ON CONFLICT (name) DO NOTHING;

      INSERT INTO users (id, email, display_name, role)
      VALUES ('00000000-0000-0000-0000-000000000001', 'demo@example.com', 'Madi', 'admin')
      ON CONFLICT (email) DO UPDATE SET display_name = EXCLUDED.display_name, role = EXCLUDED.role;

      INSERT INTO accounts (id, organization_id, name, type, currency_code, current_balance)
      VALUES ('00000000-0000-0000-0000-000000000010', 'demo', 'Demo operating account', 'asset', 'USD', 286420.00)
      ON CONFLICT (id) DO UPDATE SET current_balance = EXCLUDED.current_balance;

      INSERT INTO account_transactions (id, account_id, occurred_at, description, transaction_type, amount, currency_code, counterparty, category)
      VALUES
        ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000010', now() - interval '2 hours', 'Reserve sweep completed', 'deposit', 42800.00, 'USD', 'USYC Reserve', 'Cash management'),
        ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000010', now() - interval '3 hours', 'Meter settled automatically', 'withdrawal', -184.20, 'USD', 'Acme API', 'Operations'),
        ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000010', now() - interval '5 hours', 'Milestone approved', 'withdrawal', -4200.00, 'USD', 'Maya Chen', 'Contractors'),
        ('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000010', now() - interval '1 day', 'Payroll redemption queued', 'transfer', -18400.00, 'USD', 'Payroll account', 'Payroll'),
        ('00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000010', now() - interval '2 days', 'Client settlement', 'deposit', 12840.60, 'USD', 'Northstar Labs', 'Revenue')
      ON CONFLICT (id) DO NOTHING;
    `);
    await client.query("COMMIT");
    console.log("PostgreSQL migration complete");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

try {
  await migrate();
} catch (error) {
  console.error("PostgreSQL migration failed:", error);
  console.error(`Migration hint: ${connectionHint(error)}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
