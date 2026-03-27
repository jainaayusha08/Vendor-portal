// ─── Types ────────────────────────────────────────────────────────────────
export type UserRole = 'vendor' | 'employee' | 'admin' | 'sap'

export interface User {
  id: number
  name: string
  email: string
  password?: string
  role: UserRole
  company?: string
  phone?: string
  department?: string
}

export interface VendorApplication {
  id: string
  vendorType: string
  submittedDate: string
  status: 'Approved' | 'Pending Approval' | 'Returned' | 'Rejected' | 'Draft'
  remarks: string
}

export interface VendorRequest {
  id: string
  vendorName: string
  vendorType: string
  submittedDate: string
  status: 'Pending Approval' | 'Approved' | 'Returned' | 'Rejected'
}

export interface VendorRecord {
  vendorCode: string
  vendorName: string
  vendorType: string
  company: string
  status: 'Active' | 'Inactive'
}

export interface Approver {
  level: number
  name: string
  role: string
  department: string
  email: string
}

export interface SapRecord {
  ticketId: string
  vendorName: string
  vendorCode: string
  syncStatus: 'Synced' | 'Ready'
  exportDate: string
}

// ─── Mock Users ───────────────────────────────────────────────────────────
export const MOCK_USERS: User[] = [
  { id: 1, name: 'Ravi Kumar',      email: 'vendor@demo.com',           password: 'password123', role: 'vendor',   company: 'RK Electricals Pvt Ltd', phone: '+91 98765 43210', department: '-' },
  { id: 2, name: 'Test Employee',   email: 'emp@hindujarenewables.com', password: 'password123', role: 'employee', company: 'Hinduja Renewables',     phone: '+91 91234 56789', department: 'Procurement' },
  { id: 3, name: 'Test Admin',      email: 'admin@hindujarenewables.com',password: 'password123', role: 'admin',    company: 'Hinduja Renewables',     phone: '+91 99887 76655', department: 'IT' },
  { id: 4, name: 'Test SAP User',   email: 'sap@hindujarenewables.com', password: 'password123', role: 'sap',      company: 'Hinduja Renewables',     phone: '+91 88776 65544', department: 'Finance' },
]

export const VENDOR_TYPES = [
  { value: 'farmer',     label: 'Farmer Vendor',     desc: 'Agricultural land owners or farming cooperatives' },
  { value: 'domestic',   label: 'Domestic Vendor',   desc: 'Indian registered companies providing goods/services' },
  { value: 'foreign',    label: 'Foreign Vendor',    desc: 'International entities providing specialized services' },
  { value: 'government', label: 'Government Vendor', desc: 'Central/State Government departments or PSUs' },
  { value: 'employee',   label: 'Employee Vendor',   desc: 'Hinduja employees registering as service vendors' },
]

export const MOCK_APPLICATIONS: VendorApplication[] = [
  { id: 'VREG-2026-00001', vendorType: 'Domestic Vendor',   submittedDate: '2026-01-10', status: 'Approved',         remarks: 'All documents verified' },
  { id: 'VREG-2026-00002', vendorType: 'MSME Vendor',       submittedDate: '2026-01-14', status: 'Pending Approval', remarks: 'Under L2 review' },
  { id: 'VREG-2026-00003', vendorType: 'Foreign Vendor',    submittedDate: '2026-01-18', status: 'Returned',         remarks: 'GST mismatch detected' },
  { id: 'VREG-2026-00004', vendorType: 'Farmer Vendor',     submittedDate: '2026-02-01', status: 'Draft',            remarks: '-' },
  { id: 'VREG-2026-00005', vendorType: 'Government Vendor', submittedDate: '2026-02-08', status: 'Rejected',         remarks: 'Incomplete documents' },
]

export const MOCK_VENDOR_REQUESTS: VendorRequest[] = [
  { id: 'VREG-2026-00010', vendorName: 'Anand Traders',     vendorType: 'Domestic',   submittedDate: '2026-01-20', status: 'Pending Approval' },
  { id: 'VREG-2026-00011', vendorName: 'SolarTech Pvt Ltd', vendorType: 'Domestic',   submittedDate: '2026-01-22', status: 'Pending Approval' },
  { id: 'VREG-2026-00012', vendorName: 'Green Energy Intl', vendorType: 'Foreign',    submittedDate: '2026-01-25', status: 'Approved' },
  { id: 'VREG-2026-00013', vendorName: 'Kisan Co-op',       vendorType: 'Farmer',     submittedDate: '2026-02-02', status: 'Returned' },
  { id: 'VREG-2026-00014', vendorName: 'MH State Govt',     vendorType: 'Government', submittedDate: '2026-02-05', status: 'Pending Approval' },
  { id: 'VREG-2026-00015', vendorName: 'ABC Electronics',   vendorType: 'Domestic',   submittedDate: '2026-02-10', status: 'Rejected' },
]

export const MOCK_ALL_VENDORS: VendorRecord[] = [
  { vendorCode: 'V-10001', vendorName: 'Anand Traders',     vendorType: 'Domestic',   company: 'Anand Trading Co',       status: 'Active' },
  { vendorCode: 'V-10002', vendorName: 'Green Energy Intl', vendorType: 'Foreign',    company: 'Green Energy GmbH',      status: 'Active' },
  { vendorCode: 'V-10003', vendorName: 'Kisan Co-op',       vendorType: 'Farmer',     company: 'Kisan Cooperative',      status: 'Active' },
  { vendorCode: 'V-10004', vendorName: 'RK Electricals',    vendorType: 'Domestic',   company: 'RK Electricals Pvt Ltd', status: 'Active' },
  { vendorCode: 'V-10005', vendorName: 'SolarTech Pvt Ltd', vendorType: 'Domestic',   company: 'SolarTech Pvt Ltd',      status: 'Inactive' },
  { vendorCode: 'V-10006', vendorName: 'MH Govt Supply',    vendorType: 'Government', company: 'Govt of Maharashtra',    status: 'Active' },
]

export const MOCK_MY_VENDORS = [
  { vendorName: 'Anand Traders',  company: 'Anand Trading Co',  vendorType: 'Domestic', registrationDate: '2026-01-20', status: 'Active' },
  { vendorName: 'SolarTech Ltd',  company: 'SolarTech Pvt Ltd', vendorType: 'Domestic', registrationDate: '2026-01-22', status: 'Pending Approval' },
  { vendorName: 'Kisan Co-op',    company: 'Kisan Cooperative', vendorType: 'Farmer',   registrationDate: '2026-02-02', status: 'Returned' },
]

export const MOCK_APPROVERS: Approver[] = [
  { level: 1, name: 'Amit Sharma', role: 'Department Head',   department: 'Procurement', email: 'amit.s@hindujarenewables.com' },
  { level: 2, name: 'Sanjay Gupta', role: 'Finance Controller', department: 'Finance',     email: 'sanjay.g@hindujarenewables.com' },
  { level: 3, name: 'Rohan Mehta',  role: 'Chief Procurement Officer', department: 'Management', email: 'rohan.m@hindujarenewables.com' },
]

export const MOCK_SAP_VENDORS: SapRecord[] = [
  { ticketId: 'VREG-2026-00012', vendorName: 'Green Energy Intl', vendorCode: 'V-10002', syncStatus: 'Synced', exportDate: '2026-01-28' },
  { ticketId: 'VREG-2026-00001', vendorName: 'RK Electricals',    vendorCode: 'V-10004', syncStatus: 'Synced', exportDate: '2026-01-15' },
  { ticketId: 'VREG-2026-00010', vendorName: 'Anand Traders',     vendorCode: 'V-10001', syncStatus: 'Synced', exportDate: '2026-01-24' },
  { ticketId: 'VREG-2026-00011', vendorName: 'SolarTech Pvt Ltd', vendorCode: '-',       syncStatus: 'Ready',  exportDate: '-' },
  { ticketId: 'VREG-2026-00014', vendorName: 'MH State Govt',     vendorCode: '-',       syncStatus: 'Ready',  exportDate: '-' },
]
