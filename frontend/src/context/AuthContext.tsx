import { createContext, useContext, useState, ReactNode } from 'react'
import { api } from '../utils/api'

export interface User {
  id: string | number
  email: string
  role: 'vendor' | 'employee' | 'admin' | 'sap' | 'finance_controller' | 'sap_user' | 'super_admin'
  name?: string
  full_name?: string
  department?: string
  company?: string
  phone?: string
}

interface AuthCtx {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<User>
  loginWithOtp: (email: string, otp: string) => Promise<User>
  logout: () => void
  updateUser: (updates: Partial<User>) => void
}

const AuthContext = createContext<AuthCtx | null>(null)
const SESSION_KEY = 'vrp.session'

const readSession = (): User | null => {
  try {
    const s = localStorage.getItem(SESSION_KEY)
    return s ? JSON.parse(s).user : null
  } catch { return null }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(readSession)

  const persist = (u: User | null, token?: string) => {
    if (u) {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ user: u, token }))
    } else {
      localStorage.removeItem(SESSION_KEY)
    }
    setUser(u)
  }

  const login = async (email: string, password: string): Promise<User> => {
    const res = await api.post<{ access: string, role: string, user: any }>('/auth/login/', { email, password })
    const u: User = { 
      ...res.user, 
      name: res.user.full_name, // Map for compatibility
      role: res.role as any 
    }
    persist(u, res.access)
    return u
  }

  const loginWithOtp = async (email: string, otp: string): Promise<User> => {
    const res = await api.post<{ access: string, user?: any }>('/auth/vendor/verify-otp/', { email, otp })
    const u: User = res.user ? { ...res.user, name: res.user.full_name, role: 'vendor' } : { id: 'vendor', email, role: 'vendor', name: 'Vendor' }
    persist(u, res.access)
    return u
  }

  const logout = () => persist(null)

  const updateUser = (updates: Partial<User>) => {
    if (!user) return
    persist({ ...user, ...updates }, JSON.parse(localStorage.getItem(SESSION_KEY) || '{}').token)
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, loginWithOtp, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
