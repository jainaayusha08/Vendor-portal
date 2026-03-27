// ─────────────────────────────────────────────────────────────────────────────
// API UTILITY  –  All backend calls go through here
// Base URL is read from VITE_API_URL env var; falls back to /api for proxy.
// ─────────────────────────────────────────────────────────────────────────────

const BASE = ((import.meta as any).env.VITE_API_URL as string | undefined) ?? '/api'

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  isBlob = false,
): Promise<T> {
  const session = localStorage.getItem('vrp.session')
  let token: string | undefined
  try { token = session ? JSON.parse(session)?.token : undefined } catch { /* noop */ }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    let msg = res.statusText
    try { const j = await res.json(); msg = j.detail ?? j.message ?? msg } catch { /* noop */ }
    throw new Error(msg)
  }

  if (isBlob) return res.blob() as unknown as T
  return res.json() as Promise<T>
}

export const api = {
  get:      <T>(path: string)                    => request<T>('GET',    path),
  post:     <T>(path: string, body: unknown)     => request<T>('POST',   path, body),
  put:      <T>(path: string, body: unknown)     => request<T>('PUT',    path, body),
  postBlob:     (path: string, body: unknown)    => request<Blob>('POST', path, body, true),
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface RegisterEmployeePayload {
  name: string
  email: string
  password: string
  department?: string
  /** Always sent as 'EMPLOYEE' – never set by user */
  role: 'EMPLOYEE'
}

export interface VendorInvitePayload {
  vendor_name: string
  vendor_company_name: string
  vendor_email: string
}

export interface VendorInviteResponse {
  token: string
  invite_link: string
  message: string
}

export interface VendorRegisterPayload {
  token?: string                // from invite link query-param
  vendor_type: string
  vendor_name: string
  service_type?: string
  contact_name: string
  contact_phone: string
  contact_email: string
  house_no: string
  street: string
  district: string
  city: string
  postal_code: string
  country: string
  pan: string
  gst?: string
  tan?: string
  withholding_tax?: string
  bank_name: string
  account_no: string
  ifsc: string
  branch_address?: string
  msme?: boolean
  msme_no?: string
}

export interface AdminApprovePayload {
  company_code: string
  reconciliation_account: string
  vendor_group: string
  tax_type: string
  tax_code: string
  payment_terms: string
  payment_method: string
  action: 'approve' | 'reject'
  remarks?: string
}

export interface VendorRequest {
  id: string | number
  ticket_number: string
  vendor_name: string
  vendor_type: string
  status: 'link_sent' | 'form_submitted' | 'l1_pending' | 'l2_pending' | 'l3_pending' | 'completed' | 'rejected' | 'returned'
  created_at: string
  rejection_reason?: string
  // Full detail fields
  first_name?: string
  last_name?: string
  company_name?: string
  email?: string
  contact_phone?: string
  city?: string
  country?: string
  pan_number?: string
  gst_number?: string
  bank_name?: string
  account_no?: string
  ifsc_code?: string
}

export interface ApprovedVendor extends VendorRequest {
  // Admin-filled SAP fields
  company_code?: string
  reconciliation_account?: string
  vendor_group?: string
  tax_type?: string
  tax_code?: string
  payment_terms?: string
  payment_method?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

/** POST /api/auth/register/  – employee self-registration */
export const registerEmployee = (data: RegisterEmployeePayload) =>
  api.post<{ message: string; user_id: number }>('/auth/register/', data)

/** POST /api/vendors/create/  – employee creates invite link */
export const createVendorInvite = (data: VendorInvitePayload) =>
  api.post<VendorInviteResponse>('/vendors/create/', data)

/** POST /api/vendors/register/submit/  – vendor submits registration form */
export const registerVendor = (data: VendorRegisterPayload) =>
  api.post<{ ticket_number: string; message: string }>('/vendors/register/submit/', data)

/** GET /api/vendors/  – list all vendors (SAP user: approved ones) */
export const getVendors = (status?: string) =>
  api.get<ApprovedVendor[]>(status ? `/vendors/?status=${status}` : '/vendors/')

/** GET /api/vendors/:id/  – fetch single vendor for admin approval form */
export const getVendorById = (id: string | number) =>
  api.get<ApprovedVendor>(`/vendors/${id}/`)

/** PUT /api/vendors/:id/admin-fields/  – admin fills SAP fields + approves */
export const adminApproveVendor = (id: string | number, data: AdminApprovePayload) =>
  api.put<{ message: string }>(`/vendors/${id}/admin-fields/`, data)

/** POST /api/vendors/export/  – SAP user exports selected vendors → blob */
export const exportSelectedVendors = (vendorIds: number[]) =>
  api.postBlob('/vendors/export/', { vendor_ids: vendorIds })

/** GET /api/workflow/config/  – get global workflow configuration */
export const getWorkflowConfig = () =>
  api.get<any[]>('/workflow/config/')

// ─────────────────────────────────────────────────────────────────────────────
// SAP TEMPLATE COLUMN MAPPING
// ─────────────────────────────────────────────────────────────────────────────
// Adjust the keys/headers below to match your actual SAP template exactly.

export const SAP_COLUMN_MAP: Array<{ header: string; field: keyof ApprovedVendor | string }> = [
  { header: 'Ticket Number',          field: 'ticket_number' },
  { header: 'Name 1 (Company Name)',  field: 'company_name' },
  { header: 'First Name',             field: 'first_name' },
  { header: 'Last Name',              field: 'last_name' },
  { header: 'Email',                  field: 'email' },
  { header: 'Phone',                  field: 'contact_phone' },
  { header: 'Vendor Type',            field: 'vendor_type' },
  { header: 'Company Code',           field: 'company_code' },
  { header: 'Reconciliation Account', field: 'reconciliation_account' },
  { header: 'Vendor Group',           field: 'vendor_group' },
  { header: 'Tax Type',               field: 'tax_type' },
  { header: 'Tax Code',               field: 'tax_code' },
  { header: 'Payment Terms',          field: 'payment_terms' },
  { header: 'Payment Method',         field: 'payment_method' },
  { header: 'PAN',                    field: 'pan' },
  { header: 'GST',                    field: 'gst' },
  { header: 'City',                   field: 'city' },
  { header: 'Country',                field: 'country' },
  { header: 'Bank Name',              field: 'bank_name' },
  { header: 'Account Number',         field: 'account_no' },
  { header: 'IFSC Code',              field: 'ifsc' },
]

/** Build CSV string from vendors list using SAP_COLUMN_MAP */
export function buildSapCsv(vendors: ApprovedVendor[]): string {
  const headers = SAP_COLUMN_MAP.map(c => `"${c.header}"`).join(',')
    const rows = vendors.map(v =>
    SAP_COLUMN_MAP.map(c => {
      const val = (v as any)[c.field] ?? ''
      return `"${String(val).replace(/"/g, '""')}"`
    }).join(',')
  )
  return [headers, ...rows].join('\r\n')
}

/** Trigger browser file download */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href    = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** Client-side CSV download (used if backend returns JSON instead of blob) */
export function downloadCsv(vendors: ApprovedVendor[], filename = 'sap_vendor_export.csv') {
  const csv  = buildSapCsv(vendors)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  downloadBlob(blob, filename)
}
