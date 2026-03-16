import { createContext, useContext, useState, ReactNode } from 'react'
import { User, MOCK_USERS, UserRole } from '../utils/mockData'

interface AuthCtx {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<User>
  loginWithOtp: (email: string) => Promise<User>
  loginWithSso: () => Promise<User>
  logout: () => void
  updateUser: (updates: Partial<User>) => void
}

const AuthContext = createContext<AuthCtx | null>(null)

const SESSION_KEY = 'vrp.session'

const readSession = (): User | null => {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null') }
  catch { return null }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(readSession)

  const persist = (u: User | null) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(u))
    setUser(u)
  }

  const login = async (email: string, password: string): Promise<User> => {
    const found = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password)
    if (!found) throw new Error('Invalid email or password.')
    const { password: _, ...safe } = found
    persist(safe as User)
    return safe as User
  }

  const loginWithOtp = async (email: string): Promise<User> => {
    const found = MOCK_USERS.find(u => u.role === 'vendor') || MOCK_USERS[0]
    const { password: _, ...safe } = found
    const u = { ...safe, email } as User
    persist(u)
    return u
  }

  const loginWithSso = async (): Promise<User> => {
    const emp = MOCK_USERS.find(u => u.role === 'employee')!
    const { password: _, ...safe } = emp
    persist(safe as User)
    return safe as User
  }

  const logout = () => persist(null)

  const updateUser = (updates: Partial<User>) => {
    if (!user) return
    persist({ ...user, ...updates })
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, loginWithOtp, loginWithSso, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
