import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import OtpInput from '../../components/OtpInput/OtpInput'
import FormField from '../../components/FormField/FormField'
import './LoginPage.css'

const HOME: Record<string, string> = {
  vendor: '/vendor/dashboard', employee: '/employee/dashboard',
  admin: '/admin/dashboard', sap: '/sap/dashboard',
}

// ── Vendor OTP Login ────────────────────────────────────────────
function VendorLogin() {
  const { loginWithOtp } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const startCountdown = () => {
    setCountdown(30)
    const iv = setInterval(() => setCountdown(c => { if (c <= 1) { clearInterval(iv); return 0 } return c - 1 }), 1000)
  }

  const sendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault(); setError('')
    if (!email || !email.includes('@')) { setError('Enter a valid email address.'); return }
    setLoading(true)
    await new Promise(r => setTimeout(r, 700))
    setStep('otp'); setLoading(false); startCountdown()
  }

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    if (otp.replace(/\s/g, '').length < 6) { setError('Please enter all 6 OTP digits.'); return }
    setLoading(true)
    try {
      const user = await loginWithOtp(email)
      navigate(HOME[user.role])
    } catch (err: any) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="login-panel">
      <div className="login-panel__header login-panel__header--vendor">
        <span className="login-panel__header-icon">🏪</span>
        <div>
          <h3>Vendor Login</h3>
          <p>Login with your registered email via OTP</p>
        </div>
      </div>

      {step === 'email' ? (
        <form onSubmit={sendOtp} className="login-form">
          <FormField id="v-email" label="Email Address" type="email" value={email}
            onChange={e => { setEmail(e.target.value); setError('') }}
            placeholder="vendor@yourcompany.com" required />
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? 'Sending OTP…' : 'Send OTP →'}
          </button>
          <p className="login-demo-hint">Demo: use any email address</p>
        </form>
      ) : (
        <form onSubmit={verifyOtp} className="login-form">
          <div className="login-email-chip">
            📧 {email}
            <button type="button" onClick={() => { setStep('email'); setOtp(''); setError('') }}>Change</button>
          </div>
          <p className="login-otp-label">Enter 6-digit OTP</p>
          <OtpInput value={otp} onChange={setOtp} />
          <p className="login-demo-hint">Demo: enter any 6 digits (e.g. 123456)</p>
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? 'Verifying…' : 'Verify & Login'}
          </button>
          <div className="login-resend">
            {countdown > 0 ? <span>Resend in {countdown}s</span>
              : <button type="button" className="login-resend-btn" onClick={sendOtp}>🔄 Resend OTP</button>}
          </div>
        </form>
      )}
    </div>
  )
}

// ── Employee / Admin / SAP Login ────────────────────────────────
function EmployeeLogin() {
  const { login, loginWithSso } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    if (!email || !password) { setError('Email and password are required.'); return }
    setLoading(true)
    try {
      const user = await login(email, password)
      navigate(HOME[user.role])
    } catch (err: any) { setError(err.message) }
    finally { setLoading(false) }
  }

  const handleSso = async () => {
    setLoading(true)
    try {
      const user = await loginWithSso()
      navigate(HOME[user.role])
    } catch { setError('SSO unavailable. Use email/password.') }
    finally { setLoading(false) }
  }

  return (
    <div className="login-panel">
      <div className="login-panel__header login-panel__header--employee">
        <span className="login-panel__header-icon">🏢</span>
        <div>
          <h3>Employee / Admin Login</h3>
          <p>Sign in with your Hinduja enterprise account</p>
        </div>
      </div>

      <form onSubmit={handleLogin} className="login-form">
        <FormField id="e-email" label="Hinduja Email" type="email" value={email}
          onChange={e => { setEmail(e.target.value); setError('') }}
          placeholder="you@hindujarenewables.com" required />

        <div className="login-pw-wrap">
          <FormField id="e-pw" label="Password" type={showPw ? 'text' : 'password'} value={password}
            onChange={e => { setPassword(e.target.value); setError('') }}
            placeholder="Enter your password" required />
          <button type="button" className="login-pw-toggle" onClick={() => setShowPw(p => !p)}>
            {showPw ? '🙈' : '👁️'}
          </button>
        </div>

        <div className="login-demo-box">
          <p>🔑 <strong>Demo credentials</strong></p>
          <p>Employee: employee@demo.com / 123456</p>
          <p>Admin &nbsp;&nbsp;: admin@demo.com / 123456</p>
          <p>SAP &nbsp;&nbsp;&nbsp;&nbsp;: sap@demo.com / 123456</p>
        </div>

        {error && <p className="login-error">{error}</p>}

        <div className="login-btn-row">
          <button type="submit" className="btn btn-primary flex-1" disabled={loading}>
            {loading ? 'Signing in…' : '🔐 Login'}
          </button>
        </div>
      </form>

      <div className="login-divider"><span>or</span></div>

      <button className="btn btn-secondary w-full login-sso-btn" onClick={handleSso} disabled={loading}>
        <svg width="16" height="16" viewBox="0 0 21 21">
          <path d="M1 1h9v9H1z" fill="#f25022"/>
          <path d="M11 1h9v9h-9z" fill="#7fba00"/>
          <path d="M1 11h9v9H1z" fill="#00a4ef"/>
          <path d="M11 11h9v9h-9z" fill="#ffb900"/>
        </svg>
        Sign in with Microsoft SSO
      </button>
    </div>
  )
}

// ── Main Login Page ─────────────────────────────────────────────
export default function LoginPage() {
  return (
    <div className="login-page">
      <div className="login-page__bg" />
      <div className="login-page__inner">
        {/* Two panels side-by-side */}
        <div className="login-panels">
          <div className="login-panels__header">
            <img className="login-brand__logo-img" src="/companylogo.svg" alt="Company logo" />
            <h1 className="login-panels__title">Vendor Portal</h1>
          </div>
          <div className="login-panels__content">
            <VendorLogin />
            <div className="login-panels__divider"><span>OR</span></div>
            <EmployeeLogin />
          </div>
        </div>

        <p className="login-footer">© {new Date().getFullYear()} Hinduja Renewables Energy Pvt. Ltd. — Confidential Internal System</p>
      </div>
    </div>
  )
}
