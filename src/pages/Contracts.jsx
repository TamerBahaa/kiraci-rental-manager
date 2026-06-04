import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getContracts, createContract, terminateContract, getUnits, getTenants } from '../services/api'
import { fmtCurrency, fmt, statusStyle, CURRENCIES } from '../utils/helpers'
import { differenceInDays, parseISO } from 'date-fns'
import Modal from '../components/Modal'
import Confirm from '../components/Confirm'
import { Plus, Search, FileText, XCircle, Eye, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

const blank = { unit_id: '', tenant_id: '', start_date: '', end_date: '', monthly_rent: '', deposit: '0', deposit_paid: false, payment_day: '1', currency: 'TRY', notes: '' }

export default function Contracts() {
  const { user } = useAuth()
  const [contracts, setContracts] = useState([])
  const [units, setUnits] = useState([])
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [stFilter, setStFilter] = useState('active')
  const [modal, setModal] = useState(false)
  const [view, setView] = useState(null)
  const [terminate, setTerminate] = useState(null)
  const [form, setForm] = useState(blank)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      const [c, u, t] = await Promise.all([getContracts(user.id), getUnits(user.id), getTenants(user.id)])
      setContracts(c); setUnits(u); setTenants(t)
    } catch { toast.error('Load failed') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const vacantUnits = units.filter(u => u.status === 'vacant')

  const save = async (e) => {
    e.preventDefault()
    if (!form.unit_id || !form.tenant_id || !form.start_date || !form.monthly_rent) return toast.error('Fill all required fields')
    setSaving(true)
    try {
      await createContract(user.id, {
        ...form,
        monthly_rent: Number(form.monthly_rent),
        deposit: Number(form.deposit) || 0,
        payment_day: Number(form.payment_day),
        status: 'active',
        end_date: form.end_date || null,
      })
      toast.success('Contract created — payments generated!')
      setModal(false); load()
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const doTerminate = async () => {
    try {
      await terminateContract(terminate.id, terminate.unit_id)
      toast.success('Contract terminated — unit is now vacant')
      load()
    } catch (e) { toast.error(e.message) }
  }

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const daysLeft = (end) => end ? differenceInDays(parseISO(end), new Date()) : null

  const filtered = contracts.filter(c => {
    const q = search.toLowerCase()
    return (!q || c.units?.unit_number?.toLowerCase().includes(q) || c.tenants?.name?.toLowerCase().includes(q))
      && (!stFilter || c.status === stFilter)
  })

  if (loading) return <Spin />

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-800">Contracts</h1>
          <p className="text-slate-400 text-sm">{contracts.filter(c => c.status === 'active').length} active</p>
        </div>
        <button onClick={() => { setForm(blank); setModal(true) }} className="btn-primary"><Plus size={14} /> New Contract</button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-8 text-sm" placeholder="Search unit or tenant…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto text-sm" value={stFilter} onChange={e => setStFilter(e.target.value)}>
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="terminated">Terminated</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-slate-100 bg-slate-50/60">
            <tr>
              <th className="th">Unit</th>
              <th className="th">Tenant</th>
              <th className="th">Period</th>
              <th className="th">Rent / Month</th>
              <th className="th">Pay Day</th>
              <th className="th">Status</th>
              <th className="th w-16"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-slate-300">
                <FileText size={28} className="mx-auto mb-2" /><p className="text-sm">No contracts found</p>
              </td></tr>
            ) : filtered.map(c => {
              const dl = daysLeft(c.end_date)
              const expiring = c.status === 'active' && dl !== null && dl >= 0 && dl <= 30
              return (
                <tr key={c.id} className="table-row">
                  <td className="td">
                    <p className="font-bold text-slate-800">{c.units?.unit_number}</p>
                    <p className="text-xs text-slate-400">Block {c.units?.building}</p>
                  </td>
                  <td className="td">
                    <p className="font-medium text-slate-700">{c.tenants?.name}</p>
                    <p className="text-xs text-slate-400">{c.tenants?.phone}</p>
                  </td>
                  <td className="td text-sm">
                    <p>{fmt(c.start_date)} → {c.end_date ? fmt(c.end_date) : '∞'}</p>
                    {expiring && <p className="text-xs text-amber-500 flex items-center gap-0.5 mt-0.5"><AlertTriangle size={9} /> Expires in {dl}d</p>}
                    {c.status === 'active' && dl !== null && dl < 0 && <p className="text-xs text-red-400 mt-0.5">Expired {Math.abs(dl)}d ago</p>}
                  </td>
                  <td className="td font-bold text-slate-800">{fmtCurrency(c.monthly_rent, c.currency)}</td>
                  <td className="td text-slate-500 text-sm">{c.payment_day ? `${c.payment_day}th` : '—'}</td>
                  <td className="td"><span className={statusStyle.contract[c.status] || 'badge-slate'}>{c.status}</span></td>
                  <td className="td">
                    <div className="flex gap-1">
                      <button onClick={() => setView(c)} className="p-1.5 rounded hover:bg-slate-100 text-slate-300 hover:text-slate-600"><Eye size={13} /></button>
                      {c.status === 'active' && (
                        <button onClick={() => setTerminate(c)} className="p-1.5 rounded hover:bg-red-50 text-slate-300 hover:text-red-500" title="Terminate"><XCircle size={13} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* New Contract Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title="New Rental Contract" size="lg">
        <form onSubmit={save} className="space-y-4">
          {vacantUnits.length === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-sm text-amber-700">
              No vacant units available. Terminate an existing contract first.
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Unit (Vacant Only) *</label>
              <select className="input text-sm" value={form.unit_id} onChange={f('unit_id')} required>
                <option value="">Select unit…</option>
                {vacantUnits.map(u => <option key={u.id} value={u.id}>{u.unit_number} — Block {u.building}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Tenant *</label>
              <select className="input text-sm" value={form.tenant_id} onChange={f('tenant_id')} required>
                <option value="">Select tenant…</option>
                {tenants.map(t => <option key={t.id} value={t.id}>{t.name}{t.phone ? ` · ${t.phone}` : ''}</option>)}
              </select>
            </div>
            <div><label className="label">Start Date *</label><input className="input" type="date" value={form.start_date} onChange={f('start_date')} required /></div>
            <div><label className="label">End Date</label><input className="input" type="date" value={form.end_date} onChange={f('end_date')} /></div>
            <div>
              <label className="label">Monthly Rent *</label>
              <div className="flex gap-2">
                <input className="input flex-1" type="number" value={form.monthly_rent} onChange={f('monthly_rent')} placeholder="22000" required />
                <select className="input w-20" value={form.currency} onChange={f('currency')}>
                  {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Payment Day *</label>
              <select className="input" value={form.payment_day} onChange={f('payment_day')}>
                {[1,5,8,10,13,14,15,17,18,20,21,22,23,25,27,28].map(d => <option key={d} value={d}>{d}th of month</option>)}
              </select>
            </div>
            <div><label className="label">Deposit</label><input className="input" type="number" value={form.deposit} onChange={f('deposit')} /></div>
            <div className="flex items-center gap-2 pt-5">
              <input type="checkbox" id="dp" checked={form.deposit_paid} onChange={e => setForm(p => ({ ...p, deposit_paid: e.target.checked }))} className="w-4 h-4 accent-brand-600" />
              <label htmlFor="dp" className="text-sm text-slate-600 cursor-pointer">Deposit received</label>
            </div>
            <div className="col-span-2"><label className="label">Notes</label><textarea className="input resize-none h-14" value={form.notes} onChange={f('notes')} /></div>
          </div>
          <div className="bg-brand-50 border border-brand-100 rounded-lg px-4 py-2.5 text-xs text-brand-700">
            Creating this contract will automatically mark the unit as <strong>rented</strong> and generate monthly payment records.
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving || vacantUnits.length === 0} className="btn-primary">{saving ? 'Creating…' : 'Create Contract'}</button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal isOpen={!!view} onClose={() => setView(null)} title="Contract Details">
        {view && (
          <div className="grid grid-cols-2 gap-3">
            {[
              ['Unit', `${view.units?.unit_number} · Block ${view.units?.building}`],
              ['Tenant', view.tenants?.name],
              ['Tenant Phone', view.tenants?.phone],
              ['Status', <span className={statusStyle.contract[view.status]}>{view.status}</span>],
              ['Start', fmt(view.start_date)],
              ['End', view.end_date ? fmt(view.end_date) : 'Open-ended'],
              ['Monthly Rent', fmtCurrency(view.monthly_rent, view.currency)],
              ['Payment Day', `${view.payment_day}th of month`],
              ['Deposit', view.deposit ? fmtCurrency(view.deposit, view.currency) : 'None'],
              ['Deposit Paid', view.deposit_paid ? '✓ Yes' : '—'],
            ].map(([l, v]) => (
              <div key={l} className="bg-slate-50 rounded-lg p-3">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{l}</p>
                <p className="text-sm text-slate-700 font-medium">{v || '—'}</p>
              </div>
            ))}
            {view.notes && <div className="col-span-2 bg-slate-50 rounded-lg p-3"><p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Notes</p><p className="text-sm text-slate-600">{view.notes}</p></div>}
          </div>
        )}
      </Modal>

      <Confirm isOpen={!!terminate} onClose={() => setTerminate(null)} onConfirm={doTerminate}
        title="Terminate Contract"
        message={`Terminate contract for unit ${terminate?.units?.unit_number} (${terminate?.tenants?.name})? Future pending payments will be removed and the unit becomes vacant.`}
        confirmLabel="Terminate"
      />
    </div>
  )
}

function Spin() { return <div className="flex items-center justify-center h-64"><div className="w-7 h-7 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" /></div> }
