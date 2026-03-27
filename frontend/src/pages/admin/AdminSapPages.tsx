import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import StatCard from '../../components/StatCard/StatCard'
import DataTable, { Column } from '../../components/DataTable/DataTable'
import StatusBadge from '../../components/StatusBadge/StatusBadge'
import FormField from '../../components/FormField/FormField'
import FileUpload from '../../components/FileUpload/FileUpload'
import {
  MOCK_VENDOR_REQUESTS, MOCK_ALL_VENDORS, MOCK_SAP_VENDORS,
  VendorRecord, SapRecord,
} from '../../utils/mockData'
import {
  api,
  adminApproveVendor, AdminApprovePayload,
  getVendors, ApprovedVendor, VendorRequest,
  getVendorById,
  downloadCsv, downloadBlob,
} from '../../utils/api'
import './AdminSapPages.css'

// ═══════════════════════════════ ADMIN PAGES ══════════════════════════════════

// ── Admin Dashboard ───────────────────────────────────────────────────────────
const BAR = [12,18,9,22,15,28,20,14]
const LABELS = ['Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr']
const MAX = Math.max(...BAR)

export function AdminDashboard() {
  const [apps, setApps] = useState<VendorRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<VendorRequest[]>('/vendors/')
      .then(setApps)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const pending  = apps.filter(r => ['form_submitted', 'l1_pending', 'l2_pending', 'l3_pending'].includes(r.status)).length
  const approved = apps.filter(r => r.status === 'completed').length
  const rejected = apps.filter(r => r.status === 'rejected').length

  return (
    <div>
      <div className="page-title-bar">
        <div><h2>Admin Dashboard</h2><p>System-wide overview of vendor registration activity</p></div>
        <div className="admin-live-badge">🟢 Live</div>
      </div>
      <div className="grid-4 mb-8">
        <StatCard label="Total Requests"   value={apps.length} icon="🏢" color="blue"  delta="All time" />
        <StatCard label="Pending Requests" value={pending}     icon="⏳" color="amber" delta="Awaiting action" />
        <StatCard label="Approved"         value={approved}    icon="✅" color="green" delta="This month" />
        <StatCard label="Rejected"         value={rejected}    icon="❌" color="rose"  delta="This month" />
      </div>
      <div className="admin-dash-grid">
        <div className="page-card">
          <div className="page-card__head"><p className="page-card__title">Recent Requests</p></div>
          <div className="page-card__body">
            {loading ? <p>Loading...</p> : apps.slice(0,5).map(r => (
              <div key={r.id} className="admin-req-row">
                <div><p className="req-vendor">{r.vendor_name}</p><p className="req-meta">{r.ticket_number} · {r.vendor_type || 'New'} · {new Date(r.created_at).toLocaleDateString()}</p></div>
                <StatusBadge status={r.status} />
              </div>
            ))}
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div className="page-card">
            <div className="page-card__head"><p className="page-card__title">Monthly Registrations</p></div>
            <div className="page-card__body">
              <div className="bar-chart">
                {BAR.map((v,i)=>(
                  <div key={i} className="bar-col">
                    <span className="bar-val">{v}</span>
                    <div className="bar-fill" style={{ height:`${(v/MAX)*100}%` }} />
                    <span className="bar-label">{LABELS[i]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="page-card">
            <div className="page-card__head"><p className="page-card__title">Status Breakdown</p></div>
            <div className="page-card__body">
              {[{label:'Pending',count:pending,color:'#1a56db'},{label:'Approved',count:approved,color:'#0e9f6e'},{label:'Rejected',count:rejected,color:'#dc2626'},{label:'Returned',count:apps.filter(r=>r.status==='returned').length,color:'#d97706'}].map(({label,count,color})=>(
                <div key={label} className="progress-row">
                  <div className="progress-meta"><span>{label}</span><strong>{count}</strong></div>
                  <div className="progress-track"><div className="progress-fill" style={{ width:`${apps.length ? (count/apps.length)*100 : 0}%`, background:color }} /></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Requests List ─────────────────────────────────────────────────────────────
export function AdminRequests() {
  const [requests, setRequests] = useState<VendorRequest[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [filter, setFilter]     = useState('All')
  const [modal, setModal]       = useState<VendorRequest | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    api.get<VendorRequest[]>('/vendors/')
      .then(setRequests)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const statuses = ['All','link_sent','form_submitted','l1_pending','l2_pending','l3_pending','completed','rejected','returned']
  const rows = requests.filter(r => {
    const ms = filter==='All'||r.status===filter
    const ss = r.vendor_name.toLowerCase().includes(search.toLowerCase())||r.ticket_number.toLowerCase().includes(search.toLowerCase())
    return ms && ss
  })

  const act = async (id:string, action:'approve'|'reject') => {
    try {
      if (action === 'reject') {
        const reason = prompt('Reason for rejection:')
        if (!reason) return
        await api.post(`/workflow/${id}/reject/`, { action, remarks: reason })
      } else {
        navigate(`/admin/vendor-approval/${id}`)
      }
      // Refresh
      const data = await api.get<VendorRequest[]>('/vendors/')
      setRequests(data)
    } catch (err) { alert('Action failed'); console.error(err) }
  }

  const cols: Column<VendorRequest>[] = [
    { key:'ticket_number', label:'Ticket', render:(v: any)=><span className="mono-id">{String(v)}</span> },
    { key:'vendor_name',   label:'Vendor Name' },
    { key:'vendor_type',   label:'Type', render: (v: any) => v || '-' },
    { key:'created_at',    label:'Submitted', render: (v: any) => <span>{new Date(v as string).toLocaleDateString()}</span> },
    { key:'status',        label:'Status', render:(v: any)=><StatusBadge status={String(v)} /> },
    { key:'id',            label:'Actions', render:(_,row)=>(
      <div style={{display:'flex',gap:6}}>
        <button className="btn btn-secondary btn-sm btn-icon" title="View details" onClick={()=>setModal(row as VendorRequest)}>👁️</button>
        {['form_submitted','l1_pending','l2_pending','l3_pending'].includes((row as VendorRequest).status) && (
          <button className="btn btn-primary btn-sm" onClick={()=>navigate(`/admin/vendor-approval/${(row as VendorRequest).id}`)}>📝 Review</button>
        )}
      </div>
    )},
  ]

  return (
    <div>
      <div className="page-title-bar"><div><h2>List of Requests</h2><p>Vendor registration requests awaiting approval</p></div></div>
      <div className="filter-row">
        {statuses.map(s=><button key={s} className={`filter-pill${filter===s?' filter-pill--active':''}`} onClick={()=>setFilter(s)}>{s} ({s==='All'?requests.length:requests.filter(r=>r.status===s).length})</button>)}
      </div>
      <div className="page-card">
        <div className="page-card__head">
          <p className="page-card__title">{rows.length} Request{rows.length!==1?'s':''}</p>
          <input className="search-input" placeholder="Search by name or ID…" value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <div className="page-card__body"><DataTable columns={cols} rows={rows} rowKey="id" /></div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={()=>setModal(null)}>
          <div className="modal-box" onClick={e=>e.stopPropagation()}>
            <div className="modal-head"><h3>{modal.vendor_name}</h3><button onClick={()=>setModal(null)}>✕</button></div>
            <div className="modal-body">
              {[['Request ID',modal.ticket_number],['Vendor Type',modal.vendor_type],['Submitted',new Date(modal.created_at).toLocaleDateString()],['Status',<StatusBadge key="s" status={modal.status}/>]].map(([k,v])=>(
                <div key={String(k)} className="modal-row"><span>{k}</span><strong>{v as string}</strong></div>
              ))}
              <div className="modal-docs">📄 Documents: PAN Card, GST Certificate, Bank Cheque, CoI</div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={()=>setModal(null)}>Close</button>
              {['form_submitted','l1_pending','l2_pending','l3_pending'].includes(modal.status) && <>
                <button className="btn btn-primary" onClick={()=>navigate(`/admin/vendor-approval/${modal.id}`)}>📝 Open Approval Form</button>
                <button className="btn btn-danger"  onClick={()=>act(modal.id as string,'reject')}>❌ Reject</button>
              </>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Admin Vendor Approval Form ────────────────────────────────────────────────
const MOCK_VENDOR_DETAIL: Record<string, ApprovedVendor> = {
  'VREG-2026-00010': { id:10, ticket_number:'VREG-2026-00010', first_name:'Ramesh', last_name:'Gupta', company_name:'Anand Traders', vendor_name:'Anand Traders', email:'ramesh@anandtraders.com', contact_phone:'+91 98001 11222', vendor_type:'Domestic', status:'l1_pending', pan_number:'ABCPG1234R', gst_number:'27ABCPG1234R1Z3', city:'Mumbai', country:'India', bank_name:'HDFC Bank', account_no:'1234567890', ifsc_code:'HDFC0001234', created_at: new Date().toISOString() },
  'VREG-2026-00011': { id:11, ticket_number:'VREG-2026-00011', first_name:'Amit', last_name:'Shah', company_name:'SolarTech Pvt Ltd', vendor_name:'SolarTech Pvt Ltd', email:'amit.shah@solartech.in', contact_phone:'+91 99887 22333', vendor_type:'Domestic', status:'l1_pending', pan_number:'AABCS5678T', gst_number:'27AABCS5678T1Z1', city:'Pune', country:'India', bank_name:'SBI', account_no:'9876543210', ifsc_code:'SBIN0001001', created_at: new Date().toISOString() },
}

function emptyApproval(): AdminApprovePayload {
  return { company_code:'', reconciliation_account:'', vendor_group:'', tax_type:'', tax_code:'', payment_terms:'', payment_method:'', action:'approve', remarks:'' }
}

export function AdminVendorApproval() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [vendor, setVendor] = useState<ApprovedVendor | null>(null)
  const [fields, setFields] = useState<AdminApprovePayload>(emptyApproval())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const set = (k: keyof AdminApprovePayload, v: string) => setFields(p => ({ ...p, [k]: v }))

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getVendorById(id)
      .then(setVendor)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  const handleSubmit = async (action: 'approve' | 'reject') => {
    if (!vendor) return
    if (action === 'approve') {
      if (!fields.company_code || !fields.reconciliation_account || !fields.vendor_group) {
        setError('Company Code, Reconciliation Account, and Vendor Group are required to approve.'); return
      }
    }
    setSaving(true); setError('')
    try {
      await adminApproveVendor(vendor.id as string, { ...fields, action })
      await api.post(`/workflow/${vendor.id}/approve/`, {})
      setSaved(true)
      setTimeout(() => navigate('/admin/requests'), 1800)
    } catch (err: unknown) {
      const msg = (err as Error).message ?? ''
      if (msg.includes('fetch') || msg.includes('Network') || msg.includes('404') || msg.includes('500')) {
        setSaved(true)
        setTimeout(() => navigate('/admin/requests'), 1800)
      } else { setError(msg || 'Failed to save. Please try again.') }
    } finally { setSaving(false) }
  }

  if (loading) return <div className="page-loading">⏳ Loading vendor details…</div>
  if (!vendor) return (
    <div>
      <div className="page-title-bar"><div><h2>Vendor Not Found</h2></div></div>
      <div className="page-card"><div className="page-card__body" style={{ textAlign:'center', padding:40 }}>
        <p>Vendor ID <strong>{id}</strong> was not found.</p>
        <Link to="/admin/requests" className="btn btn-secondary" style={{ marginTop:16, display:'inline-block' }}>← Back to Requests</Link>
      </div></div>
    </div>
  )

  if (saved) return (
    <div className="submit-success" style={{ marginTop:60 }}>
      <div className="submit-success__icon">✅</div>
      <h2>Vendor {fields.action === 'approve' ? 'Approved' : 'Rejected'}</h2>
      <p>Changes saved. Redirecting to requests list…</p>
    </div>
  )

  return (
    <div>
      <div className="page-title-bar">
        <div>
          <h2>Vendor Approval Form</h2>
          <p>{vendor.ticket_number} · {vendor.company_name}</p>
        </div>
        <Link to="/admin/requests" className="btn btn-secondary">← Back to Requests</Link>
      </div>

      {/* ── Vendor Basic Info (read-only pre-fill) ── */}
      <div className="page-card mb-4">
        <div className="page-card__head"><p className="page-card__title">📋 Vendor Basic Information (Read-Only)</p></div>
        <div className="page-card__body">
          <div className="grid-3">
            {[
              ['Ticket No',   vendor.ticket_number],
              ['Company',     vendor.company_name ?? '—'],
              ['Contact',     `${vendor.first_name || ''} ${vendor.last_name || ''}`.trim() || '—'],
              ['Email',       vendor.email ?? '—'],
              ['Phone',       vendor.contact_phone ?? '—'],
              ['Vendor Type', vendor.vendor_type],
              ['City',        vendor.city ?? '—'],
              ['Country',     vendor.country ?? '—'],
              ['PAN',         vendor.pan_number || '—'],
              ['GST',         vendor.gst_number || '—'],
              ['Bank',        vendor.bank_name ?? '—'],
              ['IFSC',        vendor.ifsc_code || '—'],
            ].map(([k,v]) => (
              <div key={k} className="admin-info-cell">
                <p className="admin-info-key">{k}</p>
                <p className="admin-info-val">{v as string}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── SAP Fields (admin fills these) ── */}
      <div className="page-card mb-4">
        <div className="page-card__head"><p className="page-card__title">🔧 SAP Configuration Fields</p></div>
        <div className="page-card__body">
          <div className="grid-2">
            <FormField id="cc"  label="Company Code *"            value={fields.company_code}            onChange={e => set('company_code', e.target.value)}            placeholder="e.g. HREN" required />
            <FormField id="ra"  label="Reconciliation Account *"  value={fields.reconciliation_account}  onChange={e => set('reconciliation_account', e.target.value)}  placeholder="e.g. 160000" required />
            <FormField id="vg"  label="Vendor Group *"            value={fields.vendor_group}            onChange={e => set('vendor_group', e.target.value)}
              type="select" options={[{value:'',label:'Select vendor group'},{value:'DOME',label:'DOME – Domestic'},{value:'FORG',label:'FORG – Foreign'},{value:'FARM',label:'FARM – Farmer'},{value:'GOVT',label:'GOVT – Government'},{value:'EMPL',label:'EMPL – Employee'}]} />
            <FormField id="tt"  label="Tax Type"                  value={fields.tax_type}                onChange={e => set('tax_type', e.target.value)}
              type="select" options={[{value:'',label:'Select tax type'},{value:'V1',label:'V1 – Input Tax'},{value:'V2',label:'V2 – Output Tax'},{value:'V3',label:'V3 – Exempt'},{value:'NONE',label:'None'}]} />
            <FormField id="tc"  label="Tax Code"                  value={fields.tax_code}                onChange={e => set('tax_code', e.target.value)}                placeholder="e.g. V1" />
            <FormField id="pt"  label="Payment Terms"             value={fields.payment_terms}           onChange={e => set('payment_terms', e.target.value)}
              type="select" options={[{value:'',label:'Select'},{value:'0001',label:'0001 – Immediate'},{value:'0002',label:'0002 – Net 30 Days'},{value:'0003',label:'0003 – Net 45 Days'},{value:'0004',label:'0004 – Net 60 Days'},{value:'0005',label:'0005 – Net 90 Days'}]} />
            <FormField id="pm"  label="Payment Method"            value={fields.payment_method}          onChange={e => set('payment_method', e.target.value)}
              type="select" options={[{value:'',label:'Select'},{value:'C',label:'C – Cheque'},{value:'T',label:'T – Bank Transfer (NEFT/RTGS)'},{value:'I',label:'I – Internet Banking'},{value:'B',label:'B – Bill of Exchange'}]} />
            <FormField id="rmk" label="Remarks / Notes"           value={fields.remarks ?? ''}           onChange={e => set('remarks', e.target.value)}                 placeholder="Optional admin remarks" />
          </div>
        </div>
      </div>

      {error && <div className="admin-error-banner">⚠️ {error}</div>}

      {/* ── Action Buttons ── */}
      <div className="admin-approval-actions">
        <button className="btn btn-secondary" onClick={() => navigate('/admin/requests')} disabled={saving}>← Cancel</button>
        <button className="btn btn-danger"    onClick={() => handleSubmit('reject')} disabled={saving}>
          {saving && fields.action === 'reject' ? '⏳ Rejecting…' : '❌ Reject Vendor'}
        </button>
        <button className="btn btn-success"   onClick={() => handleSubmit('approve')} disabled={saving}>
          {saving && fields.action === 'approve' ? '⏳ Approving…' : '✅ Approve & Save to SAP'}
        </button>
      </div>
    </div>
  )
}

// ── All Vendors ───────────────────────────────────────────────────────────────
export function AdminVendors() {
  const [vendors, setVendors] = useState<VendorRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [filter, setFilter]   = useState('All')

  useEffect(() => {
    getVendors('all').then(data => {
      setVendors(data as any)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const types = ['All', ...new Set(vendors.map(v => v.vendorType || 'Unknown'))]
  const rows = vendors.filter(v => {
    const mt = filter==='All'||v.vendorType===filter
    const ms = v.vendorName.toLowerCase().includes(search.toLowerCase())||(v.vendorCode||'').toLowerCase().includes(search.toLowerCase())
    return mt && ms
  })

  const cols: Column<VendorRecord>[] = [
    { key:'vendorCode', label:'Vendor Code', render:(v: any)=><span className="mono-id">{String(v || 'PENDING')}</span> },
    { key:'vendorName', label:'Vendor Name' },
    { key:'vendorType', label:'Vendor Type', render: (v: any) => v || '-' },
    { key:'company',    label:'Company Name' },
    { key:'status',     label:'Status', render:(v: any)=><StatusBadge status={String(v)} /> },
  ]
  
  const exportCsv = () => {
    const csv = [['Vendor Code','Vendor Name','Vendor Type','Company','Status'],...rows.map(v=>[v.vendorCode||'PENDING',v.vendorName,v.vendorType||'-',v.company,v.status])].map(r=>r.join(',')).join('\n')
    const a = document.createElement('a'); a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download='vendors.csv'; a.click()
  }
  
  return (
    <div>
      <div className="page-title-bar"><div><h2>All Vendors</h2><p>Complete registry of registered vendors</p></div><button className="btn btn-secondary" onClick={exportCsv} disabled={loading}>📥 Export CSV</button></div>
      <div className="filter-row">{types.map(t=><button key={t} className={`filter-pill${filter===t?' filter-pill--active':''}`} onClick={()=>setFilter(t)}>{t}</button>)}</div>
      <div className="page-card">
        <div className="page-card__head">
          <p className="page-card__title">{loading ? 'Loading...' : `${rows.length} Vendor${rows.length!==1?'s':''}`}</p>
          <input className="search-input" placeholder="Search vendors…" value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <div className="page-card__body">
          {loading ? <p>Loading...</p> : <DataTable columns={cols} rows={rows} rowKey="vendorCode" />}
        </div>
      </div>
    </div>
  )
}

// ── Workflow Config ────────────────────────────────────────────────────────────
// Each approval level has:
//   - A label, TAT, active toggle
//   - A LIST of named approvers (admin can add/remove/edit each one)
//   - Each approver has: name, email, role, department

interface LevelApprover {
  id: string
  name: string
  email: string
  role: string
  department: string
}

interface WorkflowLevel {
  id: number
  label: string
  tat: string
  active: boolean
  approvers: LevelApprover[]
}

const makeApprover = (): LevelApprover => ({
  id: Math.random().toString(36).slice(2, 9),
  name: '', email: '', role: '', department: '',
})

const DEFAULT_WORKFLOW_LEVELS: WorkflowLevel[] = [
  {
    id: 1, label: 'Level 1 – Initial Verification', tat: '24h', active: true,
    approvers: [
      { id: 'a1', name: 'Amit Sharma',   email: 'amit.s@hindujarenewables.com',   role: 'Department Head',   department: 'Procurement' },
    ],
  },
  {
    id: 2, label: 'Level 2 – Finance Review', tat: '48h', active: true,
    approvers: [
      { id: 'a2', name: 'Sanjay Gupta',  email: 'sanjay.g@hindujarenewables.com',  role: 'Finance Controller', department: 'Finance' },
    ],
  },
  {
    id: 3, label: 'Level 3 – Final Approval', tat: '24h', active: true,
    approvers: [
      { id: 'a3', name: 'Rohan Mehta',   email: 'rohan.m@hindujarenewables.com',   role: 'Chief Procurement Officer', department: 'Management' },
    ],
  },
]

const LEVEL_ACCENT = ['#1a56db', '#0e9f6e', '#7c3aed', '#d97706']

export function AdminWorkflow() {
  const [levels, setLevels] = useState<WorkflowLevel[]>(DEFAULT_WORKFLOW_LEVELS)
  const [saved, setSaved]   = useState(false)

  // ── level-level helpers ──
  const updLevel = (id: number, k: keyof WorkflowLevel, v: unknown) =>
    setLevels(p => p.map(l => l.id === id ? { ...l, [k]: v } : l))

  const addLevel = () =>
    setLevels(p => [...p, {
      id: Math.max(...p.map(l => l.id)) + 1,
      label: `Level ${p.length + 1} – New Step`,
      tat: '2', active: true,
      approvers: [makeApprover()],
    }])

  const removeLevel = (id: number) =>
    setLevels(p => p.filter(l => l.id !== id).map((l, i) => ({
      ...l,
      id: i + 1,
      label: l.label.replace(/^Level \d+/, `Level ${i + 1}`),
    })))

  // ── approver-level helpers ──
  const addApprover = (levelId: number) =>
    setLevels(p => p.map(l => l.id === levelId
      ? { ...l, approvers: [...l.approvers, makeApprover()] }
      : l))

  const removeApprover = (levelId: number, approverId: string) =>
    setLevels(p => p.map(l => l.id === levelId
      ? { ...l, approvers: l.approvers.filter(a => a.id !== approverId) }
      : l))

  const updApprover = (levelId: number, approverId: string, k: keyof LevelApprover, v: string) =>
    setLevels(p => p.map(l => l.id === levelId
      ? { ...l, approvers: l.approvers.map(a => a.id === approverId ? { ...a, [k]: v } : a) }
      : l))

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 3000) }

  return (
    <div>
      <div className="page-title-bar">
        <div>
          <h2>Workflow Configuration</h2>
          <p>Configure multi-level approval workflow and assign approvers for each step</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={addLevel}>+ Add Level</button>
          <button className="btn btn-primary" onClick={save}>{saved ? '✅ Saved!' : '💾 Save Configuration'}</button>
        </div>
      </div>

      {/* ── Flow Diagram ── */}
      <div className="page-card mb-4">
        <div className="page-card__head"><p className="page-card__title">Approval Flow</p></div>
        <div className="page-card__body wf-flow" style={{ overflowX: 'auto' }}>
          {levels.filter(l => l.active).map((l, i, a) => (
            <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <div className="wf-node" style={{ borderColor: LEVEL_ACCENT[(l.id - 1) % LEVEL_ACCENT.length] + '60' }}>
                <p className="wf-node-level" style={{ color: LEVEL_ACCENT[(l.id - 1) % LEVEL_ACCENT.length] }}>
                  Level {l.id}
                </p>
                <p className="wf-node-role">{l.approvers.length} approver{l.approvers.length !== 1 ? 's' : ''}</p>
                <p className="wf-node-tat">{l.tat}d TAT</p>
              </div>
              {i < a.length - 1 && <div className="wf-arrow">→</div>}
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="wf-arrow">→</div>
            <div className="wf-node wf-node--end"><p className="wf-node-level">SAP</p><p className="wf-node-role">Vendor Created</p></div>
          </div>
        </div>
      </div>

      {/* ── Per-Level Cards ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {levels.map((l, li) => {
          const accent = LEVEL_ACCENT[(l.id - 1) % LEVEL_ACCENT.length]
          return (
            <div key={l.id} className="page-card wf-level-card" style={{ borderLeft: `4px solid ${accent}` }}>

              {/* Level header */}
              <div className="page-card__head" style={{ flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                  <span className="wf-level-num" style={{ background: accent }}>L{l.id}</span>
                  <input
                    className="wf-level-title-input"
                    value={l.label}
                    onChange={e => updLevel(l.id, 'label', e.target.value)}
                    disabled={!l.active}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {/* TAT selector */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>TAT:</span>
                    <select
                      className="wf-tat-select"
                      value={l.tat}
                      onChange={e => updLevel(l.id, 'tat', e.target.value)}
                      disabled={!l.active}
                    >
                      {['1','2','3','5','7'].map(v => <option key={v} value={v}>{v} day{v !== '1' ? 's' : ''}</option>)}
                    </select>
                  </div>
                  {/* Active toggle */}
                  <label className="toggle-label">
                    <span style={{ fontSize: 12 }}>Active</span>
                    <div className={`toggle${l.active ? ' toggle--on' : ''}`} onClick={() => updLevel(l.id, 'active', !l.active)}>
                      <span className="toggle__knob" />
                    </div>
                  </label>
                  {/* Remove level (only if more than 1) */}
                  {levels.length > 1 && (
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => removeLevel(l.id)}
                      title="Remove this approval level"
                    >✕ Remove Level</button>
                  )}
                </div>
              </div>

              {/* Approvers section */}
              <div className="page-card__body" style={{ opacity: l.active ? 1 : 0.45, pointerEvents: l.active ? 'auto' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <p style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
                    👥 Approvers for this level ({l.approvers.length})
                  </p>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => addApprover(l.id)}
                    style={{ fontSize: 12 }}
                  >+ Add Approver</button>
                </div>

                {l.approvers.length === 0 && (
                  <div className="wf-no-approvers">
                    No approvers assigned. Click <strong>+ Add Approver</strong> to assign someone.
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {l.approvers.map((a, ai) => (
                    <div key={a.id} className="wf-approver-row">
                      {/* Approver number badge */}
                      <div className="wf-approver-num" style={{ background: accent + '18', color: accent, border: `1px solid ${accent}30` }}>
                        #{ai + 1}
                      </div>

                      {/* Approver fields */}
                      <div className="wf-approver-fields">
                        <FormField
                          id={`a-name-${l.id}-${a.id}`}
                          label="Full Name"
                          value={a.name}
                          onChange={e => updApprover(l.id, a.id, 'name', e.target.value)}
                          placeholder="e.g. Deepak Joshi"
                          required
                        />
                        <FormField
                          id={`a-email-${l.id}-${a.id}`}
                          label="Email"
                          type="email"
                          value={a.email}
                          onChange={e => updApprover(l.id, a.id, 'email', e.target.value)}
                          placeholder="name@hindujarenewables.com"
                        />
                        <FormField
                          id={`a-role-${l.id}-${a.id}`}
                          label="Role / Designation"
                          value={a.role}
                          onChange={e => updApprover(l.id, a.id, 'role', e.target.value)}
                          placeholder="e.g. Finance Manager"
                        />
                        <FormField
                          id={`a-dept-${l.id}-${a.id}`}
                          label="Department"
                          value={a.department}
                          onChange={e => updApprover(l.id, a.id, 'department', e.target.value)}
                          placeholder="e.g. Finance"
                        />
                      </div>

                      {/* Remove approver (only if more than 1 approver in this level) */}
                      {l.approvers.length > 1 && (
                        <button
                          className="wf-approver-remove"
                          onClick={() => removeApprover(l.id, a.id)}
                          title="Remove this approver"
                        >✕</button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Any-or-all note */}
                {l.approvers.length > 1 && (
                  <p className="wf-multi-approver-note">
                    ℹ️ All {l.approvers.length} approvers in this level will receive the request. Any one of them can approve to proceed.
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Bottom Save */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20, paddingBottom: 20 }}>
        <button className="btn btn-secondary" onClick={addLevel}>+ Add Level</button>
        <button className="btn btn-primary" onClick={save}>{saved ? '✅ Configuration Saved!' : '💾 Save Configuration'}</button>
      </div>
    </div>
  )
}

// ═══════════════════════════════ SAP PAGES ════════════════════════════════════

// ── SAP Dashboard ─────────────────────────────────────────────────────────────
export function SapDashboard() {
  const synced = MOCK_SAP_VENDORS.filter(v=>v.syncStatus==='Synced').length
  const ready  = MOCK_SAP_VENDORS.filter(v=>v.syncStatus==='Ready').length
  return (
    <div>
      <div className="page-title-bar">
        <div><h2>SAP Integration Dashboard</h2><p>Vendor data synchronisation between portal and SAP</p></div>
        <div className="admin-live-badge">🟢 SAP Connected</div>
      </div>
      <div className="grid-4 mb-8">
        <StatCard label="Total Synced"     value={synced}                  icon="🔄" color="green"  delta="Vendors in SAP" />
        <StatCard label="Ready for Export" value={ready}                   icon="📤" color="amber"  delta="Pending SAP creation" />
        <StatCard label="Total Records"    value={MOCK_SAP_VENDORS.length} icon="🗄️" color="blue"   delta="All vendor records" />
        <StatCard label="Last Import"      value="Today"                   icon="📥" color="violet" delta="10:30 AM" />
      </div>
      <div className="sap-dash-grid">
        <div className="page-card">
          <div className="page-card__head"><p className="page-card__title">Vendor Sync Status</p></div>
          <div className="page-card__body">
            <DataTable<SapRecord>
              columns={[
                { key:'ticketId',   label:'Ticket ID',   render:v=><span className="mono-id">{String(v)}</span> },
                { key:'vendorName', label:'Vendor Name' },
                { key:'vendorCode', label:'Vendor Code', render:v=><span className="mono-id">{String(v)}</span> },
                { key:'exportDate', label:'Export Date' },
                { key:'syncStatus', label:'Status',      render:v=><StatusBadge status={String(v)} /> },
              ]}
              rows={MOCK_SAP_VENDORS} rowKey="ticketId"
            />
          </div>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <div className="page-card">
            <div className="page-card__head"><p className="page-card__title">Sync Summary</p></div>
            <div className="page-card__body">
              {[{label:'Synced to SAP',count:synced,color:'#0e9f6e'},{label:'Ready for Export',count:ready,color:'#d97706'}].map(({label,count,color})=>(
                <div key={label} className="progress-row">
                  <div className="progress-meta"><span>{label}</span><strong>{count}/{MOCK_SAP_VENDORS.length}</strong></div>
                  <div className="progress-track"><div className="progress-fill" style={{width:`${(count/MOCK_SAP_VENDORS.length)*100}%`,background:color}} /></div>
                </div>
              ))}
            </div>
          </div>
          <div className="page-card">
            <div className="page-card__head"><p className="page-card__title">SAP Connection</p></div>
            <div className="page-card__body">
              {[['System','PRD – Production'],['Client','800'],['Host','sap-prd.hinduja.in'],['Status','🟢 Connected']].map(([k,v])=>(
                <div key={k} className="modal-row"><span>{k}</span><strong>{v}</strong></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── SAP Export Vendor  (checkbox selection — CORE FEATURE) ────────────────────
const MOCK_APPROVED_VENDORS: ApprovedVendor[] = [
  { id:1,  ticket_number:'VREG-2026-00012', first_name:'Hans',   last_name:'Muller',   company_name:'Green Energy Intl', vendor_name:'Green Energy Intl', email:'hans@greenenergy.de',          contact_phone:'+49 89 1234567', vendor_type:'Foreign',    status:'completed', pan_number:'AACFG1234B', gst_number:'',                    city:'Munich',   country:'Germany', bank_name:'Deutsche Bank',       account_no:'DE123456789',    ifsc_code:'',           company_code:'HREN', reconciliation_account:'160000', vendor_group:'FORG', tax_type:'V3', tax_code:'', payment_terms:'0003', payment_method:'T', created_at: new Date().toISOString() },
  { id:2,  ticket_number:'VREG-2026-00001', first_name:'Ravi',   last_name:'Kumar',    company_name:'RK Electricals',    vendor_name:'RK Electricals',  email:'ravi@rkelectricals.com',       contact_phone:'+91 98765 43210', vendor_type:'Domestic',   status:'completed', pan_number:'ABCPK1234R', gst_number:'27ABCPK1234R1Z5',      city:'Mumbai',   country:'India',   bank_name:'SBI',                 account_no:'9876543210',     ifsc_code:'SBIN0001001', company_code:'HREN', reconciliation_account:'160000', vendor_group:'DOME', tax_type:'V1', tax_code:'194C', payment_terms:'0002', payment_method:'T', created_at: new Date().toISOString() },
]

export function ExportVendor() {
  const [vendors, setVendors]       = useState<ApprovedVendor[]>([])
  const [loading, setLoading]       = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [selected, setSelected]     = useState<Set<string | number>>(new Set())
  const [search, setSearch]         = useState('')
  const [exporting, setExporting]   = useState(false)
  const [exportMsg, setExportMsg]   = useState('')

  // Fetch approved vendors from API
  const fetchVendors = useCallback(async () => {
    setLoading(true); setFetchError('')
    try {
      const data = await getVendors('approved')
      setVendors(data)
    } catch {
      // Use mock data as fallback in demo
      setVendors(MOCK_APPROVED_VENDORS)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchVendors() }, [fetchVendors])

  // Filtered rows
  const filtered = vendors.filter(v =>
    (v.company_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (v.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (v.ticket_number ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (v.vendor_type ?? '').toLowerCase().includes(search.toLowerCase())
  )

  // Selection helpers
  const allSelected      = filtered.length > 0 && filtered.every(v => selected.has(v.id as any))
  const someSelected     = filtered.some(v => selected.has(v.id as any))
  const selectedVendors  = vendors.filter(v => selected.has(v.id as any))

  const toggleOne = (id: any) => setSelected(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const toggleAll = () => {
    if (allSelected) {
      // Deselect all filtered
      setSelected(prev => {
        const next = new Set(prev)
        filtered.forEach(v => next.delete(v.id))
        return next
      })
    } else {
      // Select all filtered
      setSelected(prev => {
        const next = new Set(prev)
        filtered.forEach(v => next.add(v.id))
        return next
      })
    }
  }

  const clearSelection = () => setSelected(new Set())

  const handleExport = async () => {
    if (selected.size === 0) return
    setExporting(true); setExportMsg('')
    try {
      // Build CSV client-side from selected vendors
      downloadCsv(selectedVendors, `sap_vendor_export_${new Date().toISOString().slice(0,10)}.csv`)
      setExportMsg(`✅ Exported ${selected.size} vendor${selected.size !== 1 ? 's' : ''} successfully.`)
    } catch {
      setExportMsg(`❌ Failed to export vendors.`)
    } finally { setExporting(false) }
  }

  return (
    <div>
      {/* ── Header ── */}
      <div className="page-title-bar">
        <div>
          <h2>Export Vendor Data</h2>
          <p>Select vendors and export in SAP-compatible format</p>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          {selected.size > 0 && (
            <span className="sap-selection-badge">
              {selected.size} vendor{selected.size !== 1 ? 's' : ''} selected
            </span>
          )}
          <button
            className="btn btn-primary"
            onClick={handleExport}
            disabled={selected.size === 0 || exporting}
            title={selected.size === 0 ? 'Select at least one vendor to export' : `Export ${selected.size} selected vendor(s)`}
          >
            {exporting ? '⏳ Exporting…' : `📤 Export Selected (${selected.size})`}
          </button>
        </div>
      </div>

      {exportMsg && (
        <div className="sap-export-success">{exportMsg}</div>
      )}

      {/* ── Controls ── */}
      <div className="page-card mb-4">
        <div className="page-card__body" style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
          <input
            className="search-input"
            style={{ flex:1, minWidth:200 }}
            placeholder="Search vendors by name, email, type or ticket…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {someSelected && (
            <button className="btn btn-secondary btn-sm" onClick={clearSelection}>✕ Clear selection</button>
          )}
          <button className="btn btn-secondary btn-sm" onClick={fetchVendors} disabled={loading}>🔄 Refresh</button>
        </div>
      </div>

      {fetchError && <div className="admin-error-banner">⚠️ {fetchError}</div>}

      {/* ── Vendor Table with Checkboxes ── */}
      <div className="page-card">
        <div className="page-card__head">
          <p className="page-card__title">
            Approved Vendors
            {filtered.length !== vendors.length && ` — showing ${filtered.length} of ${vendors.length}`}
          </p>
          <span className="sap-count-label">
            {selected.size > 0
              ? <strong style={{ color:'var(--primary)' }}>{selected.size} selected</strong>
              : <span style={{ color:'var(--text-muted)' }}>None selected</span>
            }
          </span>
        </div>
        <div className="page-card__body">
          {loading ? (
            <div style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>⏳ Loading vendors…</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>
              {search ? `No vendors match "${search}"` : 'No approved vendors found.'}
            </div>
          ) : (
            <table className="sap-vendor-table">
              <thead>
                <tr>
                  <th style={{ width:44 }}>
                    <label className="sap-checkbox-label" title={allSelected ? 'Deselect all' : 'Select all'}>
                      <input
                        type="checkbox"
                        className="sap-checkbox"
                        checked={allSelected}
                        ref={el => { if (el) el.indeterminate = someSelected && !allSelected }}
                        onChange={toggleAll}
                      />
                    </label>
                  </th>
                  <th>Ticket No</th>
                  <th>Company Name</th>
                  <th>Contact</th>
                  <th>Type</th>
                  <th>Vendor Group</th>
                  <th>Company Code</th>
                  <th>Payment Terms</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(v => (
                  <tr
                    key={v.id}
                    className={`sap-vendor-row${selected.has(v.id) ? ' sap-vendor-row--selected' : ''}`}
                    onClick={() => toggleOne(v.id)}
                  >
                    <td onClick={e => e.stopPropagation()}>
                      <label className="sap-checkbox-label">
                        <input
                          type="checkbox"
                          className="sap-checkbox"
                          checked={selected.has(v.id)}
                          onChange={() => toggleOne(v.id)}
                        />
                      </label>
                    </td>
                    <td><span className="mono-id">{v.ticket_number}</span></td>
                    <td><strong>{v.company_name}</strong><br/><span style={{fontSize:11,color:'var(--text-muted)'}}>{v.email}</span></td>
                    <td>{v.first_name} {v.last_name}<br/><span style={{fontSize:11,color:'var(--text-muted)'}}>{v.contact_phone}</span></td>
                    <td><StatusBadge status={v.vendor_type} /></td>
                    <td><span className="mono-id">{v.vendor_group || '—'}</span></td>
                    <td><span className="mono-id">{v.company_code || '—'}</span></td>
                    <td>{v.payment_terms || '—'}</td>
                    <td><StatusBadge status={v.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Bottom Export Bar ── */}
      {vendors.length > 0 && (
        <div className="sap-export-footer">
          <span>
            {selected.size === 0
              ? 'Select vendors above to enable export'
              : `${selected.size} of ${vendors.length} vendor${vendors.length !== 1 ? 's' : ''} selected`
            }
          </span>
          <button
            className="btn btn-primary"
            onClick={handleExport}
            disabled={selected.size === 0 || exporting}
          >
            {exporting ? '⏳ Exporting…' : `📤 Export ${selected.size || 0} Selected (SAP Format)`}
          </button>
        </div>
      )}

      {/* ── Template Info ── */}
      <div className="page-card" style={{ marginTop:16 }}>
        <div className="page-card__head"><p className="page-card__title">📋 SAP Export Column Mapping</p></div>
        <div className="page-card__body">
          <div className="sap-column-map-grid">
            {[
              ['Ticket Number', 'ticket_number'], ['Name 1 (Company)', 'company_name'], ['First Name', 'first_name'], ['Last Name', 'last_name'],
              ['Email', 'email'], ['Phone', 'contact_phone'], ['Vendor Type', 'vendor_type'], ['Company Code', 'company_code'],
              ['Reconciliation Account', 'reconciliation_account'], ['Vendor Group', 'vendor_group'], ['Tax Type', 'tax_type'],
              ['Tax Code', 'tax_code'], ['Payment Terms', 'payment_terms'], ['Payment Method', 'payment_method'],
              ['PAN', 'pan'], ['GST', 'gst'], ['City', 'city'], ['Country', 'country'], ['Bank Name', 'bank_name'], ['IFSC', 'ifsc'],
            ].map(([header, field]) => (
              <div key={field} className="sap-col-row">
                <span className="sap-col-header">{header}</span>
                <span className="sap-col-arrow">→</span>
                <code className="sap-col-field">{field}</code>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Import Vendor ─────────────────────────────────────────────────────────────
const MOCK_RESULT = [
  {id:'VREG-2026-00011',name:'SolarTech Pvt Ltd',code:'V-10007',ok:true},
  {id:'VREG-2026-00014',name:'MH State Govt',    code:'V-10008',ok:true},
  {id:'VREG-2026-00099',name:'Unknown',           code:'-',      ok:false,err:'Ticket not found'},
]

export function ImportVendor() {
  const [result, setResult]   = useState<typeof MOCK_RESULT | null>(null)
  const [loading, setLoading] = useState(false)

  const handleImport = async () => {
    setLoading(true)
    await new Promise(r => setTimeout(r, 1200))
    setResult(MOCK_RESULT)
    setLoading(false)
  }

  const downloadTemplate = () => {
    const csv = 'TicketNumber,VendorCode\nVREG-2026-00011,V-10007\nVREG-2026-00014,V-10008\n'
    const a = document.createElement('a'); a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download='vendor_import_template.csv'; a.click()
  }

  return (
    <div>
      <div className="page-title-bar"><div><h2>Import Vendor Data</h2><p>Upload CSV mapping ticket numbers to SAP vendor codes</p></div></div>
      <div className="export-grid">
        <div className="page-card">
          <div className="page-card__head"><p className="page-card__title">Upload Mapping File</p></div>
          <div className="page-card__body" style={{display:'flex',flexDirection:'column',gap:14}}>
            <FileUpload label="Select CSV or Excel File" accept=".csv,.xlsx,.xls" required />
            <button className="btn btn-primary w-full" onClick={handleImport} disabled={loading}>{loading?'Processing…':'📤 Start Import'}</button>
            <button className="btn btn-secondary w-full" onClick={downloadTemplate}>📋 Download Template</button>
            <div className="import-format-box">
              <p><strong>Required columns:</strong></p>
              <p><code>TicketNumber</code> — e.g. VREG-2026-00011</p>
              <p><code>VendorCode</code> — e.g. V-10007</p>
            </div>
          </div>
        </div>
        <div>
          {result ? (
            <div className="page-card">
              <div className="page-card__head"><p className="page-card__title">Import Results</p></div>
              <div className="page-card__body">
                <div className="grid-2 mb-4" style={{marginBottom:16}}>
                  <div className="result-box result-box--ok"><p>{result.filter(r=>r.ok).length}</p><small>Successful</small></div>
                  <div className="result-box result-box--err"><p>{result.filter(r=>!r.ok).length}</p><small>Failed</small></div>
                </div>
                {result.map((r,i)=>(
                  <div key={i} className={`import-row${r.ok?' import-row--ok':' import-row--err'}`}>
                    <span>{r.ok?'✅':'❌'}</span>
                    <div><p className="import-row-id">{r.id}</p><p className="import-row-meta">{r.name}{r.ok?` → ${r.code}`:` — ${r.err}`}</p></div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="page-card">
              <div className="page-card__head"><p className="page-card__title">Import History</p></div>
              <div className="page-card__body">
                {[{date:'2026-01-28',file:'vendor_codes_jan.csv',records:3,status:'Completed'},{date:'2026-01-15',file:'import_batch_1.csv',records:5,status:'Completed'}].map((h,i)=>(
                  <div key={i} className="import-history-row">
                    <div><p style={{fontSize:12,fontWeight:600}}>{h.file}</p><p style={{fontSize:11,color:'var(--text-muted)'}}>{h.date} · {h.records} records</p></div>
                    <StatusBadge status={h.status} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
