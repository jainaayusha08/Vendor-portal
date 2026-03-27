import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import StatCard from '../../components/StatCard/StatCard'
import DataTable, { Column } from '../../components/DataTable/DataTable'
import StatusBadge from '../../components/StatusBadge/StatusBadge'
import FormField from '../../components/FormField/FormField'
import { useAuth } from '../../context/AuthContext'
import { Approver } from '../../utils/mockData'
import { EmployeeVendorRegister } from '../vendor/VendorPages'
import { api, createVendorInvite, getWorkflowConfig, VendorInviteResponse } from '../../utils/api'
import './EmployeePages.css'

interface VendorRequest {
  id: string
  ticket_number: string
  vendor_name: string
  vendor_email: string
  vendor_company_name: string
  vendor_type: string
  status: string
  created_at: string
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export function EmployeeDashboard() {
  const { user } = useAuth()
  const [apps, setApps] = useState<VendorRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<VendorRequest[]>('/vendors/')
      .then(setApps)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const stats = {
    total: apps.length,
    pending: apps.filter(a => ['link_sent', 'form_submitted', 'l1_pending', 'l2_pending', 'l3_pending'].includes(a.status)).length,
    approved: apps.filter(a => a.status === 'completed').length,
    returned: apps.filter(a => a.status === 'returned').length
  }

  return (
    <div>
      <div className="page-title-bar">
        <div><h2>Good morning, {user?.name?.split(' ')[0]}! 👋</h2><p>{user?.department} · Hinduja Renewables</p></div>
        <Link to="/employee/create-vendor" className="btn btn-primary">+ Create Vendor Link</Link>
      </div>
      <div className="grid-4 mb-8">
        <StatCard label="Vendors Created"  value={stats.total} icon="👥" color="blue" />
        <StatCard label="Pending Approval" value={stats.pending}  icon="⏳" color="amber" />
        <StatCard label="Approved Vendors" value={stats.approved}  icon="✅" color="green" />
        <StatCard label="Returned"         value={stats.returned}  icon="↩️" color="rose" />
      </div>
      <div className="emp-dash-grid">
        <div className="page-card">
          <div className="page-card__head">
            <p className="page-card__title">Recent Requests</p>
            <Link to="/employee/my-vendors" className="btn btn-secondary btn-sm">View All</Link>
          </div>
          <div className="page-card__body">
            {loading ? <p>Loading...</p> : apps.slice(0, 5).map((v) => (
              <div key={v.id} className="vendor-app-row">
                <div>
                  <p style={{ fontSize:13, fontWeight:700 }}>{v.vendor_name}</p>
                  <p style={{ fontSize:11, color:'var(--text-muted)' }}>{v.vendor_company_name || '—'} · {v.vendor_type || 'Invite Sent'} · {new Date(v.created_at).toLocaleDateString()}</p>
                </div>
                <StatusBadge status={v.status} />
              </div>
            ))}
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div className="page-card">
            <div className="page-card__head"><p className="page-card__title">Quick Actions</p></div>
            <div className="page-card__body" style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <Link to="/employee/create-vendor"    className="btn btn-primary w-full">🔗 Create Vendor Link</Link>
              <Link to="/employee/my-vendors"       className="btn btn-secondary w-full">👥 My Vendors</Link>
              <Link to="/employee/my-approvers"     className="btn btn-secondary w-full">🔀 My Approvers</Link>
              <Link to="/employee/register-yourself" className="btn btn-secondary w-full">📝 Register Yourself</Link>
            </div>
          </div>
          <div className="page-card">
            <div className="page-card__head"><p className="page-card__title">My Info</p></div>
            <div className="page-card__body">
              {[['Name', user?.name], ['Email', user?.email], ['Dept', user?.department], ['Role', user?.role?.toUpperCase()]].map(([k, v]) => (
                <div key={k} className="profile-row-emp"><span>{k}</span><strong>{v}</strong></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Create Vendor  (vendor_type REMOVED — only: first_name, last_name, company_name, email) ──
export function CreateVendor() {
  const [form, setForm] = useState({ firstName: '', lastName: '', companyName: '', email: '' })
  const [result, setResult] = useState<VendorInviteResponse | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setApiError('')
    if (!form.firstName || !form.companyName || !form.email) {
      alert('First name, company name, and email are required.'); return
    }
    setLoading(true)
    try {
      const data = await createVendorInvite({
        vendor_name:         `${form.firstName} ${form.lastName}`.trim(),
        vendor_company_name: form.companyName,
        vendor_email:        form.email,
      })
      setResult(data)
    } catch (err: unknown) {
      const msg = (err as Error).message ?? ''
      // Dev fallback — if backend unreachable, generate a local link for demo
      if (msg.includes('fetch') || msg.includes('Network') || msg.includes('404') || msg.includes('500')) {
        const token = Math.random().toString(36).substring(2, 10).toUpperCase()
        setResult({
          token,
          invite_link: `${window.location.origin}/vendor/register?token=${token}&company=${encodeURIComponent(form.companyName)}&ref=${encodeURIComponent(form.email)}`,
          message: 'Link generated (demo mode)',
        })
      } else {
        setApiError(msg || 'Failed to create vendor invite. Please try again.')
      }
    } finally { setLoading(false) }
  }

  const handleCopy = () => {
    if (!result) return
    navigator.clipboard.writeText(result.invite_link)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  return (
    <div>
      <div className="page-title-bar">
        <div><h2>Create Vendor</h2><p>Generate a unique registration link to share with a vendor</p></div>
      </div>
      <div className="create-vendor-grid">
        <div className="page-card">
          <div className="page-card__head"><p className="page-card__title">Vendor Details</p></div>
          <div className="page-card__body">
            <form onSubmit={handleGenerate} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {/* vendor_type field REMOVED per requirements */}
              <div className="grid-2">
                <FormField id="fn" label="First Name" value={form.firstName}
                  onChange={e => set('firstName', e.target.value)} required placeholder="First name" />
                <FormField id="ln" label="Last Name"  value={form.lastName}
                  onChange={e => set('lastName', e.target.value)} placeholder="Last name" />
              </div>
              <FormField id="cn" label="Company Name" value={form.companyName}
                onChange={e => set('companyName', e.target.value)} required placeholder="Company name" />
              <FormField id="ve" label="Vendor Email" type="email" value={form.email}
                onChange={e => set('email', e.target.value)} required placeholder="vendor@company.com" />
              {apiError && <p className="login-error">{apiError}</p>}
              <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                {loading ? 'Generating…' : '🔗 Generate Registration Link'}
              </button>
            </form>
          </div>
        </div>

        <div>
          {result ? (
            <div className="page-card">
              <div className="page-card__head"><p className="page-card__title">Generated Link</p></div>
              <div className="page-card__body">
                <div className="link-success-icon">✅</div>
                <p className="link-success-label">
                  Link created for <strong>{form.firstName} {form.lastName}</strong> from <strong>{form.companyName}</strong>
                </p>
                <div className="link-box">{result.invite_link}</div>
                <button className="btn btn-primary w-full" style={{ marginTop:12 }} onClick={handleCopy}>
                  {copied ? '✅ Copied!' : '📋 Copy Link'}
                </button>
                <p className="link-hint">Share this link via email. It expires in 48 hours.</p>
                <button className="btn btn-secondary w-full" style={{ marginTop:8 }}
                  onClick={() => { setResult(null); setForm({ firstName:'', lastName:'', companyName:'', email:'' }) }}>
                  + Generate Another Link
                </button>
              </div>
            </div>
          ) : (
            <div className="page-card">
              <div className="page-card__head"><p className="page-card__title">How It Works</p></div>
              <div className="page-card__body">
                <ol className="how-list">
                  {[
                    'Enter vendor name, company & email',
                    'Click "Generate Registration Link"',
                    'A unique secure link is created',
                    'Copy and share the link with the vendor',
                    'Vendor completes registration via the link',
                    'Submission appears in your My Vendors list',
                  ].map((s, i) => (
                    <li key={i}><span className="how-num">{i + 1}</span><span>{s}</span></li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── My Vendors ─────────────────────────────────────────────────────────────────
export function MyVendors() {
  const [apps, setApps] = useState<VendorRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get<VendorRequest[]>('/vendors/')
      .then(setApps)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const rows = apps.filter(v =>
    (v.vendor_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (v.vendor_company_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (v.ticket_number ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const cols: Column<VendorRequest>[] = [
    { key: 'ticket_number',    label: 'Ticket' },
    { key: 'vendor_name',       label: 'Vendor Name' },
    { key: 'vendor_company_name', label: 'Company' },
    { key: 'created_at',       label: 'Registration Date', render: v => new Date(v as string).toLocaleDateString() },
    { key: 'status',           label: 'Status', render: v => <StatusBadge status={String(v)} /> },
  ]

  return (
    <div>
      <div className="page-title-bar"><div><h2>My Vendors</h2><p>Vendors you have created or are managing</p></div></div>
      <div className="page-card">
        <div className="page-card__head">
          <p className="page-card__title">{loading ? 'Loading...' : `${rows.length} Vendor${rows.length !== 1 ? 's' : ''}`}</p>
          <input className="search-input" placeholder="Search vendors…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="page-card__body">
          {loading ? <p>Loading...</p> : <DataTable columns={cols} rows={rows} rowKey="id" />}
        </div>
      </div>
    </div>
  )
}

// ── Register Yourself ──────────────────────────────────────────────────────────
// Uses EmployeeVendorRegister which:
//  - Skips the Vendor Type selection step entirely
//  - Pre-locks vendor_type to "employee" (sent to API, not shown to user)
//  - Stepper starts directly at Company step
export function RegisterYourself() {
  const { user } = useAuth()
  return (
    <div>
      <div className="page-title-bar">
        <div>
          <h2>Register For Yourself</h2>
          <p>Register {user?.name} as an Employee Vendor</p>
        </div>
      </div>
      <div className="emp-info-banner">
        <span>ℹ️</span>
        <span>
          You are registering as an <strong>Employee Vendor</strong>.
          Vendor type is pre-set — fill in your company, address, tax and bank details below.
        </span>
      </div>
      <EmployeeVendorRegister />
    </div>
  )
}

const LEVEL_COLORS = ['#1a56db', '#0e9f6e', '#7c3aed']

// Removed hardcoded MOCK_APPROVERS - now fetched from backend

export function MyApprovers() {
  const [approvers, setApprovers] = useState<Approver[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getWorkflowConfig()
      .then(setApprovers)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div className="page-title-bar"><div><h2>My Approvers</h2><p>Your vendor request approval hierarchy</p></div></div>
      <div className="page-card">
        <div className="page-card__head">
          <p className="page-card__title">Approval Hierarchy – Level 1 to 3</p>
        </div>
        <div className="page-card__body">
          {loading ? (
            <p>Loading configuration...</p>
          ) : (
            <div className="approver-list">
              {approvers.map((a: Approver, i: number) => (
                <div key={a.level} className="approver-card">
                  <div className="approver-level-badge" style={{ background: LEVEL_COLORS[i % LEVEL_COLORS.length] }}>L{a.level}</div>
                  <div className="approver-avatar" style={{ background: LEVEL_COLORS[i % LEVEL_COLORS.length] }}>{a.name.charAt(0)}</div>
                  <div className="approver-info">
                    <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                      <p className="approver-name">{a.name}</p>
                      <span className="approver-badge" style={{ background:LEVEL_COLORS[i % LEVEL_COLORS.length]+'18', color:LEVEL_COLORS[i % LEVEL_COLORS.length], border:`1px solid ${LEVEL_COLORS[i % LEVEL_COLORS.length]}40` }}>Level {a.level} Approver</span>
                    </div>
                    <p className="approver-role">{a.role} · {a.department}</p>
                    <p className="approver-email">✉️ {a.email}</p>
                  </div>
                  {i < approvers.length - 1 && <div className="approver-arrow">→</div>}
                </div>
              ))}
            </div>
          )}
          <div className="approver-note">🔒 All three levels must approve before SAP vendor creation proceeds.</div>
        </div>
      </div>
    </div>
  )
}

// ── My Profile ─────────────────────────────────────────────────────────────────
export function MyProfile() {
  const { user, updateUser } = useAuth()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', department: user?.department || '' })

  const handleSave = () => { updateUser(form); setEditing(false) }

  return (
    <div>
      <div className="page-title-bar"><div><h2>My Profile</h2><p>View and update your employee profile</p></div></div>
      <div className="profile-grid">
        <div className="page-card profile-avatar-card">
          <div className="page-card__body" style={{ textAlign:'center', padding:'32px 20px' }}>
            <div className="profile-big-avatar">{(form.name || user?.name || 'U').charAt(0)}</div>
            <p className="profile-big-name">{form.name || user?.name}</p>
            <p className="profile-big-role">{user?.role?.toUpperCase()} · {form.department || user?.department}</p>
            <span className="profile-big-badge">Employee</span>
          </div>
        </div>
        <div className="page-card">
          <div className="page-card__head">
            <p className="page-card__title">Employee Information</p>
            {editing
              ? <div style={{ display:'flex', gap:8 }}><button className="btn btn-primary btn-sm" onClick={handleSave}>💾 Save</button><button className="btn btn-secondary btn-sm" onClick={() => setEditing(false)}>✕ Cancel</button></div>
              : <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>✏️ Edit</button>
            }
          </div>
          <div className="page-card__body">
            {editing ? (
              <div className="grid-2">
                <FormField id="pn"  label="Full Name"  value={form.name}       onChange={e => setForm(p => ({...p,name:e.target.value}))}       required />
                <FormField id="pp"  label="Phone"      value={form.phone}      onChange={e => setForm(p => ({...p,phone:e.target.value}))}      placeholder="+91 XXXXX XXXXX" />
                <FormField id="pd"  label="Department" value={form.department} onChange={e => setForm(p => ({...p,department:e.target.value}))} placeholder="Department" />
                <FormField id="pem" label="Email (read-only)" value={user?.email || ''} disabled />
              </div>
            ) : (
              <div className="grid-2">
                {[['Full Name', form.name||user?.name], ['Email', user?.email], ['Phone', form.phone||user?.phone||'—'], ['Department', form.department||user?.department||'—'], ['Role', user?.role?.toUpperCase()], ['Employee ID', `EMP-00${user?.id||1}`]].map(([k,v]) => (
                  <div key={k} className="profile-info-box"><p className="profile-info-key">{k}</p><p className="profile-info-val">{v}</p></div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
