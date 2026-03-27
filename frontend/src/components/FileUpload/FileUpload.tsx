import { useState, DragEvent } from 'react'
import './FileUpload.css'

interface Props {
  label?: string
  accept?: string
  maxSizeMB?: number
  required?: boolean
  onChange?: (file: File | null) => void
}

export default function FileUpload({ label, accept = '.pdf,.png,.jpg,.jpeg', maxSizeMB = 40, required, onChange }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)

  const process = (f: File | null) => {
    if (!f) return
    if (f.size > maxSizeMB * 1024 * 1024) {
      setError(`File too large. Max ${maxSizeMB}MB allowed.`)
      return
    }
    setError('')
    setFile(f)
    onChange?.(f)
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    process(e.dataTransfer.files[0] || null)
  }

  return (
    <div className="file-upload">
      {label && <p className="file-upload__label">{label}{required && <span className="req"> *</span>}</p>}
      {file ? (
        <div className="file-upload__preview">
          <span className="file-upload__icon">📄</span>
          <span className="file-upload__name">{file.name}</span>
          <button className="file-upload__remove" onClick={() => { setFile(null); onChange?.(null) }}>✕</button>
        </div>
      ) : (
        <label
          className={`file-upload__zone${dragging ? ' file-upload__zone--drag' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <span className="file-upload__zone-icon">☁️</span>
          <p className="file-upload__zone-text">Drag & drop or <span className="link">browse</span></p>
          <p className="file-upload__zone-hint">PDF, PNG, JPG — max {maxSizeMB}MB</p>
          <input type="file" accept={accept} hidden onChange={e => process(e.target.files?.[0] || null)} />
        </label>
      )}
      {error && <p className="file-upload__error">{error}</p>}
    </div>
  )
}
