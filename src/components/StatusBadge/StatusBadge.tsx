import './StatusBadge.css'

interface Props { status: string }

export default function StatusBadge({ status }: Props) {
  const cls = status.toLowerCase().replace(/\s+/g, '-')
  return <span className={`status-badge status-${cls}`}>{status}</span>
}
