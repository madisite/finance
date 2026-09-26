import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleAdminOverview, handleDemoAuth, handleFireflySync } from "./routes/admin";
import { handleCreateInvoice, handleDeleteInvoice, handleGetInvoice, handleInvoicePayment, handleListInvoices, handleUpdateInvoice } from "./routes/payments";
import { handleCreateLumaGeneration, handleGetLumaGeneration, handleKimaiSummary } from "./routes/integrations";
import { createContact, createExpense, createProduct, createSalesOrder, deleteContact, deleteExpense, deleteProduct, deleteSalesOrder, erpReport, listContacts, listExpenses, listProducts, listSalesOrders, updateContact, updateExpense, updateProduct, updateSalesOrder } from "./routes/erp";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);
  app.post("/api/auth/demo", handleDemoAuth);
  app.get("/api/admin/overview", handleAdminOverview);
  app.post("/api/admin/sync", handleFireflySync);
  app.post("/api/erp/invoices", handleCreateInvoice);
  app.get("/api/erp/invoices", handleListInvoices);
  app.get("/api/erp/invoices/:id", handleGetInvoice);
  app.put("/api/erp/invoices/:id", handleUpdateInvoice);
  app.delete("/api/erp/invoices/:id", handleDeleteInvoice);
  app.post("/api/erp/invoices/:id/pay", handleInvoicePayment);
  app.get("/api/integrations/kimai/summary", handleKimaiSummary);
  app.post("/api/integrations/luma/generations", handleCreateLumaGeneration);
  app.get("/api/integrations/luma/generations/:id", handleGetLumaGeneration);
  app.get("/api/erp/contacts", listContacts);
  app.post("/api/erp/contacts", createContact);
  app.put("/api/erp/contacts/:id", updateContact);
  app.delete("/api/erp/contacts/:id", deleteContact);
  app.get("/api/erp/products", listProducts);
  app.post("/api/erp/products", createProduct);
  app.put("/api/erp/products/:id", updateProduct);
  app.delete("/api/erp/products/:id", deleteProduct);
  app.get("/api/erp/expenses", listExpenses);
  app.post("/api/erp/expenses", createExpense);
  app.put("/api/erp/expenses/:id", updateExpense);
  app.delete("/api/erp/expenses/:id", deleteExpense);
  app.post("/api/erp/sales-orders", createSalesOrder);
  app.put("/api/erp/sales-orders/:id", updateSalesOrder);
  app.delete("/api/erp/sales-orders/:id", deleteSalesOrder);
  app.get("/api/erp/sales-orders", listSalesOrders);
  app.get("/api/erp/report", erpReport);

  return app;
}
