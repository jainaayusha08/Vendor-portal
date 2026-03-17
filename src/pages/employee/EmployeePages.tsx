import { useState } from 'react'
import { Link } from 'react-router-dom'
import StatCard from '../../components/StatCard/StatCard'
import DataTable, { Column } from '../../components/DataTable/DataTable'
import StatusBadge from '../../components/StatusBadge/StatusBadge'
import FormField from '../../components/FormField/FormField'
import { useAuth } from '../../context/AuthContext'
import { MOCK_MY_VENDORS, MOCK_APPROVERS, Approver } from '../../utils/mockData'
import { VendorRegister } from '../vendor/VendorPages'
import './EmployeePages.css'

// ── Dashboard ─────────────────────────────────────────────────────────────────
export function EmployeeDashboard() {
  const { user } = useAuth()
  return (
    <div>
      <div className="page-title-bar">
        <div><h2>Good morning, {user?.name?.split(' ')[0]}! 👋</h2><p>{user?.department} · Hinduja Renewables</p></div>
        <Link to="/employee/create-vendor" className="btn btn-primary">+ Create Vendor Link</Link>
      </div>
      <div className="grid-4 mb-8">
        <StatCard label="Vendors Created"  value={MOCK_MY_VENDORS.length} icon="👥" color="blue" />
        <StatCard label="Pending Approval" value={1}  icon="⏳" color="amber" />
        <StatCard label="Approved Vendors" value={1}  icon="✅" color="green" />
        <StatCard label="Returned"         value={1}  icon="↩️" color="rose" />
      </div>
      <div className="emp-dash-grid">
        <div className="page-card">
          <div className="page-card__head">
            <p className="page-card__title">My Vendors</p>
            <Link to="/employee/my-vendors" className="btn btn-secondary btn-sm">View All</Link>
          </div>
          <div className="page-card__body">
            {MOCK_MY_VENDORS.map((v, i) => (
              <div key={i} className="vendor-app-row">
                <div>
                  <p style={{ fontSize:13, fontWeight:700 }}>{v.vendorName}</p>
                  <p style={{ fontSize:11, color:'var(--text-muted)' }}>{v.company} · {v.vendorType} · {v.registrationDate}</p>
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
              <Link to="/employee/create-vendor"  className="btn btn-primary w-full">🔗 Create Vendor Link</Link>
              <Link to="/employee/my-vendors"     className="btn btn-secondary w-full">👥 My Vendors</Link>
              <Link to="/employee/my-approvers"   className="btn btn-secondary w-full">🔀 My Approvers</Link>
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

// ── Create Vendor ─────────────────────────────────────────────────────────────
export function CreateVendor() {
  const [form, setForm] = useState({ firstName: '', lastName: '', companyName: '', email: '', vendorType: '' })
  const [link, setLink] = useState('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.firstName || !form.companyName || !form.email) { alert('First name, company name, and email are required.'); return }
    setLoading(true)
    await new Promise(r => setTimeout(r, 600))
    const token = Math.random().toString(36).substring(2, 10).toUpperCase()
    setLink(`${window.location.origin}/vendor/register?token=${token}&company=${encodeURIComponent(form.companyName)}&ref=${encodeURIComponent(form.email)}`)
    setLoading(false)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  return (
    <div>
      <div className="page-title-bar"><div><h2>Create Vendor</h2><p>Generate a unique registration link to share with a vendor</p></div></div>
      <div className="create-vendor-grid">
        <div className="page-card">
          <div className="page-card__head"><p className="page-card__title">Vendor Details</p></div>
          <div className="page-card__body">
            <form onSubmit={handleGenerate} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div className="grid-2">
                <FormField id="fn" label="First Name" value={form.firstName} onChange={e=>set('firstName',e.target.value)} required placeholder="First name" />
                <FormField id="ln" label="Last Name"  value={form.lastName}  onChange={e=>set('lastName',e.target.value)}  placeholder="Last name" />
              </div>
              <FormField id="cn" label="Company Name"  value={form.companyName} onChange={e=>set('companyName',e.target.value)} required placeholder="Company name" />
              <FormField id="ve" label="Vendor Email"  type="email" value={form.email} onChange={e=>set('email',e.target.value)} required placeholder="vendor@company.com" />
              <FormField id="vt" label="Vendor Type (Optional)" type="select" value={form.vendorType} onChange={e=>set('vendorType',e.target.value)}
                options={[{value:'',label:'Auto-detect'},{value:'domestic',label:'Domestic'},{value:'foreign',label:'Foreign'},{value:'farmer',label:'Farmer'},{value:'government',label:'Government'},{value:'employee',label:'Employee'}]} />
              <button type="submit" className="btn btn-primary w-full" disabled={loading}>{loading ? 'Generating…' : '🔗 Generate Registration Link'}</button>
            </form>
          </div>
        </div>

        <div>
          {link ? (
            <div className="page-card">
              <div className="page-card__head"><p className="page-card__title">Generated Link</p></div>
              <div className="page-card__body">
                <div className="link-success-icon">✅</div>
                <p className="link-success-label">Registration link created for <strong>{form.firstName} {form.lastName}</strong> from <strong>{form.companyName}</strong></p>
                <div className="link-box">{link}</div>
                <button className="btn btn-primary w-full" style={{ marginTop:12 }} onClick={handleCopy}>{copied ? '✅ Copied!' : '📋 Copy Link'}</button>
                <p className="link-hint">Share this link via email. It expires in 48 hours.</p>
              </div>
            </div>
          ) : (
            <div className="page-card">
              <div className="page-card__head"><p className="page-card__title">How It Works</p></div>
              <div className="page-card__body">
                <ol className="how-list">
                  {['Enter vendor name, company & email', 'Click "Generate Registration Link"', 'A unique secure link is created', 'Copy and share with the vendor', 'Vendor completes registration via the link', 'Submission appears in your My Vendors list'].map((s, i) => (
                    <li key={i}><span className="how-num">{i+1}</span><span>{s}</span></li>
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
  const [search, setSearch] = useState('')
  const rows = MOCK_MY_VENDORS.filter(v =>
    v.vendorName.toLowerCase().includes(search.toLowerCase()) ||
    v.company.toLowerCase().includes(search.toLowerCase())
  )
  const cols: Column<typeof MOCK_MY_VENDORS[0]>[] = [
    { key: 'vendorName',       label: 'Vendor Name' },
    { key: 'company',          label: 'Company Name' },
    { key: 'vendorType',       label: 'Vendor Type' },
    { key: 'registrationDate', label: 'Registration Date' },
    { key: 'status',           label: 'Status', render: v => <StatusBadge status={String(v)} /> },
  ]
  return (
    <div>
      <div className="page-title-bar"><div><h2>My Vendors</h2><p>Vendors you have created or are managing</p></div></div>
      <div className="page-card">
        <div className="page-card__head">
          <p className="page-card__title">{rows.length} Vendor{rows.length!==1?'s':''}</p>
          <input className="search-input" placeholder="Search vendors…" value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <div className="page-card__body"><DataTable columns={cols} rows={rows} rowKey="vendorName" /></div>
      </div>
    </div>
  )
}

// ── Register Yourself ──────────────────────────────────────────────────────────
export function RegisterYourself() {
  const { user } = useAuth()
  return (
    <div>
      <div className="page-title-bar"><div><h2>Register For Yourself</h2><p>Register {user?.name} as an Employee Vendor using the standard form</p></div></div>
      <div className="emp-info-banner">
        <span>ℹ️</span>
        <span>You are registering as an <strong>Employee Vendor</strong>. The vendor type has been pre-selected for you.</span>
      </div>
      <VendorRegister />
    </div>
  )
}

// ── My Approvers ───────────────────────────────────────────────────────────────
const LEVEL_COLORS = ['#1a56db', '#0e9f6e', '#7c3aed']

export function MyApprovers() {
  return (
    <div>
      <div className="page-title-bar"><div><h2>My Approvers</h2><p>Your vendor request approval hierarchy</p></div></div>
      <div className="page-card">
        <div className="page-card__head"><p className="page-card__title">Approval Hierarchy – Level 1 to 3</p></div>
        <div className="page-card__body">
          <div className="approver-list">
            {MOCK_APPROVERS.map((a, i) => (
              <div key={a.level} className="approver-card">
                <div className="approver-level-badge" style={{ background: LEVEL_COLORS[i] }}>L{a.level}</div>
                <div className="approver-avatar" style={{ background: LEVEL_COLORS[i] }}>{a.name.charAt(0)}</div>
                <div className="approver-info">
                  <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                    <p className="approver-name">{a.name}</p>
                    <span className="approver-badge" style={{ background: LEVEL_COLORS[i]+'18', color: LEVEL_COLORS[i], border:`1px solid ${LEVEL_COLORS[i]}40` }}>Level {a.level} Approver</span>
                  </div>
                  <p className="approver-role">{a.role} · {a.department}</p>
                  <p className="approver-email">✉️ {a.email}</p>
                </div>
                {i < MOCK_APPROVERS.length - 1 && <div className="approver-arrow">→</div>}
              </div>
            ))}
          </div>
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

  const handleSave = () => {
    updateUser(form)
    setEditing(false)
  }

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
              ? <div style={{ display:'flex', gap:8 }}><button className="btn btn-primary btn-sm" onClick={handleSave}>💾 Save</button><button className="btn btn-secondary btn-sm" onClick={()=>setEditing(false)}>✕ Cancel</button></div>
              : <button className="btn btn-secondary btn-sm" onClick={()=>setEditing(true)}>✏️ Edit</button>
            }
          </div>
          <div className="page-card__body">
            {editing ? (
              <div className="grid-2">
                <FormField id="pn"  label="Full Name"   value={form.name}       onChange={e=>setForm(p=>({...p,name:e.target.value}))}       required />
                <FormField id="pp"  label="Phone"       value={form.phone}      onChange={e=>setForm(p=>({...p,phone:e.target.value}))}      placeholder="+91 XXXXX XXXXX" />
                <FormField id="pd"  label="Department"  value={form.department} onChange={e=>setForm(p=>({...p,department:e.target.value}))} placeholder="Department" />
                <FormField id="pem" label="Email (read-only)" value={user?.email||''} disabled />
              </div>
            ) : (
              <div className="grid-2">
                {[['Full Name', form.name||user?.name], ['Email', user?.email], ['Phone', form.phone||user?.phone||'—'], ['Department', form.department||user?.department||'—'], ['Role', user?.role?.toUpperCase()], ['Employee ID', `EMP-00${user?.id||1}`]].map(([k,v])=>(
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
