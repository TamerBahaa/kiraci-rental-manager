import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Building2, Home, Users, FileText, CreditCard, BarChart3, LogOut } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/units', label: 'Units', icon: Building2 },
  { to: '/owners', label: 'Owners', icon: Home },
  { to: '/tenants', label: 'Tenants', icon: Users },
  { to: '/contracts', label: 'Contracts', icon: FileText },
  { to: '/payments', label: 'Payments', icon: CreditCard },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
]

export default function Sidebar() {
  const { signOut, user } = useAuth()
  return (
    <aside className="w-56 bg-slate-900 min-h-screen flex flex-col fixed left-0 top-0 bottom-0 z-30">
      <div className="px-5 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center flex-shrink-0">
            <Building2 size={15} className="text-white" />
          </div>
          <div>
            <p className="font-display text-white font-semibold text-base leading-none">Kiracı</p>
            <p className="text-slate-500 text-[9px] tracking-widest uppercase mt-0.5">Property Manager</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-2.5 py-3 space-y-0.5">
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}>
            <Icon size={15} />{label}
          </NavLink>
        ))}
      </nav>

      <div className="px-2.5 pb-4 border-t border-slate-800 pt-3">
        <p className="px-3 text-slate-600 text-xs truncate mb-1">{user?.email}</p>
        <button onClick={async () => { await signOut(); toast.success('Signed out') }}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
          <LogOut size={15} /> Sign Out
        </button>
      </div>
    </aside>
  )
}
