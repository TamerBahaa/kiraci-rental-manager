import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { fmtCurrency, fmt } from '../utils/helpers'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { TrendingUp, Building2, AlertTriangle, Users } from 'lucide-react'

export default function Reports() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        // Monthly breakdown (last 12 months)
        const monthly = []
        for (let i = 11; i >= 0; i--) {
          const d = subMonths(new Date(), i)
          const from = format(startOfMonth(d), 'yyyy-MM-dd')
          const to = format(endOfMonth(d), 'yyyy-MM-dd')
          const { data: payments } = await supabase.from('payments').select('amount, status').eq('user_id', user.id).gte('due_date', from).lte('due_date', to)
          const p = payments || []
          monthly.push({
            month: format(d, 'MMM yy'),
            Expected: p.reduce((s, x) => s + x.amount, 0),
            Collected: p.filter(x => x.status === 'paid').reduce((s, x) => s + x.amount, 0),
            Overdue: p.filter(x => x.status === 'overdue').reduce((s, x) => s + x.amount, 0),
          })
        }

        // Owner breakdown
        const { data: ownerContracts } = await supabase
          .from('contracts')
          .select('monthly_rent, currency, status, units(owner_id, owners(name))')
          .eq('user_id', user.id).eq('status', 'active')

        const ownerMap = {}
        ;(ownerContracts || []).forEach(c => {
          const name = c.units?.owners?.name || 'Unknown'
          if (!ownerMap[name]) ownerMap[name] = { name, units: 0, monthlyRent: 0 }
          ownerMap[name].units++
          ownerMap[name].monthlyRent += c.monthly_rent || 0
        })

        // Payment rate (last 3 months)
        const { data: recent } = await supabase
          .from('payments').select('amount, status').eq('user_id', user.id)
          .gte('due_date', format(subMonths(new Date(), 3), 'yyyy-MM-dd'))
          .lt('due_date', format(new Date(), 'yyyy-MM-dd'))
        const r = recent || []
        const totalDue = r.reduce((s, p) => s + p.amount, 0)
        const totalPaid = r.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0)
        const collectionRate = totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : 0

        // Overdue payments — all of them
        const { data: overdueList } = await supabase
          .from('payments')
          .select('amount, due_date, contracts(units(unit_number, building, owners(name)), tenants(name))')
          .eq('user_id', user.id).eq('status', 'overdue').order('due_date')

        setData({
          monthly,
          ownerStats: Object.values(ownerMap).sort((a, b) => b.monthlyRent - a.monthlyRent),
          collectionRate,
          totalDue,
          totalPaid,
          overdueList: overdueList || [],
        })
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [user.id])

  if (loading) return <Spin />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-800">Reports</h1>
        <p className="text-slate-400 text-sm">Financial overview and analysis</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI icon={<TrendingUp size={17} className="text-emerald-600" />} bg="bg-emerald-50"
          label="3-Month Collection Rate" value={`${data?.collectionRate ?? 0}%`}
          sub={data?.collectionRate >= 80 ? 'Good performance' : 'Needs attention'} />
        <KPI icon={<TrendingUp size={17} className="text-blue-600" />} bg="bg-blue-50"
          label="3-Month Expected" value={fmtCurrency(data?.totalDue)} sub="last 3 months" />
        <KPI icon={<TrendingUp size={17} className="text-brand-600" />} bg="bg-brand-50"
          label="3-Month Collected" value={fmtCurrency(data?.totalPaid)} sub="confirmed receipts" />
        <KPI icon={<AlertTriangle size={17} className="text-red-500" />} bg="bg-red-50"
          label="Overdue Payments" value={data?.overdueList?.length ?? 0} sub="need follow-up" />
      </div>

      {/* 12-Month Bar Chart */}
      <div className="card p-6">
        <h3 className="font-semibold text-slate-700 mb-4">12-Month Revenue Breakdown</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data?.monthly || []} barSize={16} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `₺${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={(v) => [fmtCurrency(v), '']} />
            <Legend wrapperStyle={{ fontSize: 12, color: '#64748b' }} />
            <Bar dataKey="Expected" fill="#e2e8f0" radius={[3,3,0,0]} />
            <Bar dataKey="Collected" fill="#ef651a" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Owner Summary */}
        <div className="card">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <Building2 size={15} className="text-slate-400" />
            <h3 className="font-semibold text-slate-700 text-sm">Monthly Revenue by Owner</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {(data?.ownerStats || []).map(o => (
              <div key={o.name} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700">{o.name}</p>
                  <p className="text-xs text-slate-400">{o.units} active unit{o.units !== 1 ? 's' : ''}</p>
                </div>
                <p className="font-bold text-slate-800">{fmtCurrency(o.monthlyRent)}<span className="text-xs text-slate-400 font-normal">/mo</span></p>
              </div>
            ))}
          </div>
        </div>

        {/* Overdue List */}
        <div className="card">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={15} className="text-red-400" />
              <h3 className="font-semibold text-slate-700 text-sm">Overdue — Not Yet Received</h3>
            </div>
            {(data?.overdueList?.length || 0) > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">
                {data.overdueList.length} payments
              </span>
            )}
          </div>
          <div className="divide-y divide-slate-50 overflow-y-auto" style={{ maxHeight: '420px' }}>
            {data?.overdueList?.length === 0
              ? <div className="px-5 py-8 text-center text-slate-300 text-sm">No overdue payments 🎉</div>
              : data?.overdueList?.map((p, i) => (
              <div key={i} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    Unit {p.contracts?.units?.unit_number} · {p.contracts?.tenants?.name || '—'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {p.contracts?.units?.owners?.name && <span className="text-slate-500 font-medium">{p.contracts.units.owners.name} · </span>}
                    Due {fmt(p.due_date)}
                  </p>
                </div>
                <p className="font-bold text-red-500 ml-4 flex-shrink-0">{fmtCurrency(p.amount)}</p>
              </div>
            ))}
          </div>
          {(data?.overdueList?.length || 0) > 0 && (
            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between bg-red-50/50">
              <span className="text-xs font-semibold text-slate-500">Total overdue</span>
              <span className="text-sm font-bold text-red-600">
                {fmtCurrency(data.overdueList.reduce((s, p) => s + p.amount, 0))}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function KPI({ icon, bg, label, value, sub }) {
  return (
    <div className="card p-5">
      <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>{icon}</div>
      <p className="text-xl font-bold text-slate-800">{value}</p>
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  )
}

function Spin() { return <div className="flex items-center justify-center h-64"><div className="w-7 h-7 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" /></div> }
