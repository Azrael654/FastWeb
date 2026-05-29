# Fast Print - E-Commerce & Management Platform

A high-performance, Server-Side Rendered (SSR) web application built for **Fast Print**, an e-commerce printing business. This platform features a dynamic customer-facing storefront and a comprehensive, highly-secured admin dashboard for managing orders, inventory, finances, dynamic marketing pop-ups, and granular role-based access control (RBAC).

## 🚀 Tech Stack

- **Framework**: [Astro 6](https://astro.build/) (Server-Side Rendering / Node.js Adapter)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with native CSS variables for extreme flexibility.
- **Database**: PostgreSQL (Standard / Self-hosted)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Storage**: Local File System (via `/api/upload`)
- **Authentication**: Custom JWT-based authentication with `bcryptjs` and Astro Middleware.
- **Rich Text**: EasyMDE (Markdown editor for Blog Management)

## ✨ Core Features

### 🛒 Storefront
- **High-Performance SSR**: Fast initial page loads and excellent SEO.
- **Dynamic Cart**: Persistent cart state.
- **Marketing Pop-ups**: Dual-mode pop-up system (Rich Content vs. Bare Banner Image) with session-based display rules.

### 🛡️ Admin Dashboard & RBAC
- **Advanced Role-Based Access Control**: Granular matrix permissions. Every custom role can be configured per module (`orders`, `products`, `finance`, `users`, etc.) with specific `view`, `add`, `edit`, and `delete` capabilities.
- **Middleware Protection**: `src/middleware.ts` intercepts invalid role accesses before they hit the page.
- **Action-Level Security**: API endpoints strictly validate JWT payloads against DB-stored permissions.

### 📦 Logistics & Inventory
- **Raw Material Tracking**: Monitor min-stock thresholds.
- **Order Management**: Transition orders from `pending` -> `processing` -> `shipped` -> `delivered`.
- **Manual Shipping Workflows**: Support for manual courier/logistics shipping fee configurations.

### 💰 Finance & CRM
- **Accounts & Balances**: Track incoming revenue and multi-account balances.
- **Dashboard Analytics**: Real-time aggregation of monthly revenue, pending orders, and low-stock alerts.

---

## 🛠️ Environment Variables

Create a `.env` file in the root directory and configure the following variables:

```env
# Prisma / PostgreSQL Connection (Standard Postgres)
DATABASE_URL="postgresql://user:password@localhost:5432/fastweb"

# Authentication
JWT_SECRET="your_super_secret_jwt_key_here"

# Application Settings
NODE_ENV="development" # or "production"
```

### ☁️ Optional: Migrating to Supabase

If you wish to use **Supabase** as your managed PostgreSQL database provider instead of a local/standard PostgreSQL instance:

1. Create a Supabase project and fetch your connection strings from Database Settings.
2. Update your `.env` to include both a pooled `DATABASE_URL` and a direct `DIRECT_URL`.
3. Open `prisma/schema.prisma` and ensure you have `directUrl` configured in your datasource:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

**Supabase `.env` Example:**
```env
DATABASE_URL="postgresql://postgres.[YOUR_PROJECT_REF]:[YOUR_PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[YOUR_PROJECT_REF]:[YOUR_PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
```

## 💻 Local Development

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Database Setup**
   Push the Prisma schema to your PostgreSQL database.
   *(Note: On Windows, ensure your dev server is stopped when regenerating the Prisma Client to avoid `EPERM` lock errors).*
   ```bash
   npx prisma db push
   npx prisma generate
   ```

3. **Start the Development Server**
   ```bash
   npm run dev -- --host
   ```
   The application will be available at `http://localhost:4321`.

---

## 📂 Project Structure

```text
├── prisma/
│   └── schema.prisma         # Database schema & models
├── src/
│   ├── components/           # Reusable Astro components (Storefront & Admin)
│   ├── layouts/              # Core layouts (MainLayout, AdminLayout)
│   ├── lib/                  # Shared utilities (auth.ts, prisma.ts, etc.)
│   ├── pages/                # Astro routing (File-based router)
│   │   ├── admin/            # Protected admin views
│   │   ├── api/              # Backend API endpoints
│   │   └── index.astro       # Storefront homepage
│   └── middleware.ts         # Global request interceptor & RBAC enforcer
├── public/                   # Static assets (images, icons)
├── astro.config.mjs          # Astro configuration (Node adapter enabled)
├── tailwind.config.mjs       # Tailwind configuration
└── package.json
```

## 🔒 Security Architecture

### Authentication Flow
1. User logs in via `POST /api/auth/login`.
2. Password is verified via `bcryptjs`.
3. A JWT (`fp_session`) containing `{ id, email, name, role }` is signed using `jsonwebtoken` and stored in an `httpOnly`, `lax` SameSite cookie.

### Authorization (Middleware & Helpers)
- **`middleware.ts`**: Runs on every request. For paths matching `/admin/*`, it reads the JWT, queries the active `Role` from PostgreSQL, and explicitly verifies if the user has `view` permissions for that specific module (e.g., `/admin/finance`). Unprivileged users are met with a `302` redirect.
- **`checkPermission()`**: Used inside `APIRoutes` (e.g., `POST /api/users`) to enforce granular `add`, `edit`, and `delete` actions, guaranteeing UI states cannot be bypassed by malicious API requests.

## 🚢 Deployment

This project is configured with the `@astrojs/node` adapter, allowing it to be deployed as a standalone Node.js server.

1. **Build the Application**
   ```bash
   npm run build
   ```
2. **Start the Production Server**
   ```bash
   node ./dist/server/entry.mjs
   # Or using the start script
   npm run start
   ```

### Deployment Platforms
- **Vercel / Netlify**: Simply swap the `@astrojs/node` adapter for `@astrojs/vercel` or `@astrojs/netlify` in `astro.config.mjs`.
- **VPS / Docker**: Serve the built `dist` folder using a PM2 process manager or Docker container running Node 20+.

---
*Built for scale, speed, and security.*
