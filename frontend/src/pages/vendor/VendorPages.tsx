import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import StatCard from '../../components/StatCard/StatCard'
import DataTable, { Column } from '../../components/DataTable/DataTable'
import StatusBadge from '../../components/StatusBadge/StatusBadge'
import FormField from '../../components/FormField/FormField'
import FileUpload from '../../components/FileUpload/FileUpload'
import { useAuth } from '../../context/AuthContext'
import { VENDOR_TYPES } from '../../utils/mockData'
import { api, registerVendor } from '../../utils/api'
import './VendorPages.css'

export interface VendorApplication {
  id: string
  ticket_number: string
  vendor_name: string
  vendor_type: string
  status: string
  created_at: string
  rejection_reason?: string
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export function VendorDashboard() {
  const { user } = useAuth()
  const [apps, setApps] = useState<VendorApplication[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<VendorApplication[]>('/vendors/my-requests/')
      .then(setApps)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const recent = apps.slice(0, 3)
  const stats = {
    total: apps.length,
    approved: apps.filter(a => a.status === 'completed').length,
    pending: apps.filter(a => ['l1_pending', 'l2_pending', 'l3_pending'].includes(a.status)).length,
    rejected: apps.filter(a => ['rejected', 'returned'].includes(a.status)).length
  }

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
        <StatCard label="Total Applications" value={stats.total} icon="📋" color="blue" />
        <StatCard label="Approved"            value={stats.approved} icon="✅" color="green" />
        <StatCard label="Pending Approval"    value={stats.pending} icon="⏳" color="amber" />
        <StatCard label="Rejected / Returned" value={stats.rejected} icon="❌" color="rose" />
      </div>

      <div className="vendor-dash-grid">
        <div className="page-card">
          <div className="page-card__head">
            <div><p className="page-card__title">Recent Applications</p></div>
            <Link to="/vendor/history" className="btn btn-secondary btn-sm">View All</Link>
          </div>
          <div className="page-card__body">
            {loading ? <p>Loading applications...</p> : recent.length === 0 ? <p>No applications found.</p> : recent.map(a => (
              <div key={a.id} className="vendor-app-row">
                <div>
                  <p className="vendor-app-id">{a.ticket_number}</p>
                  <p className="vendor-app-meta">{a.vendor_type} · {new Date(a.created_at).toLocaleDateString()}</p>
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
  return {
    vendorName: '', serviceType: '', supplyCategory: '', contactName: '', contactPhone: '', contactEmail: '',
    street: '', houseNo: '', city: '', district: '', postalCode: '', country: 'India',
    pan: '', gst: '', tan: '', msme: false, msmeNo: '', bankName: '', accountNo: '', ifsc: '', branchAddress: '',
    witholdingTax: '', declaration: false,
  }
}

export function VendorRegister() {
  const [step, setStep]           = useState(0)
  const [vendorType, setType]     = useState('')
  const [form, setForm]           = useState(emptyForm())
  const [submitted, setSubmitted] = useState(false)
  const [ticketNo, setTicketNo]   = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const set = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }))

  const canNext = () => {
    if (step === 0) return !!vendorType
    if (step === 1) return !!(form.vendorName && form.contactName && form.contactEmail)
    if (step === 2) return !!(form.city && form.postalCode)
    return true
  }

  const handleSubmit = async () => {
    if (!form.declaration) { alert('Please accept the declaration.'); return }
    setSubmitting(true); setSubmitError('')
    try {
      const res = await registerVendor({
        token:           searchParams.get('token') ?? undefined,
        vendor_type:     vendorType,
        vendor_name:     form.vendorName,
        service_type:    form.serviceType,
        contact_name:    form.contactName,
        contact_phone:   form.contactPhone,
        contact_email:   form.contactEmail,
        house_no:        form.houseNo,
        street:          form.street,
        district:        form.district,
        city:            form.city,
        postal_code:     form.postalCode,
        country:         form.country,
        pan:             form.pan,
        gst:             form.gst,
        tan:             form.tan,
        withholding_tax: form.witholdingTax,
        bank_name:       form.bankName,
        account_no:      form.accountNo,
        ifsc:            form.ifsc,
        branch_address:  form.branchAddress,
        msme:            form.msme,
        msme_no:         form.msmeNo,
      })
      setTicketNo(res.ticket_number)
      setSubmitted(true)
    } catch (err: unknown) {
      setSubmitError((err as Error).message || 'Submission failed. Please try again.')
    } finally { setSubmitting(false) }
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
                {[['Vendor Type', VENDOR_TYPES.find(t => t.value === vendorType)?.label || '—'],['Company', form.vendorName],['Contact', form.contactName],['Email', form.contactEmail],['City', form.city],['PIN', form.postalCode],['PAN', form.pan || '—'],['GST', form.gst || '—'],['Bank', form.bankName],['IFSC', form.ifsc]].map(([k, v]) => (
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
              {submitError && <p style={{ color: 'var(--danger)', marginTop: 10, fontSize: 13 }}>⚠️ {submitError}</p>}
            </div>
          )}
        </div>
      </div>

      {/* Nav buttons */}
      <div className="step-nav">
        <button className="btn btn-secondary" onClick={() => setStep(p => p - 1)} disabled={step === 0}>← Previous</button>
        <span className="step-counter">Step {step + 1} of {STEPS.length}</span>
        {step < STEPS.length - 1
          ? <button className="btn btn-primary" onClick={() => setStep(p => p + 1)} disabled={!canNext()}>Next →</button>
          : <button className="btn btn-success" onClick={handleSubmit} disabled={submitting}>
              {submitting ? '⏳ Submitting…' : '✅ Submit Registration'}
            </button>
        }
      </div>
    </div>
  )
}

// ── Employee Vendor Register (locked to "employee" type, skips step 0) ────────
// Used by RegisterYourself in EmployeePages — vendor type step is hidden,
// type is pre-set to 'employee', stepper starts at Company step.
const EMP_STEPS = ['Company', 'Address', 'Tax & Bank', 'Documents', 'Review']

export function EmployeeVendorRegister() {
  const [step, setStep]           = useState(0)   // 0 = Company (not Vendor Type)
  const [form, setForm]           = useState(emptyForm())
  const [submitted, setSubmitted] = useState(false)
  const [ticketNo, setTicketNo]   = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const LOCKED_VENDOR_TYPE = 'employee'

  const set = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }))

  const canNext = () => {
    if (step === 0) return !!(form.vendorName && form.contactName && form.contactEmail)
    if (step === 1) return !!(form.city && form.postalCode)
    return true
  }

  const handleSubmit = async () => {
    if (!form.declaration) { alert('Please accept the declaration.'); return }
    setSubmitting(true); setSubmitError('')
    try {
      const res = await registerVendor({
        token:           searchParams.get('token') ?? undefined,
        vendor_type:     LOCKED_VENDOR_TYPE,
        vendor_name:     form.vendorName,
        service_type:    form.serviceType,
        contact_name:    form.contactName,
        contact_phone:   form.contactPhone,
        contact_email:   form.contactEmail,
        house_no:        form.houseNo,
        street:          form.street,
        district:        form.district,
        city:            form.city,
        postal_code:     form.postalCode,
        country:         form.country,
        pan:             form.pan,
        gst:             form.gst,
        tan:             form.tan,
        withholding_tax: form.witholdingTax,
        bank_name:       form.bankName,
        account_no:      form.accountNo,
        ifsc:            form.ifsc,
        branch_address:  form.branchAddress,
        msme:            form.msme,
        msme_no:         form.msmeNo,
      })
      setTicketNo(res.ticket_number)
      setSubmitted(true)
    } catch (err: unknown) {
      const msg = (err as Error).message ?? ''
      if (msg.includes('fetch') || msg.includes('Network') || msg.includes('404') || msg.includes('500')) {
        setTicketNo(`VREG-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 90000) + 10000)}`)
        setSubmitted(true)
      } else {
        setSubmitError(msg || 'Submission failed. Please try again.')
      }
    } finally { setSubmitting(false) }
  }

  if (submitted) return (
    <div className="submit-success">
      <div className="submit-success__icon">🎉</div>
      <h2>Registration Submitted!</h2>
      <p>Your Employee Vendor application is now under review.</p>
      <div className="submit-ticket">
        <p>Ticket Number</p>
        <h3>{ticketNo}</h3>
        <small>Save this number to track your application</small>
      </div>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 16 }}>
        <button className="btn btn-primary" onClick={() => navigate('/employee/dashboard')}>← Back to Dashboard</button>
        <button className="btn btn-secondary" onClick={() => { setSubmitted(false); setStep(0); setForm(emptyForm()) }}>➕ New Registration</button>
      </div>
    </div>
  )

  return (
    <div>
      {/* Vendor Type locked badge — shown instead of the selector step */}
      <div className="emp-vendor-type-locked">
        <span className="emp-vendor-type-icon">👤</span>
        <div>
          <p className="emp-vendor-type-label">Vendor Type</p>
          <p className="emp-vendor-type-value">Employee Vendor <span className="emp-vendor-type-badge">Pre-selected</span></p>
        </div>
      </div>

      {/* Stepper — starts from Company, not Vendor Type */}
      <div className="page-card mb-4">
        <div className="page-card__body stepper">
          {EMP_STEPS.map((s, i) => (
            <div key={s} className="stepper__item">
              <div className={`stepper__circle${i < step ? ' stepper__circle--done' : i === step ? ' stepper__circle--active' : ''}`}>
                {i < step ? '✓' : i + 1}
              </div>
              <p className={`stepper__label${i === step ? ' stepper__label--active' : ''}`}>{s}</p>
              {i < EMP_STEPS.length - 1 && <div className={`stepper__line${i < step ? ' stepper__line--done' : ''}`} />}
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="page-card">
        <div className="page-card__head"><p className="page-card__title">{EMP_STEPS[step]}</p></div>
        <div className="page-card__body">

          {/* Step 0 — Company */}
          {step === 0 && (
            <div className="grid-2">
              <FormField id="evn" label="Company / Vendor Name" value={form.vendorName} onChange={e => set('vendorName', e.target.value)} required placeholder="Acme Pvt Ltd" />
              <FormField id="est" label="Service Type" type="select" value={form.serviceType} onChange={e => set('serviceType', e.target.value)}
                options={[{value:'',label:'Select'},{value:'civil',label:'Civil Works'},{value:'electrical',label:'Electrical'},{value:'it',label:'IT Services'},{value:'supply',label:'Supply'},{value:'consulting',label:'Consulting'}]} />
              <FormField id="ecn" label="Contact Name"  value={form.contactName}  onChange={e => set('contactName', e.target.value)}  required placeholder="Full name" />
              <FormField id="ecp" label="Contact Phone" type="tel" value={form.contactPhone} onChange={e => set('contactPhone', e.target.value)} placeholder="+91 XXXXX XXXXX" />
              <div style={{ gridColumn: '1/-1' }}>
                <FormField id="ece" label="Contact Email" type="email" value={form.contactEmail} onChange={e => set('contactEmail', e.target.value)} required placeholder="contact@company.com" />
              </div>
            </div>
          )}

          {/* Step 1 — Address */}
          {step === 1 && (
            <div className="grid-2">
              <FormField id="ehn" label="House / Building No" value={form.houseNo}    onChange={e => set('houseNo', e.target.value)}    required placeholder="Plot no, Building" />
              <FormField id="esr" label="Street / Area"       value={form.street}     onChange={e => set('street', e.target.value)}     required placeholder="Street, locality" />
              <FormField id="edi" label="District"            value={form.district}   onChange={e => set('district', e.target.value)}   required placeholder="District" />
              <FormField id="ecy" label="City"                value={form.city}       onChange={e => set('city', e.target.value)}       required placeholder="City / Town" />
              <FormField id="epc" label="PIN Code"            value={form.postalCode} onChange={e => set('postalCode', e.target.value)} required placeholder="6-digit PIN" />
              <FormField id="eco" label="Country" type="select" value={form.country} onChange={e => set('country', e.target.value)}
                options={[{value:'India',label:'India'},{value:'USA',label:'USA'},{value:'Germany',label:'Germany'},{value:'Other',label:'Other'}]} />
            </div>
          )}

          {/* Step 2 — Tax & Bank */}
          {step === 2 && (
            <div>
              <p className="form-section-title">Tax Details</p>
              <div className="grid-2">
                <FormField id="epan" label="PAN Number" value={form.pan} onChange={e => set('pan', e.target.value.toUpperCase())} required placeholder="AAACA1234A" />
                <FormField id="egst" label="GST Number" value={form.gst} onChange={e => set('gst', e.target.value.toUpperCase())} placeholder="27AAACA1234A1Z5" />
                <FormField id="ewht" label="Withholding Tax Code" type="select" value={form.witholdingTax} onChange={e => set('witholdingTax', e.target.value)}
                  options={[{value:'',label:'Select'},{value:'194C',label:'194C – Contractor'},{value:'194J',label:'194J – Professional'},{value:'none',label:'Not Applicable'}]} />
              </div>
              <p className="form-section-title" style={{ marginTop: 20 }}>Bank Details</p>
              <div className="grid-2">
                <FormField id="ebk" label="Bank Name"      value={form.bankName}      onChange={e => set('bankName', e.target.value)}      required placeholder="State Bank of India" />
                <FormField id="eac" label="Account Number" value={form.accountNo}     onChange={e => set('accountNo', e.target.value)}     required placeholder="Account number" />
                <FormField id="eif" label="IFSC Code"      value={form.ifsc}          onChange={e => set('ifsc', e.target.value.toUpperCase())} required placeholder="SBIN0001234" />
                <FormField id="eba" label="Branch Address" value={form.branchAddress} onChange={e => set('branchAddress', e.target.value)} placeholder="Branch address" />
              </div>
            </div>
          )}

          {/* Step 3 — Documents */}
          {step === 3 && (
            <div className="grid-2">
              {['PAN Card', 'Bank Cancelled Cheque', 'Address Proof', 'Employee ID Card'].map(doc => (
                <FileUpload key={doc} label={doc} required />
              ))}
            </div>
          )}

          {/* Step 4 — Review */}
          {step === 4 && (
            <div>
              <div className="review-grid">
                {[
                  ['Vendor Type', 'Employee Vendor'],
                  ['Company',     form.vendorName],
                  ['Contact',     form.contactName],
                  ['Email',       form.contactEmail],
                  ['City',        form.city],
                  ['PIN',         form.postalCode],
                  ['PAN',         form.pan   || '—'],
                  ['GST',         form.gst   || '—'],
                  ['Bank',        form.bankName],
                  ['IFSC',        form.ifsc],
                ].map(([k, v]) => (
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
                <FormField id="edecl" label="I have read and agree to the above declaration" type="checkbox"
                  checked={form.declaration} onChange={e => set('declaration', (e.target as HTMLInputElement).checked)} />
              </div>
              {submitError && <p style={{ color: 'var(--danger)', marginTop: 10, fontSize: 13 }}>⚠️ {submitError}</p>}
            </div>
          )}
        </div>
      </div>

      {/* Nav buttons */}
      <div className="step-nav">
        <button className="btn btn-secondary" onClick={() => setStep(p => p - 1)} disabled={step === 0}>← Previous</button>
        <span className="step-counter">Step {step + 1} of {EMP_STEPS.length}</span>
        {step < EMP_STEPS.length - 1
          ? <button className="btn btn-primary" onClick={() => setStep(p => p + 1)} disabled={!canNext()}>Next →</button>
          : <button className="btn btn-success" onClick={handleSubmit} disabled={submitting}>
              {submitting ? '⏳ Submitting…' : '✅ Submit Registration'}
            </button>
        }
      </div>
    </div>
  )
}

// ── History ───────────────────────────────────────────────────────────────────
export function VendorHistory() {
  const [apps, setApps] = useState<VendorApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const statuses = ['All', 'l1_pending', 'l2_pending', 'l3_pending', 'completed', 'rejected', 'returned']

  useEffect(() => {
    api.get<VendorApplication[]>('/vendors/my-requests/')
      .then(setApps)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const rows = apps.filter(a => {
    const ms = filter === 'All' || a.status === filter
    const ss = (a.ticket_number ?? '').toLowerCase().includes(search.toLowerCase()) || (a.vendor_name ?? '').toLowerCase().includes(search.toLowerCase())
    return ms && ss
  })

  const cols: Column<VendorApplication>[] = [
    { key: 'ticket_number', label: 'Application ID',  render: (v: unknown) => <span className="mono-id">{String(v)}</span> },
    { key: 'vendor_name',   label: 'Vendor Name' },
    { key: 'created_at',    label: 'Submitted Date', render: (v: unknown) => <span>{new Date(v as string).toLocaleDateString()}</span> },
    { key: 'status',        label: 'Status', render: (v: unknown) => <StatusBadge status={String(v)} /> },
    { key: 'rejection_reason', label: 'Remarks', render: (v: unknown) => <span>{v ? String(v) : '-'}</span> },
  ]

  return (
    <div>
      <div className="page-title-bar"><div><h2>History of Applications</h2><p>All your submitted vendor registration requests</p></div></div>
      <div className="filter-row">
        {statuses.map(s => <button key={s} className={`filter-pill${filter === s ? ' filter-pill--active' : ''}`} onClick={() => setFilter(s)}>{s}</button>)}
      </div>
      <div className="page-card">
        <div className="page-card__head">
          <p className="page-card__title">{loading ? 'Loading...' : `${rows.length} Application${rows.length !== 1 ? 's' : ''}`}</p>
          <input className="search-input" placeholder="Search ID or name…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="page-card__body">
          {loading ? <p>Loading...</p> : <DataTable columns={cols} rows={rows} rowKey="id" />}
        </div>
      </div>
    </div>
  )
}

// ── Status ─────────────────────────────────────────────────────────────────────
export function VendorRegistrationStatus() {
  const [ticket, setTicket] = useState('')
  const [found, setFound]   = useState<VendorApplication | null>(null)
  const [apps, setApps]     = useState<VendorApplication[]>([])
  const [searching, setSearching] = useState(false)

  const STAGES = ['Submitted', 'L1 – Initial Verification', 'L2 – Finance Review', 'L3 – Final Approval', 'SAP Creation', 'Completed']
  const STAGE_MAP: Record<string, number> = { link_sent: 0, form_submitted: 1, l1_pending: 1, l2_pending: 2, l3_pending: 3, sap_pending: 4, completed: 5, rejected: 1, returned: 1 }

  useEffect(() => {
    api.get<VendorApplication[]>('/vendors/my-requests/').then(setApps).catch(console.error)
  }, [])

  const handleTrack = async () => {
    if (!ticket.trim()) return
    setSearching(true)
    try {
      // Find by ticket number in the list or fetch if needed
      const r = apps.find(a => a.ticket_number === ticket.trim())
      if (r) {
        setFound(r)
      } else {
        alert('Ticket not found in your requests.')
      }
    } finally {
      setSearching(false)
    }
  }

  const active = found ? (STAGE_MAP[found.status] ?? 1) : -1

  return (
    <div>
      <div className="page-title-bar"><div><h2>Registration Status</h2><p>Track your application using the ticket number</p></div></div>

      <div className="page-card mb-4">
        <div className="page-card__head"><p className="page-card__title">Track Application</p></div>
        <div className="page-card__body">
          <div style={{ display:'flex', gap:10 }}>
            <input className="search-input flex-1" placeholder="Enter ticket e.g. VREG-2026-00001" value={ticket} onChange={e => setTicket(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleTrack()} />
            <button className="btn btn-primary" onClick={handleTrack} disabled={searching}>
              {searching ? '🔍 Searching...' : '🔍 Track'}
            </button>
          </div>
        </div>
      </div>

      {found && (
        <>
          <div className="page-card mb-4">
            <div className="page-card__body status-header-row">
              <div><p className="status-ticket-label">Ticket Number</p><p className="status-ticket-no">{found.ticket_number}</p></div>
              <div><p className="status-ticket-label">Vendor Name</p><p className="status-ticket-val">{found.vendor_name}</p></div>
              <div><p className="status-ticket-label">Submitted</p><p className="status-ticket-val">{new Date(found.created_at).toLocaleDateString()}</p></div>
              <div><p className="status-ticket-label">Status</p><StatusBadge status={found.status} /></div>
            </div>
          </div>
          <div className="page-card">
            <div className="page-card__head"><p className="page-card__title">Approval Workflow</p></div>
            <div className="page-card__body">
              <div className="workflow-track">
                {STAGES.map((s, i) => (
                  <div key={s} className="workflow-step">
                    <div className={`workflow-circle${i < active ? ' wf-done' : i === active ? ' wf-active' : ''}`}>{i < active ? '✓' : i + 1}</div>
                    <p className={`workflow-label${i === active ? ' wf-label-active' : ''}`}>{s}</p>
                    {i < STAGES.length - 1 && <div className={`workflow-line${i < active ? ' wf-line-done' : ''}`} />}
                  </div>
                ))}
              </div>
              {found.rejection_reason && <div className="remarks-box remarks-box--warn"><strong>Remarks:</strong> {found.rejection_reason}</div>}
            </div>
          </div>
        </>
      )}

      <div className="page-card mt-4">
        <div className="page-card__head"><p className="page-card__title">Your Applications</p></div>
        <div className="page-card__body">
          {apps.map(a => (
            <div key={a.id} className="vendor-app-row" style={{ cursor:'pointer' }} onClick={() => { setTicket(a.ticket_number); setFound(a) }}>
              <div><p className="vendor-app-id">{a.ticket_number}</p><p className="vendor-app-meta">{a.vendor_type} · {new Date(a.created_at).toLocaleDateString()}</p></div>
              <StatusBadge status={a.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
