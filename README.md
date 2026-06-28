# Shivay Textiles — Enterprise Textile Factory ERP

A full-stack ERP for textile manufacturing: workforce, machines, production, inventory,
procurement, sales, quality control, dispatch, and factory operations — 42 modules in total.

## Architecture

- **Backend**: Node.js + Express, Clean Architecture (Controller → Service → Repository → DB)
- **Frontend**: React + Vite, Tailwind CSS + Material UI tokens
- **Database**: PostgreSQL (38 tables, 25 enums, full FK graph)
- **Auth**: JWT access + refresh tokens, RBAC (5 roles: Owner, Manager, Supervisor, Worker, Accountant)
- **Storage**: Cloudinary (for receipts, photos, logos)

## Project Structure

```
textile-erp/
├── backend/           Express API (src/{controllers,services,repositories,routes,middleware,db})
└── frontend/          React app (src/{pages,components,api,store,hooks,layouts,routes})
```

## Local Setup

### 1. Database

Create a PostgreSQL 16 database (locally or via a managed provider):

```bash
createdb textile_erp
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# edit .env: set DATABASE_URL, JWT secrets, Cloudinary credentials
npm install
npm run migrate      # applies all migrations in order
npm run seed         # creates demo users, departments, machines, etc.
npm run dev          # starts on http://localhost:5000
```

Swagger API docs are available at `http://localhost:5000/api-docs` once running.

**Demo logins (after seeding):**
| Role | Email | Password |
|---|---|---|
| Owner | owner@textileerp.com | Owner@12345 |
| Manager | manager@textileerp.com | Demo@12345 |
| Supervisor | supervisor@textileerp.com | Demo@12345 |
| Accountant | accountant@textileerp.com | Demo@12345 |
| Worker | worker@textileerp.com | Demo@12345 |

### 3. Frontend

```bash
cd frontend
cp .env.example .env
# edit .env: set VITE_API_BASE_URL to your backend URL
npm install
npm run dev          # starts on http://localhost:5173
```

## Deployment

- **Frontend → Vercel**: `vercel.json` is included; connect the `frontend/` directory as the project root, set `VITE_API_BASE_URL` to your deployed backend's `/api` URL.
- **Backend → Render**: `render.yaml` is included (Blueprint deploy). It provisions a managed Postgres instance and runs migrations automatically on each deploy via `npm run migrate && npm start`. Set `DATABASE_URL`, `FRONTEND_URL`, and Cloudinary credentials in the Render dashboard (marked `sync: false` in the blueprint).

After first deploy, run the seed script once via Render's shell (or a one-off job):
```bash
npm run seed
```

## Module List (42)

Authentication · Dashboard · Factory Settings · Departments · Employees · Attendance ·
Leave Management · Payroll · Machine Management · Machine Logs · Machine Breakdown ·
Machine Maintenance · Beam Management · Beam Allocation · Fabric Design · Production Planning ·
Work Orders · Production Orders · Daily Production Entry · Fabric Roll Management · Inventory ·
Inventory Transactions · Raw Material Consumption · Suppliers · Purchase Orders · Purchase Order
Items · Customers · Sales Orders · Sales Order Items · Quality Control · Packing · Dispatch ·
Dispatch Items · Vehicle Management · Expense Management · Electricity Monitoring · Water
Monitoring · Worker Productivity · Waste Management · Reports · Notifications · Audit Logs

## Known Limitations

- Built and syntax-verified in a sandboxed environment without live network or a running Postgres
  instance — migrations and module wiring were checked structurally (FK ordering, every JS/JSX
  import resolves, every sidebar route has a matching router entry) but have not been executed
  end-to-end against a live database. Run `npm run migrate && npm run seed` and exercise the app
  before relying on it in production.
- "Reports" (module 40) is served via per-module CSV/Excel/PDF export buttons and the Dashboard's
  aggregate metrics/charts rather than a single dedicated "Reports" page; this covers the same
  ground but you may want a consolidated report-builder UI for management presentations.
