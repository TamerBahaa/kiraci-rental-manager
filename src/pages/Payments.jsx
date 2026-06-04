import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getPayments, markPaid, refreshOverdue } from '../services/api'
import { fmtCurrency, fmt, statusStyle, daysOverdue, PAYMENT_METHODS } from '../utils/helpers'
import { useSearchParams } from 'react-router-dom'
import Modal from '../components/Modal'
import { Search, CreditCard, CheckCircle2, Phone, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function Payments() {
  const { user } = useAuth()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()
  const [stFilter, setStFilter] = useState(searchParams.get('status') || 'pending')
  const [markModal, setMarkModal] = useState(null)
  const [markForm, setMarkForm] = useState({ paid_date: format(new Date(), 'yyyy-MM-dd'), payment_method: 'Bank Transfer (EFT)', notes: '' })
  const [marking, setMarking] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      await refreshOverdue(user.id)
      setPayments(await getPayments(user.id, { status: stFilter || undefined }))
    } catch { toast.error('Load failed') }
    finally { setLoading(false) }
  }, [user.id, stFilter])

  useEffect(() => { load() }, [load])

  const openMark = (p) => {
    setMarkModal(p)
    setMarkForm({ paid_date: format(new Date(), 'yyyy-MM-dd'), payment_method: 'Bank Transfer (EFT)', notes: '' })
  }

  const doMark = async (e) => {
    e.preventDefault()
    setMarking(true)
    try {
      await markPaid(markModal.id, markForm)
      toast.success('✅ Payment recorded!')
      setMarkModal(null)
      load()
    } catch (e) { toast.error(e.message) }
    finally { setMarking(false) }
  }

  const counts = {
    all: payments.length,
    overdue: payments.filter(p => p.status === 'overdue').length,
    pending: payments.filter(p => p.status === 'pending').length,
    upcoming: payments.filter(p => p.status === 'upcoming').length,
    paid: payments.filter(p => p.status === 'paid').length,
  }

  const filtered = payments.filter(p => {
    const q = search.toLowerCase()
    return !q || p.contracts?.units?.unit_number?.toLowerCase().includes(q) || p.contracts?.tenants?.name?.toLowerCase().includes(q)
  })

  const totalAmt = filtered.reduce((s, p) => s + p.amount, 0)
  const paidAmt = filtered.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0)

  const tabs = [
    { key: 'overdue', label: 'Overdue', color: 'text-red-600 border-red-600' },
    { key: 'pending', label: 'Pending', color: 'text-amber-600 border-amber-600' },
    { key: 'upcoming', label: 'Upcoming', color: 'text-blue-600 border-blue-600' },
    { key: 'paid', label: 'Paid', color: 'text-emerald-600 border-emerald-600' },
    { key: '', label: 'All', color: 'text-slate-600 border-slate-600' },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-800">Payments</h1>
          <p className="text-slate-400 text-sm">Track and record rental receipts</p>
        </div>
        <button onClick={load} className="btn-secondary"><RefreshCw size={13} /> Refresh</button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {tabs.map(tab => (
          <button key={tab.key}
            onClick={() => { setStFilter(tab.key); setSearchParams(tab.key ? { status: tab.key } : {}) }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-all flex items-center gap-1.5 ${
              stFilter === tab.key ? `${tab.color}` : 'text-slate-400 border-transparent hover:text-slate-600'
            }`}>
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${stFilter === tab.key ? 'bg-current/10' : 'bg-slate-100 text-slate-500'}`}>
              {counts[tab.key] ?? payments.length}
            </span>
          </button>
        ))}
      </div>

      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-8 text-sm" placeholder="Search unit or tenant…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {filtered.length > 0 && (
          <div className="flex gap-4 px-4 py-2 bg-white rounded-xl border border-slate-100 text-sm flex-shrink-0">
            <span className="text-slate-400">Total: <strong className="text-slate-700">{fmtCurrency(totalAmt)}</strong></span>
            <span className="text-slate-400">Paid: <strong className="text-emerald-600">{fmtCurrency(paidAmt)}</strong></span>
          </div>
        )}
      </div>

      {loading ? <Spin /> : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-slate-100 bg-slate-50/60">
              <tr>
                <th className="th">Unit</th>
                <th className="th">Tenant</th>
                <th className="th">Due Date</th>
                <th className="th">Amount</th>
                <th className="th">Status</th>
                <th className="th">Paid On</th>
                <th className="th">Method</th>
                <th className="th"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-slate-300">
                  <CreditCard size={28} className="mx-auto mb-2" /><p className="text-sm">No payments found</p>
                </td></tr>
              ) : filtered.map(p => (
                <tr key={p.id} className={`table-row ${p.status === 'overdue' ? 'bg-red-50/40' : ''}`}>
                  <td className="td">
                    <span className="font-bold text-slate-800">{p.contracts?.units?.unit_number}</span>
                    <span className="text-slate-400 text-xs ml-1">Block {p.contracts?.units?.building}</span>
                  </td>
                  <td className="td">
                    <p className="text-sm">{p.contracts?.tenants?.name || '—'}</p>
                    {p.contracts?.tenants?.phone && (
                      <p className="text-xs text-slate-400 flex items-center gap-1"><Phone size={9} />{p.contracts.tenants.phone}</p>
                    )}
                  </td>
                  <td className="td">
                    <p>{fmt(p.due_date)}</p>
                    {p.status === 'overdue' && <p className="text-xs text-red-400">{daysOverdue(p.due_date)}d overdue</p>}
                  </td>
                  <td className="td font-bold text-slate-800">{fmtCurrency(p.amount, p.contracts?.currency || p.currency)}</td>
                  <td className="td"><span className={statusStyle.payment[p.status] || 'badge-slate'}>{p.status}</span></td>
                  <td className="td text-slate-400 text-sm">{p.paid_date ? fmt(p.paid_date) : '—'}</td>
                  <td className="td text-slate-400 text-xs">{p.payment_method || '—'}</td>
                  <td className="td">
                    {['pending', 'overdue'].includes(p.status) && (
                      <button onClick={() => openMark(p)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors whitespace-nowrap">
                        <CheckCircle2 size={11} /> Mark Received
                      </button>
                    )}
                    {p.status === 'paid' && <span className="text-xs text-emerald-500 flex items-center gap-1"><CheckCircle2 size={11} /> Done</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mark Received Modal */}
      <Modal isOpen={!!markModal} onClose={() => setMarkModal(null)} title="Record Payment" size="sm">
        {markModal && (
          <form onSubmit={doMark} className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <p className="font-bold text-slate-800">Unit {markModal.contracts?.units?.unit_number} · Block {markModal.contracts?.units?.building}</p>
              <p className="text-sm text-slate-500 mt-0.5">{markModal.contracts?.tenants?.name}</p>
              <p className="text-2xl font-bold text-emerald-600 mt-2">{fmtCurrency(markModal.amount, markModal.currency)}</p>
              <p className="text-xs text-slate-400">Due: {fmt(markModal.due_date)}</p>
            </div>
            <div><label className="label">Date Received</label><input className="input" type="date" value={markForm.paid_date} onChange={e => setMarkForm(p => ({ ...p, paid_date: e.target.value }))} required /></div>
            <div><label className="label">Payment Method</label>
              <select className="input" value={markForm.payment_method} onChange={e => setMarkForm(p => ({ ...p, payment_method: e.target.value }))}>
                {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div><label className="label">Reference / Notes</label><input className="input" value={markForm.notes} onChange={e => setMarkForm(p => ({ ...p, notes: e.target.value }))} placeholder="Transaction ref, remarks…" /></div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setMarkModal(null)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={marking} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold disabled:opacity-60">
                <CheckCircle2 size={14} /> {marking ? 'Saving…' : 'Confirm Receipt'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}

function Spin() { return <div className="flex items-center justify-center h-64"><div className="w-7 h-7 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" /></div> }
