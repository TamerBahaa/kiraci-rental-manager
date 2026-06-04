import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Building2, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Login() {
  const { user, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/" replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await signIn(email, password)
    if (error) toast.error('Invalid email or password')
    else toast.success('Welcome!')
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 60%,#0f172a 100%)' }}>
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-14">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
              <Building2 size={20} className="text-white" />
            </div>
            <span className="font-display text-white text-2xl font-semibold">Kiracı</span>
          </div>
          <h1 className="font-display text-5xl font-bold text-white leading-tight mb-5">
            Your Rentals.<br /><span className="text-brand-400">Under Control.</span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-sm">
            Track units, owners, tenants, contracts and payments — all in one place. Built for Istanbul property managers.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 relative z-10">
          {[{ v: '25', l: 'Units Tracked' }, { v: '11', l: 'Owners' }, { v: 'Auto', l: 'Overdue Alerts' }].map(s => (
            <div key={s.l} className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-white text-2xl font-bold">{s.v}</p>
              <p className="text-slate-400 text-xs mt-1">{s.l}</p>
            </div>
          ))}
        </div>
        <div className="absolute top-1/4 -right-16 w-96 h-96 rounded-full border border-white/5"></div>
        <div className="absolute top-1/3 right-8 w-64 h-64 rounded-full border border-brand-600/15"></div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl p-8 shadow-2xl">
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-5 lg:hidden">
                <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
                  <Building2 size={15} className="text-white" />
                </div>
                <span className="font-display text-slate-800 text-xl font-semibold">Kiracı</span>
              </div>
              <h2 className="font-display text-2xl font-bold text-slate-800">Sign in</h2>
              <p className="text-slate-500 text-sm mt-1">Property Manager Portal</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Email</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="email" className="input pl-9" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email" />
                </div>
              </div>
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type={showPw ? 'text' : 'password'} className="input pl-9 pr-10" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required autoComplete="current-password" />
                  <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 mt-2">
                {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in…</> : 'Sign In'}
              </button>
            </form>
            <p className="text-center text-xs text-slate-400 mt-5">Contact your admin to reset password</p>
          </div>
        </div>
      </div>
    </div>
  )
}
