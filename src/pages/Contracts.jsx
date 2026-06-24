import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getContracts, createContract, terminateContract, updateContract, getUnits, getTenants } from '../services/api'
import { fmtCurrency, fmt, statusStyle, CURRENCIES } from '../utils/helpers'
import { differenceInDays, parseISO, format } from 'date-fns'
import Modal from '../components/Modal'
import Confirm from '../components/Confirm'
import { Plus, Search, FileText, XCircle, Eye, AlertTriangle, Pencil } from 'lucide-react'
import toast from 'react-hot-toast'

const blank = {
  unit_id: '', tenant_id: '', start_date: '', end_date: '',
  monthly_rent: '', deposit: '0', deposit_paid: false,
  payment_day: '1', currency: 'TRY', notes: '',
}

export default function Contracts() {
  const { user } = useAuth()
  const [contracts, setContracts] = useState([])
  const [units, setUnits] = useState([])
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [stFilter, setStFilter] = useState('active')
  const [createModal, setCreateModal] = useState(false)
  const [editModal, setEditModal] = useState(null)   // holds the contract being edited
  const [viewModal, setViewModal] = useState(null)
  const [terminateItem, setTerminateItem] = useState(null)
  const [form, setForm] = useState(blank)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      const [c, u, t] = await Promise.all([
        getContracts(user.id), getUnits(user.id), getTenants(user.id),
      ])
      setContracts(c); setUnits(u); setTenants(t)
    } catch { toast.error('Load failed') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const vacantUnits = units.filter(u => u.status === 'vacant')

  // ── Create ────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.unit_id || !form.tenant_id || !form.start_date || !form.monthly_rent)
      return toast.error('Fill all required fields')
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
      setCreateModal(false); load()
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  // ── Edit ─────────────────────────────────────
  const openEdit = (c) => {
    setEditForm({
      end_date:     c.end_date || '',
      monthly_rent: c.monthly_rent || '',
      currency:     c.currency || 'TRY',
      payment_day:  c.payment_day || 1,
      deposit:      c.deposit || 0,
      deposit_paid: c.deposit_paid || false,
      notes:        c.notes || '',
    })
    setEditModal(c)
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    if (!editForm.end_date)   return toast.error('End date is required')
    if (!editForm.monthly_rent) return toast.error('Monthly rent is required')
    setSaving(true)
    try {
      await updateContract(editModal.id, user.id, {
        ...editForm,
        monthly_rent: Number(editForm.monthly_rent),
        deposit:      Number(editForm.deposit) || 0,
        payment_day:  Number(editForm.payment_day),
      })
      toast.success('Contract updated — future payments regenerated!')
      setEditModal(null); load()
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  // ── Terminate ────────────────────────────────
  const handleTerminate = async () => {
    try {
      await terminateContract(terminateItem.id, terminateItem.unit_id)
      toast.success('Contract terminated — unit is now vacant')
      load()
    } catch (e) { toast.error(e.message) }
  }

  const f  = k => e => setForm(p => ({ ...p, [k]: e.target.value }))
  const ef = k => e => setEditForm(p => ({ ...p, [k]: e.target.value }))

  const daysLeft = (end) => end ? differenceInDays(parseISO(end), new Date()) : null

  const filtered = contracts.filter(c => {
    const q = search.toLowerCase()
    return (
      (!q || c.units?.unit_number?.toLowerCase().includes(q) || c.tenants?.name?.toLowerCase().includes(q))
      && (!stFilter || c.status === stFilter)
    )
  })

  if (loading) return <Spin />

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-800">Contracts</h1>
          <p className="text-slate-400 text-sm">
            {contracts.filter(c => c.status === 'active').length} active ·{' '}
            {contracts.filter(c => c.status === 'expired').length} expired
          </p>
        </div>
        <button onClick={() => { setForm(blank); setCreateModal(true) }} className="btn-primary">
          <Plus size={14} /> New Contract
        </button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-8 text-sm" placeholder="Search unit or tenant…"
            value={search} onChange={e => setSearch(e.target.value)} />
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
              <th className="th w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-slate-300">
                <FileText size={28} className="mx-auto mb-2" />
                <p className="text-sm">No contracts found</p>
              </td></tr>
            ) : filtered.map(c => {
              const dl = daysLeft(c.end_date)
              const expiringSoon = c.status === 'active' && dl !== null && dl >= 0 && dl <= 30
              const alreadyExpired = c.status === 'active' && dl !== null && dl < 0
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
                    {expiringSoon && (
                      <p className="text-xs text-amber-500 flex items-center gap-0.5 mt-0.5">
                        <AlertTriangle size={9} /> Expires in {dl}d
                      </p>
                    )}
                    {alreadyExpired && (
                      <p className="text-xs text-red-400 flex items-center gap-0.5 mt-0.5">
                        <AlertTriangle size={9} /> Expired {Math.abs(dl)}d ago — edit to renew
                      </p>
                    )}
                  </td>
                  <td className="td font-bold text-slate-800">
                    {fmtCurrency(c.monthly_rent, c.currency)}
                  </td>
                  <td className="td text-slate-500 text-sm">
                    {c.payment_day ? `${c.payment_day}th` : '—'}
                  </td>
                  <td className="td">
                    <span className={statusStyle.contract[c.status] || 'badge-slate'}>{c.status}</span>
                  </td>
                  <td className="td">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setViewModal(c)}
                        className="p-1.5 rounded hover:bg-slate-100 text-slate-300 hover:text-slate-600 transition-colors"
                        title="View details">
                        <Eye size={13} />
                      </button>
                      <button onClick={() => openEdit(c)}
                        className="p-1.5 rounded hover:bg-brand-50 text-slate-300 hover:text-brand-600 transition-colors"
                        title="Edit / Renew contract">
                        <Pencil size={13} />
                      </button>
                      {c.status === 'active' && (
                        <button onClick={() => setTerminateItem(c)}
                          className="p-1.5 rounded hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"
                          title="Terminate contract">
                          <XCircle size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── CREATE MODAL ───────────────────────── */}
      <Modal isOpen={createModal} onClose={() => setCreateModal(false)} title="New Rental Contract" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
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
                {vacantUnits.map(u => (
                  <option key={u.id} value={u.id}>{u.unit_number} — Block {u.building}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Tenant *</label>
              <select className="input text-sm" value={form.tenant_id} onChange={f('tenant_id')} required>
                <option value="">Select tenant…</option>
                {tenants.map(t => (
                  <option key={t.id} value={t.id}>{t.name}{t.phone ? ` · ${t.phone}` : ''}</option>
                ))}
              </select>
            </div>
            <div><label className="label">Start Date *</label>
              <input className="input" type="date" value={form.start_date} onChange={f('start_date')} required />
            </div>
            <div><label className="label">End Date</label>
              <input className="input" type="date" value={form.end_date} onChange={f('end_date')} />
            </div>
            <div>
              <label className="label">Monthly Rent *</label>
              <div className="flex gap-2">
                <input className="input flex-1" type="number" value={form.monthly_rent}
                  onChange={f('monthly_rent')} placeholder="22000" required />
                <select className="input w-20" value={form.currency} onChange={f('currency')}>
                  {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Payment Day *</label>
              <select className="input" value={form.payment_day} onChange={f('payment_day')}>
                {[1,5,8,10,13,14,15,17,18,20,21,22,23,25,27,28].map(d => (
                  <option key={d} value={d}>{d}th of month</option>
                ))}
              </select>
            </div>
            <div><label className="label">Deposit</label>
              <input className="input" type="number" value={form.deposit} onChange={f('deposit')} />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input type="checkbox" id="dp" checked={form.deposit_paid}
                onChange={e => setForm(p => ({ ...p, deposit_paid: e.target.checked }))}
                className="w-4 h-4 accent-brand-600" />
              <label htmlFor="dp" className="text-sm text-slate-600 cursor-pointer">Deposit received</label>
            </div>
            <div className="col-span-2"><label className="label">Notes</label>
              <textarea className="input resize-none h-14" value={form.notes} onChange={f('notes')} />
            </div>
          </div>
          <div className="bg-brand-50 border border-brand-100 rounded-lg px-4 py-2.5 text-xs text-brand-700">
            Creating this contract will automatically mark the unit as <strong>rented</strong> and generate monthly payment records.
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setCreateModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving || vacantUnits.length === 0} className="btn-primary">
              {saving ? 'Creating…' : 'Create Contract'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── EDIT / RENEW MODAL ─────────────────── */}
      <Modal isOpen={!!editModal} onClose={() => setEditModal(null)} title="Edit / Renew Contract" size="lg">
        {editModal && (
          <form onSubmit={handleEdit} className="space-y-4">
            {/* Read-only summary */}
            <div className="bg-slate-50 rounded-xl p-4 grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Unit</p>
                <p className="text-sm font-semibold text-slate-700">
                  {editModal.units?.unit_number} · Block {editModal.units?.building}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Tenant</p>
                <p className="text-sm font-semibold text-slate-700">{editModal.tenants?.name}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Start Date</p>
                <p className="text-sm text-slate-600">{fmt(editModal.start_date)}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Current Status</p>
                <span className={statusStyle.contract[editModal.status] || 'badge-slate'}>{editModal.status}</span>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Update Contract Terms
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">New End Date *</label>
                  <input className="input" type="date" value={editForm.end_date}
                    onChange={ef('end_date')} required />
                  <p className="text-xs text-slate-400 mt-1">Extend for renewal or correct the date</p>
                </div>
                <div>
                  <label className="label">Payment Day</label>
                  <select className="input" value={editForm.payment_day} onChange={ef('payment_day')}>
                    {[1,5,8,10,13,14,15,17,18,20,21,22,23,25,27,28].map(d => (
                      <option key={d} value={d}>{d}th of month</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Monthly Rent *</label>
                  <div className="flex gap-2">
                    <input className="input flex-1" type="number" value={editForm.monthly_rent}
                      onChange={ef('monthly_rent')} placeholder="22000" required />
                    <select className="input w-20" value={editForm.currency} onChange={ef('currency')}>
                      {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label">Deposit</label>
                  <input className="input" type="number" value={editForm.deposit} onChange={ef('deposit')} />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input type="checkbox" id="edp" checked={editForm.deposit_paid}
                    onChange={e => setEditForm(p => ({ ...p, deposit_paid: e.target.checked }))}
                    className="w-4 h-4 accent-brand-600" />
                  <label htmlFor="edp" className="text-sm text-slate-600 cursor-pointer">Deposit received</label>
                </div>
                <div className="col-span-2">
                  <label className="label">Notes</label>
                  <textarea className="input resize-none h-14" value={editForm.notes} onChange={ef('notes')} />
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-2.5 text-xs text-amber-700">
              <strong>Note:</strong> Saving will set the contract back to <strong>active</strong>, delete unpaid future payments
              and regenerate them with the new dates and rent amount. Already paid records are kept.
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditModal(null)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Saving…' : 'Save & Renew Contract'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ── VIEW MODAL ─────────────────────────── */}
      <Modal isOpen={!!viewModal} onClose={() => setViewModal(null)} title="Contract Details">
        {viewModal && (
          <div className="grid grid-cols-2 gap-3">
            {[
              ['Unit',         `${viewModal.units?.unit_number} · Block ${viewModal.units?.building}`],
              ['Tenant',        viewModal.tenants?.name],
              ['Tenant Phone',  viewModal.tenants?.phone],
              ['Status',        <span className={statusStyle.contract[viewModal.status]}>{viewModal.status}</span>],
              ['Start',         fmt(viewModal.start_date)],
              ['End',           viewModal.end_date ? fmt(viewModal.end_date) : 'Open-ended'],
              ['Monthly Rent',  fmtCurrency(viewModal.monthly_rent, viewModal.currency)],
              ['Payment Day',   `${viewModal.payment_day}th of month`],
              ['Deposit',       viewModal.deposit ? fmtCurrency(viewModal.deposit, viewModal.currency) : 'None'],
              ['Deposit Paid',  viewModal.deposit_paid ? '✓ Yes' : '—'],
            ].map(([l, v]) => (
              <div key={l} className="bg-slate-50 rounded-lg p-3">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{l}</p>
                <p className="text-sm text-slate-700 font-medium">{v || '—'}</p>
              </div>
            ))}
            {viewModal.notes && (
              <div className="col-span-2 bg-slate-50 rounded-lg p-3">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Notes</p>
                <p className="text-sm text-slate-600">{viewModal.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Confirm isOpen={!!terminateItem} onClose={() => setTerminateItem(null)} onConfirm={handleTerminate}
        title="Terminate Contract"
        message={`Terminate contract for unit ${terminateItem?.units?.unit_number} (${terminateItem?.tenants?.name})? Future pending payments will be removed and the unit becomes vacant.`}
        confirmLabel="Terminate"
      />
    </div>
  )
}

function Spin() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-7 h-7 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
