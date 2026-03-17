# Vendor Registration Portal – Hinduja Renewables

A complete enterprise-grade React application for vendor onboarding.

## Tech Stack (matches Archive_2 format)
- **React 18** + **Vite** + **TypeScript**
- **React Router DOM v6** – role-based routing
- **Vanilla CSS** – CSS variables design system (same pattern as Archive_2)
- No UI framework dependencies – pure component CSS

## Quick Start

```bash
npm install
npm start
```

Opens at: **http://localhost:5173**

## Demo Login Credentials

| Role     | Email                | Password        | Login Method        |
|----------|----------------------|-----------------|---------------------|
| Vendor   | vendor@demo.com      | —               | Email → OTP (any 6 digits e.g. 123456) |
| Employee | employee@demo.com    | 123456          | Email + Password    |
| Admin    | admin@demo.com       | 123456          | Email + Password    |
| SAP User | sap@demo.com         | 123456          | Email + Password    |

> SSO button logs in as Employee (mock).

## Routes

| Path | Role | Page |
|------|------|------|
| `/login` | All | Login (Vendor OTP + Employee Password) |
| `/vendor/dashboard` | Vendor | Overview + stats |
| `/vendor/register` | Vendor | 6-step registration wizard |
| `/vendor/history` | Vendor | All submitted applications |
| `/vendor/status` | Vendor | Ticket tracker + workflow diagram |
| `/employee/dashboard` | Employee | Overview |
| `/employee/create-vendor` | Employee | Generate vendor registration links |
| `/employee/my-vendors` | Employee | Vendors created by this employee |
| `/employee/register-yourself` | Employee | Self-register as vendor |
| `/employee/my-approvers` | Employee | L1/L2/L3 approval hierarchy |
| `/employee/profile` | Employee | Editable profile |
| `/admin/dashboard` | Admin | System overview + bar chart |
| `/admin/requests` | Admin | Approve/Reject vendor requests |
| `/admin/vendors` | Admin | All registered vendors |
| `/admin/workflow` | Admin | Workflow level configuration |
| `/sap/dashboard` | SAP | Sync overview |
| `/sap/export-vendor-data` | SAP | Export by type/format |
| `/sap/import-vendor-data` | SAP | Upload CSV mapping |

## Project Structure

```
src/
├── components/
│   ├── DataTable/      # Sortable table component
│   ├── FileUpload/     # Drag & drop file upload
│   ├── FormField/      # Input / Select / Textarea / Checkbox
│   ├── Header/         # Top app bar
│   ├── OtpInput/       # 6-box OTP input
│   ├── Sidebar/        # Collapsible navigation sidebar
│   ├── StatCard/       # Dashboard metric card
│   └── StatusBadge/    # Coloured status pill
├── context/
│   └── AuthContext.tsx # Auth + session (localStorage)
├── layouts/
│   └── DashboardLayout.tsx # Shell: Sidebar + Header + Outlet
├── pages/
│   ├── login/          # Dual-section login page
│   ├── vendor/         # Dashboard, Register, History, Status
│   ├── employee/       # Dashboard, CreateVendor, MyVendors, etc.
│   └── admin/          # Admin + SAP pages (combined file)
├── routes/
│   └── AppRoutes.tsx   # All routes + role guards
└── utils/
    └── mockData.ts     # Types + mock data for all roles
```

## Design System

Follows Archive_2's CSS variable pattern:

```css
--primary-color: #1a56db
--color-success: #0e9f6e
--sidebar-bg:    #0f172a
--bg-color:      #f4f6fb
--card-bg:       #ffffff
--border-color:  #e2e8f0
```

All components use scoped CSS files co-located alongside their `.tsx` file.
