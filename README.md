# Finance ERP

<p align="center">
   <img src="public/logo.png" alt="Finance ERP logo" width="180" />
</p>

<p align="center"><strong>Finance operations and ERP workspace</strong></p>

An ERP and finance operations dashboard built with React, TypeScript, Express, and PostgreSQL. It brings sales operations, expenses, inventory, invoices, and connected finance tools into one web app.

**Repository:** [github.com/madisite/finance-erp](https://github.com/madisite/finance-erp)

## Features

- **Operations dashboard** with ERP reports, record search, loading states, and PostgreSQL-backed summaries.
- **Contacts** for customer and vendor records.
- **Products and stock** with SKU, sale price, cost price, and opening stock.
- **Sales orders** with line items, quantities, unit prices, and tax.
- **Expenses** with categories, dates, currency, and approval status.
- **Invoices and x402 payments** with IDR invoice amounts, USDC quotes, EVM wallet support, and facilitator verification/settlement.
- **Firefly III** account transaction synchronization and finance overview.
- **Kimai** timesheet summary integration.
- **Luma AI** generation requests and status polling.

External integrations are optional. Their server-side credentials must be configured before their features can connect to external services.

## Tech Stack

- React 18, TypeScript, React Router, Vite, and Tailwind CSS
- Express 5 API server
- PostgreSQL with `pg`
- x402 client packages and `viem` for EVM payments
- Vitest and Testing Library
- pnpm

## Requirements

- Node.js 20.19+ or 22.12+
- pnpm 10+
- PostgreSQL 12+

## Getting Started

1. Clone the repository and install dependencies:

   ```bash
   git clone https://github.com/madisite/finance-erp.git
   cd finance-erp
   pnpm install
   ```

2. Create a PostgreSQL role and database. Run these as a PostgreSQL administrator, adjusting the role if needed:

   ```bash
   sudo -u postgres createuser --login --pwprompt northstar_app
   sudo -u postgres createdb --owner=northstar_app northstar
   ```

3. Create a local environment file and set the database URL:

   ```bash
   cp .env.example .env
   ```

   Set `DATABASE_URL` in `.env`, for example:

   ```env
   DATABASE_URL="postgresql://northstar_app:your-password@127.0.0.1:5432/northstar"
   ```

   URL-encode special characters in the password, such as `;` as `%3B` and `@` as `%40`.

4. Check the connection, create/update the schema, and start the app:

   ```bash
   pnpm db:check
   pnpm db:migrate
   pnpm dev
   ```

   Vite serves the application at `http://localhost:8080`. If that port is occupied, Vite selects another available port and prints the URL.

## Demo Sign-In

The sign-in page currently provides a demo account for local development:

```text
Email:    demo@example.com
Password: demo1234
```

This demo authentication is not a production authentication system. Do not deploy it with default demo credentials or rely on the client-side route guard to protect sensitive data. Configure a proper identity provider and server-side authorization before production use.

## Optional Integrations

Configure integrations in the server `.env`; do not prefix secret variables with `VITE_` because Vite exposes those values to browser code.

### Firefly III

Set `FIREFLY_API_URL`, `FIREFLY_TOKEN`, and `FIREFLY_ACCOUNT_ID`. The configured account is synchronized into PostgreSQL by the admin sync endpoint.

### x402 Payments

Set `X402_FACILITATOR_URL`, `X402_NETWORK`, `X402_ASSET`, `X402_RECIPIENT`, and the IDR/USDC quote rate. For Arc Testnet, use `X402_NETWORK="eip155:5042002"`; the wallet connection switches to Arc Testnet and uses `https://rpc.testnet.arc.network`. Override the public RPC endpoint with `VITE_ARC_TESTNET_RPC_URL` if needed. `X402_ASSET` must be the token contract/address expected by the selected network and facilitator. Use a test network and test funds while developing.

### Kimai

Set `KIMAI_API_URL` to the Kimai installation base URL and `KIMAI_API_TOKEN` to an API token with the required timesheet access.

### Luma AI

Set `LUMA_API_KEY`. `LUMA_API_URL`, `LUMA_MODEL`, and `LUMA_RESOLUTION` can be adjusted for the account and API version in use.

## Routes

| Route | Purpose |
| --- | --- |
| `/signin` | Demo sign-in |
| `/dashboard` | Finance dashboard with Firefly, payment, Kimai, and Luma summaries |
| `/operations` | ERP reports, contacts, products, sales orders, and expenses |
| `/erp` | Invoice creation and x402 wallet payments |

## API Overview

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/admin/overview` | Account and transaction overview |
| `POST` | `/api/admin/sync` | Synchronize account data from Firefly III |
| `GET`, `POST` | `/api/erp/contacts` | List and create contacts |
| `GET`, `POST` | `/api/erp/products` | List and create products |
| `GET`, `POST` | `/api/erp/sales-orders` | List and create sales orders |
| `GET`, `POST` | `/api/erp/expenses` | List and create expenses |
| `GET` | `/api/erp/report` | ERP summary metrics |
| `GET`, `POST` | `/api/erp/invoices` | List and create invoices |
| `GET` | `/api/erp/invoices/:id` | Read an invoice |
| `POST` | `/api/erp/invoices/:id/pay` | Request or settle x402 payment |
| `GET` | `/api/integrations/kimai/summary` | Read Kimai timesheet summary |
| `POST`, `GET` | `/api/integrations/luma/generations` | Create and poll Luma generations |

## Development Commands

```bash
pnpm dev          # Run Vite and the Express API
pnpm db:check     # Verify PostgreSQL connectivity
pnpm db:migrate   # Create/update database tables and demo seed data
pnpm typecheck    # Run TypeScript validation
pnpm test         # Run Vitest
pnpm build        # Build client and server bundles
pnpm start        # Run the production server after building
```

## Database

The PostgreSQL schema is defined in `db/migrate.ts`. It creates the demo account, ledger and transaction tables, invoice/payment records, contacts, products, sales orders, and expenses. UUID values are generated by the application, so the migration does not require a superuser-only PostgreSQL extension.

## Security Before Publishing or Deploying

- Never commit `.env`; use `.env.example` as a template and configure secrets in your deployment environment.
- The local `.env` was previously tracked and contains credentials. Rotate its database password and Firefly token before pushing or publishing this repository. Removing `.env` from the current Git index does not remove old values from Git history; if those commits were pushed, rotate the credentials and consider purging the exposed history.
- Replace demo authentication and configure server-side authorization before exposing the app publicly.
- Keep x402 recipient, token address, network, and facilitator configuration correct; test payments on a test network first.

## License

No license has been specified yet. Add a license before accepting external contributions or granting reuse rights.