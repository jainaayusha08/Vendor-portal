// ─────────────────────────────────────────────────────────────────────────────
// VENDOR PAGES
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import StatCard from '../../components/StatCard/StatCard'
import DataTable, { Column } from '../../components/DataTable/DataTable'
import StatusBadge from '../../components/StatusBadge/StatusBadge'
import FormField from '../../components/FormField/FormField'
import FileUpload from '../../components/FileUpload/FileUpload'
import { useAuth } from '../../context/AuthContext'
import { MOCK_APPLICATIONS, VENDOR_TYPES, VendorApplication } from '../../utils/mockData'
import './VendorPages.css'

// ── Dashboard ─────────────────────────────────────────────────────────────────
export function VendorDashboard() {
  const { user } = useAuth()
  const recent = MOCK_APPLICATIONS.slice(0, 3)
  return (
    <div>
      <div className="page-title-bar">
        <div>
          <h2>Welcome back, {user?.name?.split(' ')[0]}! 👋</h2>
          <p>Track and manage your vendor registration requests</p>
        </div>
        <Link to="/vendor/register" className="btn btn-primary">+ New Registration</Link>
      </div>

      <div className="grid-4 mb-8">
        <StatCard label="Total Applications" value={MOCK_APPLICATIONS.length} icon="📋" color="blue" />
        <StatCard label="Approved"            value={1} icon="✅" color="green" />
        <StatCard label="Pending Approval"    value={1} icon="⏳" color="amber" />
        <StatCard label="Rejected / Returned" value={2} icon="❌" color="rose" />
      </div>

      <div className="vendor-dash-grid">
        <div className="page-card">
          <div className="page-card__head">
            <div><p className="page-card__title">Recent Applications</p></div>
            <Link to="/vendor/history" className="btn btn-secondary btn-sm">View All</Link>
          </div>
          <div className="page-card__body">
            {recent.map(a => (
              <div key={a.id} className="vendor-app-row">
                <div>
                  <p className="vendor-app-id">{a.id}</p>
                  <p className="vendor-app-meta">{a.vendorType} · {a.submittedDate}</p>
                </div>
                <StatusBadge status={a.status} />
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="page-card">
            <div className="page-card__head"><p className="page-card__title">Quick Actions</p></div>
            <div className="page-card__body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link to="/vendor/register" className="btn btn-primary w-full">🆕 Start New Registration</Link>
              <Link to="/vendor/history"  className="btn btn-secondary w-full">📋 View History</Link>
              <Link to="/vendor/status"   className="btn btn-secondary w-full">🔍 Track Status</Link>
            </div>
          </div>
          <div className="page-card">
            <div className="page-card__head"><p className="page-card__title">My Profile</p></div>
            <div className="page-card__body">
              {[['Name', user?.name], ['Company', user?.company || '—'], ['Email', user?.email], ['Phone', user?.phone || '—']].map(([k, v]) => (
                <div key={k} className="profile-row"><span>{k}</span><strong>{v}</strong></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Register ──────────────────────────────────────────────────────────────────
const STEPS = ['Vendor Type', 'Company', 'Address', 'Tax & Bank', 'Documents', 'Review']

function emptyForm() {
  return { vendorName: '', serviceType: '', supplyCategory: '', contactName: '', contactPhone: '', contactEmail: '',
    street: '', houseNo: '', city: '', district: '', postalCode: '', country: 'India',
    pan: '', gst: '', tan: '', msme: false, msmeNo: '', bankName: '', accountNo: '', ifsc: '', branchAddress: '',
    witholdingTax: '', declaration: false }
}

export function VendorRegister() {
  const [step, setStep]         = useState(0)
  const [vendorType, setType]   = useState('')
  const [form, setForm]         = useState(emptyForm())
  const [submitted, setSubmitted] = useState(false)
  const navigate = useNavigate()
  const ticketNo = `VREG-${new Date().getFullYear()}-${String(Math.floor(Math.random()*90000)+10000)}`

  const set = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }))
  const canNext = () => {
    if (step === 0) return !!vendorType
    if (step === 1) return !!(form.vendorName && form.contactName && form.contactEmail)
    if (step === 2) return !!(form.city && form.postalCode)
    return true
  }

  if (submitted) return (
    <div className="submit-success">
      <div className="submit-success__icon">🎉</div>
      <h2>Registration Submitted!</h2>
      <p>Your application is now under review by the verification team.</p>
      <div className="submit-ticket">
        <p>Ticket Number</p>
        <h3>{ticketNo}</h3>
        <small>Save this number to track your application</small>
      </div>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 16 }}>
        <button className="btn btn-primary" onClick={() => navigate('/vendor/status')}>🔍 Track Status</button>
        <button className="btn btn-secondary" onClick={() => { setSubmitted(false); setStep(0); setType(''); setForm(emptyForm()) }}>➕ New Registration</button>
      </div>
    </div>
  )

  return (
    <div>
      <div className="page-title-bar">
        <div><h2>Vendor Registration</h2><p>Complete all steps to submit your registration application</p></div>
      </div>

      {/* Stepper */}
      <div className="page-card mb-4">
        <div className="page-card__body stepper">
          {STEPS.map((s, i) => (
            <div key={s} className="stepper__item">
              <div className={`stepper__circle${i < step ? ' stepper__circle--done' : i === step ? ' stepper__circle--active' : ''}`}>
                {i < step ? '✓' : i + 1}
              </div>
              <p className={`stepper__label${i === step ? ' stepper__label--active' : ''}`}>{s}</p>
              {i < STEPS.length - 1 && <div className={`stepper__line${i < step ? ' stepper__line--done' : ''}`} />}
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="page-card">
        <div className="page-card__head"><p className="page-card__title">{STEPS[step]}</p></div>
        <div className="page-card__body">
          {step === 0 && (
            <div className="vendor-type-grid">
              {VENDOR_TYPES.map(t => (
                <button key={t.value} className={`vendor-type-card${vendorType === t.value ? ' vendor-type-card--selected' : ''}`} onClick={() => setType(t.value)}>
                  <span className="vendor-type-card__check">{vendorType === t.value ? '✅' : '○'}</span>
                  <p className="vendor-type-card__name">{t.label}</p>
                  <p className="vendor-type-card__desc">{t.desc}</p>
                </button>
              ))}
            </div>
          )}

          {step === 1 && (
            <div className="grid-2">
              <FormField id="vn" label="Company / Vendor Name" value={form.vendorName} onChange={e => set('vendorName', e.target.value)} required placeholder="Acme Pvt Ltd" />
              <FormField id="st" label="Service Type" type="select" value={form.serviceType} onChange={e => set('serviceType', e.target.value)}
                options={[{value:'',label:'Select'},{value:'civil',label:'Civil Works'},{value:'electrical',label:'Electrical'},{value:'it',label:'IT Services'},{value:'supply',label:'Supply'},{value:'consulting',label:'Consulting'}]} />
              <FormField id="cn" label="Contact Name"  value={form.contactName}  onChange={e => set('contactName', e.target.value)}  required placeholder="Full name" />
              <FormField id="cp" label="Contact Phone" type="tel" value={form.contactPhone} onChange={e => set('contactPhone', e.target.value)} required placeholder="+91 XXXXX XXXXX" />
              <div style={{ gridColumn: '1/-1' }}>
                <FormField id="ce" label="Contact Email" type="email" value={form.contactEmail} onChange={e => set('contactEmail', e.target.value)} required placeholder="contact@company.com" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid-2">
              <FormField id="hn" label="House / Building No" value={form.houseNo}    onChange={e => set('houseNo', e.target.value)}    required placeholder="Plot no, Building" />
              <FormField id="sr" label="Street / Area"       value={form.street}     onChange={e => set('street', e.target.value)}     required placeholder="Street, locality" />
              <FormField id="di" label="District"            value={form.district}   onChange={e => set('district', e.target.value)}   required placeholder="District" />
              <FormField id="cy" label="City"                value={form.city}       onChange={e => set('city', e.target.value)}       required placeholder="City / Town" />
              <FormField id="pc" label="PIN Code"            value={form.postalCode} onChange={e => set('postalCode', e.target.value)} required placeholder="6-digit PIN" />
              <FormField id="co" label="Country" type="select" value={form.country} onChange={e => set('country', e.target.value)}
                options={[{value:'India',label:'India'},{value:'USA',label:'USA'},{value:'Germany',label:'Germany'},{value:'Other',label:'Other'}]} />
            </div>
          )}

          {step === 3 && (
            <div>
              <p className="form-section-title">Tax Details</p>
              <div className="grid-2">
                <FormField id="pan" label="PAN Number" value={form.pan} onChange={e => set('pan', e.target.value.toUpperCase())} required placeholder="AAACA1234A" />
                <FormField id="gst" label="GST Number" value={form.gst} onChange={e => set('gst', e.target.value.toUpperCase())} placeholder="27AAACA1234A1Z5" />
                <FormField id="wht" label="Withholding Tax Code" type="select" value={form.witholdingTax} onChange={e => set('witholdingTax', e.target.value)}
                  options={[{value:'',label:'Select'},{value:'194C',label:'194C – Contractor'},{value:'194J',label:'194J – Professional'},{value:'none',label:'Not Applicable'}]} />
              </div>
              <p className="form-section-title" style={{ marginTop: 20 }}>Bank Details</p>
              <div className="grid-2">
                <FormField id="bk" label="Bank Name"      value={form.bankName}      onChange={e => set('bankName', e.target.value)}      required placeholder="State Bank of India" />
                <FormField id="ac" label="Account Number" value={form.accountNo}     onChange={e => set('accountNo', e.target.value)}     required placeholder="Account number" />
                <FormField id="if" label="IFSC Code"      value={form.ifsc}          onChange={e => set('ifsc', e.target.value.toUpperCase())} required placeholder="SBIN0001234" />
                <FormField id="ba" label="Branch Address" value={form.branchAddress} onChange={e => set('branchAddress', e.target.value)} placeholder="Branch address" />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="grid-2">
              {['PAN Card', 'GST Certificate', 'Bank Cancelled Cheque', 'Certificate of Incorporation', 'Address Proof'].map(doc => (
                <FileUpload key={doc} label={doc} required />
              ))}
            </div>
          )}

          {step === 5 && (
            <div>
              <div className="review-grid">
                {[['Vendor Type', VENDOR_TYPES.find(t=>t.value===vendorType)?.label || '—'],['Company', form.vendorName],['Contact', form.contactName],['Email', form.contactEmail],['City', form.city],['PIN', form.postalCode],['PAN', form.pan || '—'],['GST', form.gst || '—'],['Bank', form.bankName],['IFSC', form.ifsc]].map(([k, v]) => (
                  <div key={k} className="review-row"><span>{k}</span><strong>{v}</strong></div>
                ))}
              </div>
              <div className="declaration-box">
                <p className="declaration-title">Compliance Declaration</p>
                <ul>
                  <li>All information provided is accurate and complete.</li>
                  <li>There are no pending legal disputes against your entity.</li>
                  <li>You agree to Hinduja Renewables' vendor code of conduct.</li>
                  <li>Data shared will be processed per DPDPA guidelines.</li>
                </ul>
                <FormField id="decl" label="I have read and agree to the above declaration" type="checkbox"
                  checked={form.declaration} onChange={e => set('declaration', (e.target as HTMLInputElement).checked)} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nav buttons */}
      <div className="step-nav">
        <button className="btn btn-secondary" onClick={() => setStep(p=>p-1)} disabled={step===0}>← Previous</button>
        <span className="step-counter">Step {step+1} of {STEPS.length}</span>
        {step < STEPS.length - 1
          ? <button className="btn btn-primary" onClick={() => setStep(p=>p+1)} disabled={!canNext()}>Next →</button>
          : <button className="btn btn-success" onClick={() => { if (!form.declaration) alert('Please accept the declaration.'); else setSubmitted(true) }}>✅ Submit Registration</button>
        }
      </div>
    </div>
  )
}

// ── History ───────────────────────────────────────────────────────────────────
export function VendorHistory() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const statuses = ['All', 'Approved', 'Pending Approval', 'Returned', 'Rejected', 'Draft']

  const rows = MOCK_APPLICATIONS.filter(a => {
    const ms = filter === 'All' || a.status === filter
    const ss = a.id.toLowerCase().includes(search.toLowerCase()) || a.vendorType.toLowerCase().includes(search.toLowerCase())
    return ms && ss
  })

  const cols: Column<VendorApplication>[] = [
    { key: 'id',            label: 'Application ID',  render: v => <span className="mono-id">{String(v)}</span> },
    { key: 'vendorType',    label: 'Vendor Type' },
    { key: 'submittedDate', label: 'Submitted Date' },
    { key: 'status',        label: 'Status', render: v => <StatusBadge status={String(v)} /> },
    { key: 'remarks',       label: 'Remarks' },
  ]
  return (
    <div>
      <div className="page-title-bar"><div><h2>History of Applications</h2><p>All your submitted vendor registration requests</p></div></div>
      <div className="filter-row">
        {statuses.map(s => <button key={s} className={`filter-pill${filter===s?' filter-pill--active':''}`} onClick={()=>setFilter(s)}>{s} ({s==='All'?MOCK_APPLICATIONS.length:MOCK_APPLICATIONS.filter(a=>a.status===s).length})</button>)}
      </div>
      <div className="page-card">
        <div className="page-card__head">
          <p className="page-card__title">{rows.length} Application{rows.length!==1?'s':''}</p>
          <input className="search-input" placeholder="Search ID or type…" value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <div className="page-card__body"><DataTable columns={cols} rows={rows} rowKey="id" /></div>
      </div>
    </div>
  )
}

// ── Status ─────────────────────────────────────────────────────────────────────
export function VendorRegistrationStatus() {
  const [ticket, setTicket] = useState('')
  const [found, setFound]   = useState<VendorApplication | null>(null)

  const STAGES = ['Submitted', 'L1 – Employee Review', 'L2 – Finance Review', 'L3 – Controller Approval', 'SAP Creation', 'Completed']
  const STAGE_MAP: Record<string, number> = { Draft: 0, 'Pending Approval': 1, Returned: 1, Rejected: 1, Approved: 5 }

  const handleTrack = () => {
    const r = MOCK_APPLICATIONS.find(a => a.id === ticket.trim())
    setFound(r || null)
    if (!r) alert('Ticket not found. Try: VREG-2026-00001')
  }

  const active = found ? (STAGE_MAP[found.status] ?? 1) : -1

  return (
    <div>
      <div className="page-title-bar"><div><h2>Registration Status</h2><p>Track your application using the ticket number</p></div></div>

      <div className="page-card mb-4">
        <div className="page-card__head"><p className="page-card__title">Track Application</p></div>
        <div className="page-card__body">
          <div style={{ display:'flex', gap:10 }}>
            <input className="search-input flex-1" placeholder="Enter ticket e.g. VREG-2026-00001" value={ticket} onChange={e=>setTicket(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleTrack()} />
            <button className="btn btn-primary" onClick={handleTrack}>🔍 Track</button>
          </div>
          <p style={{ fontSize:11, color:'var(--text-light)', marginTop:6 }}>Demo: try VREG-2026-00001 or VREG-2026-00002</p>
        </div>
      </div>

      {found && (
        <>
          <div className="page-card mb-4">
            <div className="page-card__body status-header-row">
              <div><p className="status-ticket-label">Ticket Number</p><p className="status-ticket-no">{found.id}</p></div>
              <div><p className="status-ticket-label">Vendor Type</p><p className="status-ticket-val">{found.vendorType}</p></div>
              <div><p className="status-ticket-label">Submitted</p><p className="status-ticket-val">{found.submittedDate}</p></div>
              <div><p className="status-ticket-label">Status</p><StatusBadge status={found.status} /></div>
            </div>
          </div>
          <div className="page-card">
            <div className="page-card__head"><p className="page-card__title">Approval Workflow</p></div>
            <div className="page-card__body">
              <div className="workflow-track">
                {STAGES.map((s, i) => (
                  <div key={s} className="workflow-step">
                    <div className={`workflow-circle${i<active?' wf-done':i===active?' wf-active':''}`}>{i<active?'✓':i+1}</div>
                    <p className={`workflow-label${i===active?' wf-label-active':''}`}>{s}</p>
                    {i<STAGES.length-1 && <div className={`workflow-line${i<active?' wf-line-done':''}`} />}
                  </div>
                ))}
              </div>
              {found.remarks !== '-' && <div className={`remarks-box${found.status==='Rejected'||found.status==='Returned'?' remarks-box--warn':''}`}><strong>Remarks:</strong> {found.remarks}</div>}
            </div>
          </div>
        </>
      )}

      <div className="page-card mt-4">
        <div className="page-card__head"><p className="page-card__title">All Applications</p></div>
        <div className="page-card__body">
          {MOCK_APPLICATIONS.map(a => (
            <div key={a.id} className="vendor-app-row" style={{ cursor:'pointer' }} onClick={() => { setTicket(a.id); setFound(a) }}>
              <div><p className="vendor-app-id">{a.id}</p><p className="vendor-app-meta">{a.vendorType} · {a.submittedDate}</p></div>
              <StatusBadge status={a.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
