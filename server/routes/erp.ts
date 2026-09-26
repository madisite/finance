import { RequestHandler } from "express";
import pg from "pg";
import crypto from "node:crypto";

const { Pool } = pg;
const pool = process.env.DATABASE_URL ? new Pool({ connectionString: process.env.DATABASE_URL }) : null;

export const listContacts: RequestHandler = async (req, res) => {
  await queryOr503(res, "Unable to load contacts", "SELECT * FROM contacts WHERE organization_id = 'demo' ORDER BY name");
};

export const createContact: RequestHandler = async (req, res) => {
  const { kind = "customer", name, email, phone, address, taxId } = req.body ?? {};
  if (!isNonEmpty(name) || !["customer", "vendor", "both"].includes(kind)) return res.status(400).json({ message: "A contact name and valid contact type are required." });
  await queryOr503(res, "Unable to create contact", "INSERT INTO contacts (id, kind, name, email, phone, address, tax_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *", [crypto.randomUUID(), kind, name.trim(), email?.trim() || null, phone?.trim() || null, address?.trim() || null, taxId?.trim() || null], 201);
};

export const listProducts: RequestHandler = async (_req, res) => {
  await queryOr503(res, "Unable to load products", "SELECT * FROM products WHERE organization_id = 'demo' AND active = true ORDER BY name");
};

export const createProduct: RequestHandler = async (req, res) => {
  const { sku, name, description, unit = "unit", salePrice = 0, costPrice = 0, stockQuantity = 0 } = req.body ?? {};
  if (!isNonEmpty(sku) || !isNonEmpty(name) || !validNonNegative(salePrice) || !validNonNegative(costPrice) || !validNonNegative(stockQuantity)) return res.status(400).json({ message: "SKU, product name, and valid non-negative prices and stock are required." });
  await queryOr503(res, "Unable to create product", "INSERT INTO products (id, sku, name, description, unit, sale_price, cost_price, stock_quantity) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *", [crypto.randomUUID(), sku.trim(), name.trim(), description ?? null, unit, salePrice, costPrice, stockQuantity], 201);
};

export const listExpenses: RequestHandler = async (_req, res) => {
  await queryOr503(res, "Unable to load expenses", "SELECT * FROM expenses WHERE organization_id = 'demo' ORDER BY expense_date DESC, created_at DESC");
};

export const createExpense: RequestHandler = async (req, res) => {
  const { description, category, amount, currency = "IDR", expenseDate, contactId } = req.body ?? {};
  if (!isNonEmpty(description) || !isNonEmpty(category) || !validPositive(amount)) return res.status(400).json({ message: "Description, category, and positive amount are required." });
  await queryOr503(res, "Unable to create expense", "INSERT INTO expenses (id, description, category, amount, currency, expense_date, contact_id) VALUES ($1, $2, $3, $4, $5, COALESCE($6::date, current_date), $7) RETURNING *", [crypto.randomUUID(), description.trim(), category.trim(), amount, currency, expenseDate || null, contactId || null], 201);
};

export const createSalesOrder: RequestHandler = async (req, res) => {
  const { contactId, items, tax = 0 } = req.body ?? {};
  if (!Array.isArray(items) || items.length === 0 || !validNonNegative(tax) || items.some((item) => !isNonEmpty(item?.description) || !validPositive(item?.quantity) || !validNonNegative(item?.unitPrice))) return res.status(400).json({ message: "Add valid order items with positive quantities and non-negative prices and tax." });
  if (!pool) return res.status(503).json({ message: "PostgreSQL is not configured." });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const orderNumber = `SO-${new Date().getUTCFullYear()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    const subtotal = items.reduce((sum: number, item: { quantity: number; unitPrice: number }) => sum + Number(item.quantity) * Number(item.unitPrice), 0);
    const order = await client.query(`INSERT INTO sales_orders (id, order_number, contact_id, subtotal, tax, total) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`, [crypto.randomUUID(), orderNumber, contactId ?? null, subtotal, tax, subtotal + Number(tax)]);
    for (const item of items) await client.query(`INSERT INTO sales_order_items (id, order_id, product_id, description, quantity, unit_price, line_total) VALUES ($1, $2, $3, $4, $5, $6, $7)`, [crypto.randomUUID(), order.rows[0].id, item.productId ?? null, item.description.trim(), item.quantity, item.unitPrice, Number(item.quantity) * Number(item.unitPrice)]);
    await client.query("COMMIT");
    res.status(201).json(order.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Unable to create sales order:", error);
    res.status(503).json({ message: "Unable to save sales order. Check PostgreSQL and migration status." });
  } finally { client.release(); }
};

export const listSalesOrders: RequestHandler = async (_req, res) => {
  await queryOr503(res, "Unable to load sales orders", `SELECT so.*, c.name AS customer_name,
    COUNT(soi.id)::int AS item_count
    FROM sales_orders so LEFT JOIN contacts c ON c.id = so.contact_id
    LEFT JOIN sales_order_items soi ON soi.order_id = so.id
    WHERE so.organization_id = 'demo'
    GROUP BY so.id, c.name ORDER BY so.created_at DESC`);
};

export const erpReport: RequestHandler = async (_req, res) => {
  if (!pool) return res.status(503).json({ message: "PostgreSQL is not configured." });
  try {
    const [contacts, products, orders, expenses, invoices] = await Promise.all([
      pool.query("SELECT COUNT(*)::int AS count FROM contacts WHERE organization_id = 'demo'"),
      pool.query("SELECT COUNT(*)::int AS count, COALESCE(SUM(stock_quantity * cost_price), 0) AS inventory_value FROM products WHERE organization_id = 'demo' AND active = true"),
      pool.query("SELECT COUNT(*)::int AS count, COALESCE(SUM(total), 0) AS value FROM sales_orders WHERE organization_id = 'demo' AND status <> 'cancelled'"),
      pool.query("SELECT COUNT(*)::int AS count, COALESCE(SUM(amount), 0) AS value FROM expenses WHERE organization_id = 'demo' AND status <> 'rejected'"),
      pool.query("SELECT COUNT(*)::int AS count, COALESCE(SUM(amount_idr) FILTER (WHERE status = 'paid'), 0) AS paid_value FROM erp_invoices"),
    ]);
    res.json({ contacts: contacts.rows[0], products: products.rows[0], salesOrders: orders.rows[0], expenses: expenses.rows[0], invoices: invoices.rows[0] });
  } catch (error) { console.error("ERP report failed:", error); res.status(503).json({ message: "Unable to load ERP report." }); }
};

export const updateContact: RequestHandler = async (req, res) => {
  const { kind, name, email, phone, address, taxId } = req.body ?? {};
  if (!isNonEmpty(name) || !["customer", "vendor", "both"].includes(kind)) return res.status(400).json({ message: "A contact name and valid contact type are required." });
  await updateRecord(res, "contact", "UPDATE contacts SET kind = $2, name = $3, email = $4, phone = $5, address = $6, tax_id = $7 WHERE id = $1 AND organization_id = 'demo' RETURNING *", [req.params.id, kind, name.trim(), email ?? null, phone ?? null, address ?? null, taxId ?? null]);
};

export const deleteContact: RequestHandler = async (req, res) => {
  await deleteRecord(res, "contact", "DELETE FROM contacts WHERE id = $1 AND organization_id = 'demo' RETURNING id", [req.params.id]);
};

export const updateProduct: RequestHandler = async (req, res) => {
  const { sku, name, description, unit = "unit", salePrice, costPrice, stockQuantity } = req.body ?? {};
  if (!isNonEmpty(sku) || !isNonEmpty(name) || !validNonNegative(salePrice) || !validNonNegative(costPrice) || !validNonNegative(stockQuantity)) return res.status(400).json({ message: "SKU, product name, and valid non-negative prices and stock are required." });
  await updateRecord(res, "product", "UPDATE products SET sku = $2, name = $3, description = $4, unit = $5, sale_price = $6, cost_price = $7, stock_quantity = $8 WHERE id = $1 AND organization_id = 'demo' AND active = true RETURNING *", [req.params.id, sku.trim(), name.trim(), description ?? null, unit, salePrice, costPrice, stockQuantity]);
};

export const deleteProduct: RequestHandler = async (req, res) => {
  await updateRecord(res, "product", "UPDATE products SET active = false WHERE id = $1 AND organization_id = 'demo' AND active = true RETURNING id", [req.params.id]);
};

export const updateExpense: RequestHandler = async (req, res) => {
  const { description, category, amount, currency = "IDR", expenseDate, contactId, status } = req.body ?? {};
  if (!isNonEmpty(description) || !isNonEmpty(category) || !validPositive(amount) || !["submitted", "approved", "paid", "rejected"].includes(status)) return res.status(400).json({ message: "Enter valid expense details, amount, and status." });
  await updateRecord(res, "expense", "UPDATE expenses SET description = $2, category = $3, amount = $4, currency = $5, expense_date = $6, contact_id = $7, status = $8 WHERE id = $1 AND organization_id = 'demo' RETURNING *", [req.params.id, description.trim(), category.trim(), amount, currency, expenseDate, contactId || null, status]);
};

export const deleteExpense: RequestHandler = async (req, res) => {
  await deleteRecord(res, "expense", "DELETE FROM expenses WHERE id = $1 AND organization_id = 'demo' RETURNING id", [req.params.id]);
};

export const updateSalesOrder: RequestHandler = async (req, res) => {
  const { status, contactId } = req.body ?? {};
  if (!["draft", "confirmed", "fulfilled", "cancelled"].includes(status)) return res.status(400).json({ message: "Choose a valid sales order status." });
  await updateRecord(res, "sales order", "UPDATE sales_orders SET status = $2, contact_id = $3 WHERE id = $1 AND organization_id = 'demo' RETURNING *", [req.params.id, status, contactId || null]);
};

export const deleteSalesOrder: RequestHandler = async (req, res) => {
  await deleteRecord(res, "sales order", "DELETE FROM sales_orders WHERE id = $1 AND organization_id = 'demo' RETURNING id", [req.params.id]);
};

async function queryOr503(res: Parameters<RequestHandler>[1], message: string, text: string, values: unknown[] = [], status = 200) {
  if (!pool) return res.status(503).json({ message: "PostgreSQL is not configured." });
  try { const result = await pool.query(text, values); return res.status(status).json(result.rows); }
  catch (error) {
    console.error(`${message}:`, error instanceof Error ? error.message : error);
    const duplicate = hasPgCode(error, "23505");
    return res.status(duplicate ? 409 : 503).json({ message: duplicate ? "A record with the same unique value already exists." : `${message}. Run pnpm db:migrate after configuring PostgreSQL.` });
  }
}

async function updateRecord(res: Parameters<RequestHandler>[1], label: string, text: string, values: unknown[]) {
  if (!pool) return res.status(503).json({ message: "PostgreSQL is not configured." });
  try {
    const result = await pool.query(text, values);
    if (!result.rows[0]) return res.status(404).json({ message: `${capitalize(label)} not found.` });
    return res.json(result.rows[0]);
  } catch (error) {
    console.error(`Unable to update ${label}:`, error instanceof Error ? error.message : error);
    const duplicate = hasPgCode(error, "23505");
    return res.status(duplicate ? 409 : 503).json({ message: duplicate ? "A record with the same unique value already exists." : `Unable to update ${label}. Check PostgreSQL and migration status.` });
  }
}

async function deleteRecord(res: Parameters<RequestHandler>[1], label: string, text: string, values: unknown[]) {
  if (!pool) return res.status(503).json({ message: "PostgreSQL is not configured." });
  try {
    const result = await pool.query(text, values);
    if (!result.rows[0]) return res.status(404).json({ message: `${capitalize(label)} not found.` });
    return res.status(204).end();
  } catch (error) {
    console.error(`Unable to delete ${label}:`, error instanceof Error ? error.message : error);
    const referenced = hasPgCode(error, "23503");
    return res.status(referenced ? 409 : 503).json({ message: referenced ? `This ${label} is referenced by other records and cannot be deleted.` : `Unable to delete ${label}. Check PostgreSQL and migration status.` });
  }
}

function isNonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validNonNegative(value: unknown) {
  return Number.isFinite(Number(value)) && Number(value) >= 0;
}

function validPositive(value: unknown) {
  return Number.isFinite(Number(value)) && Number(value) > 0;
}

function hasPgCode(error: unknown, code: string) {
  return typeof error === "object" && error !== null && "code" in error && error.code === code;
}

function capitalize(value: string) {
  return value[0].toUpperCase() + value.slice(1);
}