import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import { Layout, ProtectedRoute } from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Units from './pages/Units'
import Owners from './pages/Owners'
import Tenants from './pages/Tenants'
import Contracts from './pages/Contracts'
import Payments from './pages/Payments'
import Reports from './pages/Reports'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3000, style: { fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '13px' } }} />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/units" element={<Units />} />
                  <Route path="/owners" element={<Owners />} />
                  <Route path="/tenants" element={<Tenants />} />
                  <Route path="/contracts" element={<Contracts />} />
                  <Route path="/payments" element={<Payments />} />
                  <Route path="/reports" element={<Reports />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
export default App
