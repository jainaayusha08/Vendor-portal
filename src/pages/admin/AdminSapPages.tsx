import { useState } from 'react'
import StatCard from '../../components/StatCard/StatCard'
import DataTable, { Column } from '../../components/DataTable/DataTable'
import StatusBadge from '../../components/StatusBadge/StatusBadge'
import FormField from '../../components/FormField/FormField'
import FileUpload from '../../components/FileUpload/FileUpload'
import { MOCK_VENDOR_REQUESTS, MOCK_ALL_VENDORS, MOCK_SAP_VENDORS, VendorRequest, VendorRecord, SapRecord } from '../../utils/mockData'
import './AdminSapPages.css'

// ═══════════════════════════════ ADMIN PAGES ══════════════════════════════════

// ── Admin Dashboard ───────────────────────────────────────────────────────────
const BAR = [12,18,9,22,15,28,20,14]
const LABELS = ['Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr']
const MAX = Math.max(...BAR)

export function AdminDashboard() {
  const pending  = MOCK_VENDOR_REQUESTS.filter(r=>r.status==='Pending Approval').length
  const approved = MOCK_VENDOR_REQUESTS.filter(r=>r.status==='Approved').length
  const rejected = MOCK_VENDOR_REQUESTS.filter(r=>r.status==='Rejected').length

  return (
    <div>
      <div className="page-title-bar">
        <div><h2>Admin Dashboard</h2><p>System-wide overview of vendor registration activity</p></div>
        <div className="admin-live-badge">🟢 Live</div>
      </div>
      <div className="grid-4 mb-8">
        <StatCard label="Total Vendors"    value={MOCK_ALL_VENDORS.length} icon="🏢" color="blue"   delta="Registered vendors" />
        <StatCard label="Pending Requests" value={pending}                 icon="⏳" color="amber"  delta="Awaiting action" />
        <StatCard label="Approved"         value={approved}                icon="✅" color="green"  delta="This month" />
        <StatCard label="Rejected"         value={rejected}                icon="❌" color="rose"   delta="This month" />
      </div>
      <div className="admin-dash-grid">
        <div className="page-card">
          <div className="page-card__head"><p className="page-card__title">Recent Requests</p></div>
          <div className="page-card__body">
            {MOCK_VENDOR_REQUESTS.slice(0,5).map(r => (
              <div key={r.id} className="admin-req-row">
                <div><p className="req-vendor">{r.vendorName}</p><p className="req-meta">{r.id} · {r.vendorType} · {r.submittedDate}</p></div>
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
              {[
                {label:'Pending Approval',count:pending, color:'#1a56db'},
                {label:'Approved',        count:approved,color:'#0e9f6e'},
                {label:'Rejected',        count:rejected,color:'#dc2626'},
                {label:'Returned',        count:1,       color:'#d97706'},
              ].map(({label,count,color})=>(
                <div key={label} className="progress-row">
                  <div className="progress-meta"><span>{label}</span><strong>{count}</strong></div>
                  <div className="progress-track"><div className="progress-fill" style={{ width:`${(count/MOCK_VENDOR_REQUESTS.length)*100}%`, background:color }} /></div>
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
  const [requests, setRequests] = useState(MOCK_VENDOR_REQUESTS)
  const [search, setSearch]     = useState('')
  const [filter, setFilter]     = useState('All')
  const [modal, setModal]       = useState<VendorRequest|null>(null)

  const statuses = ['All','Pending Approval','Approved','Returned','Rejected']
  const rows = requests.filter(r=>{
    const ms = filter==='All'||r.status===filter
    const ss = r.vendorName.toLowerCase().includes(search.toLowerCase())||r.id.toLowerCase().includes(search.toLowerCase())
    return ms && ss
  })

  const act = (id:string, action:'approve'|'reject') => {
    setRequests(prev => prev.map(r => r.id===id ? {...r, status:action==='approve'?'Approved':'Rejected'} : r))
    setModal(null)
  }

  const cols: Column<VendorRequest>[] = [
    { key:'id',            label:'Request ID',      render:v=><span className="mono-id">{String(v)}</span> },
    { key:'vendorName',    label:'Vendor Name' },
    { key:'vendorType',    label:'Vendor Type' },
    { key:'submittedDate', label:'Submitted Date' },
    { key:'status',        label:'Status',          render:v=><StatusBadge status={String(v)} /> },
    { key:'id',            label:'Actions',         render:(_,row)=>(
      <div style={{display:'flex',gap:6}}>
        <button className="btn btn-secondary btn-sm btn-icon" onClick={()=>setModal(row as VendorRequest)} title="View">👁️</button>
        {(row as VendorRequest).status==='Pending Approval' && <>
          <button className="btn btn-success btn-sm" onClick={()=>act((row as VendorRequest).id,'approve')}>✅</button>
          <button className="btn btn-danger btn-sm"  onClick={()=>act((row as VendorRequest).id,'reject')}>❌</button>
        </>}
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
            <div className="modal-head"><h3>{modal.vendorName}</h3><button onClick={()=>setModal(null)}>✕</button></div>
            <div className="modal-body">
              {[['Request ID',modal.id],['Vendor Type',modal.vendorType],['Submitted',modal.submittedDate],['Status',<StatusBadge key="s" status={modal.status}/>]].map(([k,v])=>(
                <div key={String(k)} className="modal-row"><span>{k}</span><strong>{v as any}</strong></div>
              ))}
              <div className="modal-docs">📄 Documents: PAN Card, GST Certificate, Bank Cheque, CoI</div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={()=>setModal(null)}>Close</button>
              {modal.status==='Pending Approval' && <>
                <button className="btn btn-success" onClick={()=>act(modal.id,'approve')}>✅ Approve</button>
                <button className="btn btn-danger"  onClick={()=>act(modal.id,'reject')}>❌ Reject</button>
              </>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── All Vendors ───────────────────────────────────────────────────────────────
export function AdminVendors() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const types = ['All',...new Set(MOCK_ALL_VENDORS.map(v=>v.vendorType))]
  const rows = MOCK_ALL_VENDORS.filter(v=>{
    const mt = filter==='All'||v.vendorType===filter
    const ms = v.vendorName.toLowerCase().includes(search.toLowerCase())||v.vendorCode.toLowerCase().includes(search.toLowerCase())
    return mt && ms
  })
  const cols: Column<VendorRecord>[] = [
    { key:'vendorCode', label:'Vendor Code', render:v=><span className="mono-id">{String(v)}</span> },
    { key:'vendorName', label:'Vendor Name' },
    { key:'vendorType', label:'Vendor Type' },
    { key:'company',    label:'Company Name' },
    { key:'status',     label:'Status', render:v=><StatusBadge status={String(v)} /> },
  ]
  const exportCsv = () => {
    const csv = [['Vendor Code','Vendor Name','Vendor Type','Company','Status'],...rows.map(v=>[v.vendorCode,v.vendorName,v.vendorType,v.company,v.status])].map(r=>r.join(',')).join('\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download='vendors.csv'; a.click()
  }
  return (
    <div>
      <div className="page-title-bar"><div><h2>All Vendors</h2><p>Complete registry of registered vendors</p></div><button className="btn btn-secondary" onClick={exportCsv}>📥 Export CSV</button></div>
      <div className="filter-row">{types.map(t=><button key={t} className={`filter-pill${filter===t?' filter-pill--active':''}`} onClick={()=>setFilter(t)}>{t} ({t==='All'?MOCK_ALL_VENDORS.length:MOCK_ALL_VENDORS.filter(v=>v.vendorType===t).length})</button>)}</div>
      <div className="page-card">
        <div className="page-card__head">
          <p className="page-card__title">{rows.length} Vendor{rows.length!==1?'s':''}</p>
          <input className="search-input" placeholder="Search vendors…" value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <div className="page-card__body"><DataTable columns={cols} rows={rows} rowKey="vendorCode" /></div>
      </div>
    </div>
  )
}

// ── Workflow Config ────────────────────────────────────────────────────────────
const DEFAULT_LEVELS = [
  { id:1, role:'HREPL Employee', department:'Procurement',     tat:'2', active:true, label:'Level 1 – Initial Verification' },
  { id:2, role:'Finance / Payables', department:'Finance',     tat:'3', active:true, label:'Level 2 – Finance Review' },
  { id:3, role:'Finance Controller', department:'Finance',     tat:'1', active:true, label:'Level 3 – Final Approval' },
  { id:4, role:'SAP User',           department:'IT / SAP',    tat:'2', active:true, label:'Level 4 – SAP Processing' },
]

export function AdminWorkflow() {
  const [levels, setLevels] = useState(DEFAULT_LEVELS)
  const [saved, setSaved]   = useState(false)
  const upd = (id:number, k:string, v:unknown) => setLevels(p=>p.map(l=>l.id===id?{...l,[k]:v}:l))
  const save = () => { setSaved(true); setTimeout(()=>setSaved(false),3000) }

  return (
    <div>
      <div className="page-title-bar">
        <div><h2>Workflow Configuration</h2><p>Configure multi-level approval workflow for vendor registrations</p></div>
        <button className="btn btn-primary" onClick={save}>{saved ? '✅ Saved!' : '💾 Save Configuration'}</button>
      </div>

      <div className="page-card mb-8">
        <div className="page-card__head"><p className="page-card__title">Approval Flow Diagram</p></div>
        <div className="page-card__body wf-flow">
          {levels.filter(l=>l.active).map((l,i,a)=>(
            <div key={l.id} style={{display:'flex',alignItems:'center',gap:8}}>
              <div className="wf-node">
                <p className="wf-node-level">Level {l.id}</p>
                <p className="wf-node-role">{l.role}</p>
                <p className="wf-node-tat">{l.tat}d TAT</p>
              </div>
              {i<a.length-1 && <div className="wf-arrow">→</div>}
            </div>
          ))}
          <div style={{display:'flex',alignItems:'center',gap:8}}><div className="wf-arrow">→</div><div className="wf-node wf-node--end"><p className="wf-node-level">SAP</p><p className="wf-node-role">Vendor Created</p></div></div>
        </div>
      </div>

      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        {levels.map(l=>(
          <div key={l.id} className="page-card">
            <div className="page-card__head">
              <div><p className="page-card__title">{l.label}</p></div>
              <label className="toggle-label">
                <span>Active</span>
                <div className={`toggle${l.active?' toggle--on':''}`} onClick={()=>upd(l.id,'active',!l.active)}>
                  <span className="toggle__knob" />
                </div>
              </label>
            </div>
            <div className="page-card__body">
              <div className="grid-3">
                <FormField id={`r-${l.id}`} label="Approver Role"       value={l.role}       onChange={e=>upd(l.id,'role',e.target.value)}       disabled={!l.active} />
                <FormField id={`d-${l.id}`} label="Department"          value={l.department} onChange={e=>upd(l.id,'department',e.target.value)} disabled={!l.active} />
                <FormField id={`t-${l.id}`} label="Turnaround (days)" type="select" value={l.tat} onChange={e=>upd(l.id,'tat',e.target.value)} disabled={!l.active}
                  options={['1','2','3','5','7'].map(v=>({value:v,label:`${v} day${v!=='1'?'s':''}` }))} />
              </div>
            </div>
          </div>
        ))}
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
        <StatCard label="Total Synced"      value={synced}                    icon="🔄" color="green"  delta="Vendors in SAP" />
        <StatCard label="Ready for Export"  value={ready}                     icon="📤" color="amber"  delta="Pending SAP creation" />
        <StatCard label="Total Records"     value={MOCK_SAP_VENDORS.length}   icon="🗄️" color="blue"   delta="All vendor records" />
        <StatCard label="Last Import"       value="Today"                     icon="📥" color="violet" delta="10:30 AM" />
      </div>
      <div className="sap-dash-grid">
        <div className="page-card">
          <div className="page-card__head"><p className="page-card__title">Vendor Sync Status</p></div>
          <div className="page-card__body">
            <DataTable<SapRecord>
              columns={[
                { key:'ticketId',   label:'Ticket ID',    render:v=><span className="mono-id">{String(v)}</span> },
                { key:'vendorName', label:'Vendor Name' },
                { key:'vendorCode', label:'Vendor Code',  render:v=><span className="mono-id">{String(v)}</span> },
                { key:'exportDate', label:'Export Date' },
                { key:'syncStatus', label:'Status',       render:v=><StatusBadge status={String(v)} /> },
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

// ── Export Vendor ─────────────────────────────────────────────────────────────
export function ExportVendor() {
  const [vendorType, setVendorType] = useState('all')
  const [format, setFormat]         = useState('sap')
  const [exporting, setExporting]   = useState(false)

  const types = [
    {value:'all',label:'All Vendors'},
    {value:'Domestic',label:'Domestic Vendors'},
    {value:'Foreign',label:'Foreign / International Vendors'},
    {value:'Farmer',label:'Farmer Vendors'},
    {value:'Government',label:'Government Vendors'},
  ]
  const preview = vendorType==='all' ? MOCK_ALL_VENDORS : MOCK_ALL_VENDORS.filter(v=>v.vendorType===vendorType)

  const handleExport = async () => {
    setExporting(true)
    await new Promise(r=>setTimeout(r,1000))
    const csv = [['Vendor Code','Vendor Name','Vendor Type','Company','Status'],...preview.map(v=>[v.vendorCode,v.vendorName,v.vendorType,v.company,v.status])].map(r=>r.join(',')).join('\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download=`vendor_export_${vendorType}.csv`; a.click()
    setExporting(false)
  }

  return (
    <div>
      <div className="page-title-bar"><div><h2>Export Vendor Data</h2><p>Select vendor type and format, then export for SAP</p></div><button className="btn btn-primary" onClick={handleExport} disabled={exporting||preview.length===0}>{exporting?'Exporting…':`📤 Export ${preview.length} Records`}</button></div>
      <div className="export-grid">
        <div className="page-card">
          <div className="page-card__head"><p className="page-card__title">Export Configuration</p></div>
          <div className="page-card__body" style={{display:'flex',flexDirection:'column',gap:14}}>
            <FormField id="et" label="Vendor Type" type="select" value={vendorType} onChange={e=>setVendorType(e.target.value)} options={types} />
            <FormField id="ef" label="Export Format" type="select" value={format} onChange={e=>setFormat(e.target.value)}
              options={[{value:'sap',label:'SAP Vendor Creation Format (.xlsx)'},{value:'std',label:'Standard System Template (.csv)'}]} />
            <div className="export-count-box">📊 Records to export: <strong>{preview.length}</strong></div>
            <button className="btn btn-primary w-full" onClick={handleExport} disabled={exporting||preview.length===0}>{exporting?'Generating…':'📥 Export Data'}</button>
          </div>
        </div>
        <div className="page-card">
          <div className="page-card__head"><p className="page-card__title">Export Preview ({preview.length} records)</p></div>
          <div className="page-card__body">
            <DataTable<VendorRecord>
              columns={[
                {key:'vendorCode',label:'Code',    render:v=><span className="mono-id">{String(v)}</span>},
                {key:'vendorName',label:'Name'},
                {key:'vendorType',label:'Type'},
                {key:'status',    label:'Status',  render:v=><StatusBadge status={String(v)} />},
              ]}
              rows={preview} rowKey="vendorCode"
            />
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
  const [result, setResult]   = useState<typeof MOCK_RESULT|null>(null)
  const [loading, setLoading] = useState(false)

  const handleImport = async () => {
    setLoading(true)
    await new Promise(r=>setTimeout(r,1200))
    setResult(MOCK_RESULT)
    setLoading(false)
  }

  const downloadTemplate = () => {
    const csv = 'TicketNumber,VendorCode\nVREG-2026-00011,V-10007\nVREG-2026-00014,V-10008\n'
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download='vendor_import_template.csv'; a.click()
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
