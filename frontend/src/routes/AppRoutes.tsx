import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import DashboardLayout from '../layouts/DashboardLayout'
import LoginPage from '../pages/login/LoginPage'

// Vendor
import { VendorDashboard, VendorRegister, VendorHistory, VendorRegistrationStatus } from '../pages/vendor/VendorPages'

// Employee
import { EmployeeDashboard, CreateVendor, MyVendors, RegisterYourself, MyApprovers, MyProfile } from '../pages/employee/EmployeePages'

// Admin + SAP
import {
  AdminDashboard, AdminRequests, AdminVendors, AdminWorkflow, AdminVendorApproval,
  SapDashboard, ExportVendor, ImportVendor,
} from '../pages/admin/AdminSapPages'

// ── Sidebar nav definitions ───────────────────────────────────────────────────
const VENDOR_NAV = [
  { path: '/vendor/dashboard', label: 'Dashboard',               icon: 'dashboard' },
  { path: '/vendor/register',  label: 'Register',                icon: 'register' },
  { path: '/vendor/history',   label: 'History of Applications', icon: 'history' },
  { path: '/vendor/status',    label: 'Registration Status',     icon: 'status' },
]
const EMPLOYEE_NAV = [
  { path: '/employee/dashboard',         label: 'Dashboard',             icon: 'dashboard' },
  { path: '/employee/create-vendor',     label: 'Create Vendors',        icon: 'create' },
  { path: '/employee/my-vendors',        label: 'My Vendors',            icon: 'vendors' },
  { path: '/employee/register-yourself', label: 'Register For Yourself', icon: 'self' },
  { path: '/employee/my-approvers',      label: 'My Approvers',          icon: 'approvers' },
]
const ADMIN_NAV = [
  { path: '/admin/dashboard', label: 'Dashboard',        icon: 'dashboard' },
  { path: '/admin/requests',  label: 'List of Requests', icon: 'requests' },
  { path: '/admin/vendors',   label: 'All Vendors',      icon: 'vendorsAdmin' },
  { path: '/admin/workflow',  label: 'Workflow Config',  icon: 'workflow' },
]
const SAP_NAV = [
  { path: '/sap/dashboard',          label: 'Dashboard',          icon: 'dashboard' },
  { path: '/sap/export-vendor-data', label: 'Export Vendor Data', icon: 'export' },
  { path: '/sap/import-vendor-data', label: 'Import Vendor Data', icon: 'import' },
]

const HOME_BY_ROLE: Record<string, string> = {
  vendor:   '/vendor/dashboard',
  employee: '/employee/dashboard',
  admin:    '/admin/dashboard',
  sap:      '/sap/dashboard',
}

const ROLE_COLORS: Record<string, string> = {
  vendor: '#0e9f6e', employee: '#1a56db', admin: '#7c3aed', sap: '#d97706',
}

// ── Protected route wrapper ───────────────────────────────────────────────────
function Guard({ children, role }: { children: React.ReactNode; role: string }) {
  const { user, isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role !== role) return <Navigate to={HOME_BY_ROLE[user?.role || ''] || '/login'} replace />
  return <>{children}</>
}

// ── Public Vendor Registration wrapper ───────────────────────────────────────
// Renders VendorRegister directly without any auth requirement.
// Shown in a minimal shell (no sidebar) so the vendor just sees the form.
function PublicVendorRegister() {
  const [searchParams] = useSearchParams()
  const token   = searchParams.get('token')
  const company = searchParams.get('company')

  return (
    <div style={{ minHeight: '100vh', background: '#f4f6fb', padding: '24px 16px' }}>
      {/* Minimal branded header */}
      <div style={{
        maxWidth: 900, margin: '0 auto 24px',
        display: 'flex', alignItems: 'center', gap: 14,
        background: '#fff', borderRadius: 12, padding: '14px 20px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
      }}>
        <img src="/companylogo.svg" alt="Logo" style={{ height: 36 }} />
        <div>
          <p style={{ fontWeight: 700, fontSize: 15, color: '#1e293b', margin: 0 }}>
            Hinduja Renewables – Vendor Registration Portal
          </p>
          {company && (
            <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
              You have been invited to register as a vendor · Company: <strong>{decodeURIComponent(company)}</strong>
            </p>
          )}
        </div>
        {token && (
          <span style={{
            marginLeft: 'auto', fontSize: 11, color: '#0e9f6e', fontWeight: 600,
            background: '#d1fae5', padding: '3px 10px', borderRadius: 20,
          }}>🔗 Secure Invite Link</span>
        )}
      </div>

      {/* The full registration form — token is read from URL inside VendorRegister */}
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <VendorRegister />
      </div>
    </div>
  )
}

// ── App Routes ────────────────────────────────────────────────────────────────
export default function AppRoutes() {
  const { isAuthenticated, user } = useAuth()

  return (
    <BrowserRouter>
      <Routes>

        {/* ── Public routes (no auth required) ── */}

        {/* Login */}
        <Route path="/login" element={
          isAuthenticated
            ? <Navigate to={HOME_BY_ROLE[user?.role || ''] || '/login'} replace />
            : <LoginPage />
        } />

        {/* Public vendor registration via invite link
            Vendor opens:  /vendor/register?token=XXX&company=YYY
            No login required — this is the invite flow */}
        <Route path="/vendor/register" element={
          // If already logged-in vendor, show inside dashboard; else show public shell
          isAuthenticated && user?.role === 'vendor'
            ? <Guard role="vendor">
                <DashboardLayout navItems={VENDOR_NAV} pageTitle="Vendor Registration Portal" roleLabel="Vendor" roleColor={ROLE_COLORS.vendor} />
              </Guard>
            : <PublicVendorRegister />
        } />

        {/* Root redirect */}
        <Route path="/" element={
          isAuthenticated
            ? <Navigate to={HOME_BY_ROLE[user?.role || ''] || '/login'} replace />
            : <Navigate to="/login" replace />
        } />

        {/* ── Vendor (authenticated) ── */}
        <Route element={
          <Guard role="vendor">
            <DashboardLayout navItems={VENDOR_NAV} pageTitle="Vendor Registration Portal" roleLabel="Vendor" roleColor={ROLE_COLORS.vendor} />
          </Guard>
        }>
          <Route path="/vendor/dashboard" element={<VendorDashboard />} />
          {/* /vendor/register is handled above as a shared public+auth route */}
          <Route path="/vendor/history"   element={<VendorHistory />} />
          <Route path="/vendor/status"    element={<VendorRegistrationStatus />} />
        </Route>

        {/* ── Employee ── */}
        <Route element={
          <Guard role="employee">
            <DashboardLayout navItems={EMPLOYEE_NAV} pageTitle="Vendor Registration Portal" roleLabel="Employee" roleColor={ROLE_COLORS.employee} />
          </Guard>
        }>
          <Route path="/employee/dashboard"         element={<EmployeeDashboard />} />
          <Route path="/employee/create-vendor"     element={<CreateVendor />} />
          <Route path="/employee/my-vendors"        element={<MyVendors />} />
          <Route path="/employee/register-yourself" element={<RegisterYourself />} />
          <Route path="/employee/my-approvers"      element={<MyApprovers />} />
          <Route path="/employee/profile"           element={<MyProfile />} />
        </Route>

        {/* ── Admin ── */}
        <Route element={
          <Guard role="admin">
            <DashboardLayout navItems={ADMIN_NAV} pageTitle="Admin Panel – Vendor Portal" roleLabel="Admin" roleColor={ROLE_COLORS.admin} />
          </Guard>
        }>
          <Route path="/admin/dashboard"           element={<AdminDashboard />} />
          <Route path="/admin/requests"            element={<AdminRequests />} />
          <Route path="/admin/vendors"             element={<AdminVendors />} />
          <Route path="/admin/workflow"            element={<AdminWorkflow />} />
          <Route path="/admin/vendor-approval/:id" element={<AdminVendorApproval />} />
        </Route>

        {/* ── SAP ── */}
        <Route element={
          <Guard role="sap">
            <DashboardLayout navItems={SAP_NAV} pageTitle="SAP Integration – Vendor Portal" roleLabel="SAP User" roleColor={ROLE_COLORS.sap} />
          </Guard>
        }>
          <Route path="/sap/dashboard"          element={<SapDashboard />} />
          <Route path="/sap/export-vendor-data" element={<ExportVendor />} />
          <Route path="/sap/import-vendor-data" element={<ImportVendor />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={
          isAuthenticated
            ? <Navigate to={HOME_BY_ROLE[user?.role || ''] || '/login'} replace />
            : <Navigate to="/login" replace />
        } />

      </Routes>
    </BrowserRouter>
  )
}
