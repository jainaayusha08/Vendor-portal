import { AuthProvider } from './context/AuthContext'
import AppRoutes from './routes/AppRoutes'

/**
 * Vendor Registration Portal – Hinduja Renewables
 * Root Application Component
 * Tech Stack: Vite + React 18 + TypeScript + Vanilla CSS (Archive_2 pattern)
 */
function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
