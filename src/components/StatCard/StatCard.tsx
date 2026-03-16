import './StatCard.css'

interface Props {
  label: string
  value: string | number
  icon: string
  color?: 'blue' | 'green' | 'amber' | 'rose' | 'violet' | 'slate'
  delta?: string
}

export default function StatCard({ label, value, icon, color = 'blue', delta }: Props) {
  return (
    <div className={`stat-card stat-card--${color}`}>
      <div className="stat-card__icon">{icon}</div>
      <div className="stat-card__body">
        <p className="stat-card__label">{label}</p>
        <p className="stat-card__value">{value}</p>
        {delta && <p className="stat-card__delta">{delta}</p>}
      </div>
    </div>
  )
}
