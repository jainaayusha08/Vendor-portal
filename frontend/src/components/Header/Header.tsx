import './Header.css'

interface Props { title: string }

export default function Header({ title }: Props) {
  return (
    <header className="app-header">
      <div className="app-header__left">
        <h1 className="app-header__title">Vending portal</h1>
      </div>
      <div className="app-header__right" aria-label={title}>
        <span className="app-header__date">
          {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      </div>
    </header>
  )
}
