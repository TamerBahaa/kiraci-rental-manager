import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getDashboard, getMonthlyChart, seedData } from '../services/api'
import { fmtCurrency, fmt, daysOverdue } from '../utils/helpers'
import { Link } from 'react-router-dom'
import { Building2, TrendingUp, AlertTriangle, CheckCircle2, ArrowRight, Database, RefreshCw } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [chart, setChart] = useState([])
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [noData, setNoData] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [s, c] = await Promise.all([getDashboard(user.id), getMonthlyChart(user.id)])
      setStats(s)
      setChart(c)
      setNoData(s.totalUnits === 0)
    } catch (e) { toast.error('Failed to load') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleSeed = async () => {
    setSeeding(true)
    try {
      await seedData(user.id)
      toast.success('✅ All 25 units and client data imported successfully!')
      load()
    } catch (e) {
      console.error(e)
      toast.error('Import failed — data may already exist')
    }
    setSeeding(false)
  }

  if (loading) return <Spinner />

  const pieData = [
    { name: 'Rented', value: stats?.rentedUnits || 0, color: '#3b82f6' },
    { name: 'Vacant', value: stats?.vacantUnits || 0, color: '#10b981' },
    { name: 'Maintenance', value: stats?.maintenanceUnits || 0, color: '#f59e0b' },
  ].filter(d => d.value > 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-400 text-sm">{format(new Date(), 'EEEE, dd MMMM yyyy')}</p>
        </div>
        <button onClick={load} className="btn-secondary"><RefreshCw size={14} /> Refresh</button>
      </div>

      {/* IMPORT BANNER — shown on first use */}
      {noData && (
        <div className="bg-gradient-to-r from-brand-600 to-brand-700 rounded-2xl p-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Database size={20} />
                <h3 className="font-semibold text-lg">First time? Import your rental data</h3>
              </div>
              <p className="text-brand-100 text-sm max-w-lg">
                Your client's 25 units, 11 owners, 21 tenants and all contracts are ready to import with one click — exactly as provided in the Excel sheet.
              </p>
            </div>
            <button onClick={handleSeed} disabled={seeding}
              className="ml-4 flex-shrink-0 bg-white text-brand-600 hover:bg-brand-50 font-semibold px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 text-sm shadow-md">
              {seeding ? <><div className="w-4 h-4 border-2 border-brand-300 border-t-brand-600 rounded-full animate-spin" /> Importing…</> : <><Database size={15} /> Import All Data</>}
            </button>
          </div>
        </div>
      )}

      {/* Overdue Alert */}
      {(stats?.overdueCount || 0) > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle size={17} className="text-red-600" />
            </div>
            <div>
              <p className="font-semibold text-red-800 text-sm">
                {stats.overdueCount} overdue payment{stats.overdueCount > 1 ? 's' : ''} need attention
              </p>
              <p className="text-red-500 text-xs">Tenants have not paid on time</p>
            </div>
          </div>
          <Link to="/payments?status=overdue" className="btn-danger text-xs px-3 py-1.5">
            View <ArrowRight size={12} />
          </Link>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Building2 size={18} className="text-brand-600" />} bg="bg-brand-50"
          label="Total Units" value={stats?.totalUnits ?? 0} sub={`${stats?.occupancyRate ?? 0}% occupancy`} />
        <StatCard icon={<CheckCircle2 size={18} className="text-emerald-600" />} bg="bg-emerald-50"
          label="Rented" value={stats?.rentedUnits ?? 0} sub={`${stats?.vacantUnits ?? 0} vacant`} />
        <StatCard icon={<TrendingUp size={18} className="text-blue-600" />} bg="bg-blue-50"
          label="This Month" value={fmtCurrency(stats?.monthCollected)}
          sub={`of ${fmtCurrency(stats?.monthExpected)} expected`} />
        <StatCard icon={<AlertTriangle size={18} className="text-red-500" />} bg="bg-red-50"
          label="Overdue" value={stats?.overdueCount ?? 0} sub="payments delayed" valueClass="text-red-600" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card p-5 col-span-2">
          <h3 className="font-semibold text-slate-700 text-sm mb-4">6-Month Revenue (₺)</h3>
          <ResponsiveContainer width="100%" height={195}>
            <AreaChart data={chart}>
              <defs>
                <linearGradient id="ge" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#cbd5e1" stopOpacity={0.4}/><stop offset="95%" stopColor="#cbd5e1" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef651a" stopOpacity={0.3}/><stop offset="95%" stopColor="#ef651a" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `₺${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v, n) => [fmtCurrency(v), n === 'collected' ? 'Collected' : 'Expected']} />
              <Area type="monotone" dataKey="expected" stroke="#cbd5e1" strokeWidth={2} fill="url(#ge)" />
              <Area type="monotone" dataKey="collected" stroke="#ef651a" strokeWidth={2} fill="url(#gc)" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-slate-300 rounded"></div><span className="text-xs text-slate-400">Expected</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-brand-600 rounded"></div><span className="text-xs text-slate-400">Collected</span></div>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-slate-700 text-sm mb-3">Unit Status</h3>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={155}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [`${v} units`, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-1">
                {pieData.map(d => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }}></div><span className="text-xs text-slate-500">{d.name}</span></div>
                    <span className="text-xs font-semibold text-slate-700">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-slate-300">
              <Building2 size={32} className="mb-2" />
              <p className="text-xs">No units yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Overdue List */}
      {stats?.overdueList?.length > 0 && (
        <div className="card">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-700 text-sm flex items-center gap-2">
              <AlertTriangle size={14} className="text-red-500" /> Delayed Transfers
            </h3>
            <Link to="/payments?status=overdue" className="text-xs text-brand-600 font-medium flex items-center gap-1">
              All <ArrowRight size={11} />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {stats.overdueList.slice(0, 8).map((p, i) => (
              <div key={i} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle size={12} className="text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      Unit {p.contracts?.units?.unit_number}
                      {p.contracts?.units?.building ? ` · Block ${p.contracts.units.building}` : ''}
                    </p>
                    <p className="text-xs text-slate-400">{p.contracts?.tenants?.name || '—'} · Due {fmt(p.due_date)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-red-600">{fmtCurrency(p.amount, p.currency)}</p>
                  <p className="text-xs text-slate-400">{daysOverdue(p.due_date)}d late</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { to: '/units', label: 'Add Unit', icon: Building2 },
          { to: '/tenants', label: 'New Tenant', icon: CheckCircle2 },
          { to: '/contracts', label: 'New Contract', icon: TrendingUp },
          { to: '/payments', label: 'Record Payment', icon: ArrowRight },
        ].map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className="card p-4 flex items-center gap-3 hover:shadow-md transition-all group">
            <div className="w-8 h-8 rounded-lg bg-brand-50 group-hover:bg-brand-100 flex items-center justify-center transition-colors">
              <Icon size={14} className="text-brand-600" />
            </div>
            <span className="text-sm font-medium text-slate-600">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

function StatCard({ icon, bg, label, value, sub, valueClass = 'text-slate-800' }) {
  return (
    <div className="card p-5">
      <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>{icon}</div>
      <p className={`text-2xl font-bold ${valueClass}`}>{value}</p>
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  )
}

function Spinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-7 h-7 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
