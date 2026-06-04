import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getUnits, saveUnit, deleteUnit, getOwners } from '../services/api'
import { statusStyle, UNIT_TYPES, BUILDINGS } from '../utils/helpers'
import Modal from '../components/Modal'
import Confirm from '../components/Confirm'
import { Plus, Search, Building2, Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

const blank = { unit_number: '', building: '', floor: '', type: '1+1', size_sqm: '', status: 'vacant', owner_id: '', notes: 'EŞYALI' }

export default function Units() {
  const { user } = useAuth()
  const [units, setUnits] = useState([])
  const [owners, setOwners] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [bldFilter, setBldFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modal, setModal] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(blank)
  const [del, setDel] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      const [u, o] = await Promise.all([getUnits(user.id), getOwners(user.id)])
      setUnits(u); setOwners(o)
    } catch { toast.error('Load failed') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const openAdd = () => { setForm(blank); setEditId(null); setModal(true) }
  const openEdit = (u) => { setForm({ ...u, floor: u.floor ?? '', size_sqm: u.size_sqm ?? '', owner_id: u.owner_id ?? '' }); setEditId(u.id); setModal(true) }

  const save = async (e) => {
    e.preventDefault()
    if (!form.unit_number) return toast.error('Unit number required')
    setSaving(true)
    try {
      await saveUnit(user.id, { ...form, floor: form.floor ? Number(form.floor) : null, size_sqm: form.size_sqm ? Number(form.size_sqm) : null, owner_id: form.owner_id || null }, editId)
      toast.success(editId ? 'Unit updated' : 'Unit added')
      setModal(false); load()
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const doDelete = async () => {
    try { await deleteUnit(del.id); toast.success('Deleted'); load() }
    catch { toast.error('Cannot delete — unit has contracts') }
  }

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const buildings = [...new Set(units.map(u => u.building).filter(Boolean))].sort()

  const filtered = units.filter(u => {
    const q = search.toLowerCase()
    return (!q || u.unit_number?.toLowerCase().includes(q) || u.owners?.name?.toLowerCase().includes(q) || u.building?.toLowerCase().includes(q))
      && (!bldFilter || u.building === bldFilter)
      && (!statusFilter || u.status === statusFilter)
  })

  if (loading) return <Spin />

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-800">Units</h1>
          <p className="text-slate-400 text-sm">{units.length} total · {units.filter(u => u.status === 'rented').length} rented · {units.filter(u => u.status === 'vacant').length} vacant</p>
        </div>
        <button onClick={openAdd} className="btn-primary"><Plus size={14} /> Add Unit</button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-44">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-8 text-sm" placeholder="Search unit, owner, building…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto text-sm" value={bldFilter} onChange={e => setBldFilter(e.target.value)}>
          <option value="">All Blocks</option>
          {buildings.map(b => <option key={b}>Block {b}</option>)}
          {units.some(u => u.building === 'NLOGO') && <option value="NLOGO">NLOGO</option>}
        </select>
        <select className="input w-auto text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="vacant">Vacant</option>
          <option value="rented">Rented</option>
          <option value="maintenance">Maintenance</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-slate-100 bg-slate-50/60">
            <tr>
              <th className="th">Unit</th>
              <th className="th">Block</th>
              <th className="th">Type</th>
              <th className="th">Owner</th>
              <th className="th">Status</th>
              <th className="th">Notes</th>
              <th className="th w-16"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-slate-300">
                <Building2 size={30} className="mx-auto mb-2" />
                <p className="text-sm">No units found</p>
              </td></tr>
            ) : filtered.map(u => (
              <tr key={u.id} className="table-row">
                <td className="td font-bold text-slate-800">{u.unit_number}</td>
                <td className="td text-slate-500">{u.building ? `Block ${u.building}` : '—'}{u.floor ? ` · F${u.floor}` : ''}</td>
                <td className="td text-slate-500">{u.type || '—'}</td>
                <td className="td">
                  {u.owners ? <div>
                    <p className="font-medium text-slate-700 text-sm">{u.owners.name}</p>
                    {u.owners.phone && <p className="text-xs text-slate-400">{u.owners.phone}</p>}
                  </div> : <span className="text-slate-300">—</span>}
                </td>
                <td className="td"><span className={statusStyle.unit[u.status] || 'badge-slate'}>{u.status}</span></td>
                <td className="td text-xs text-slate-400 max-w-32 truncate">{u.notes || '—'}</td>
                <td className="td">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(u)} className="p-1.5 rounded hover:bg-slate-100 text-slate-300 hover:text-slate-600 transition-colors"><Pencil size={13} /></button>
                    <button onClick={() => setDel(u)} className="p-1.5 rounded hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editId ? 'Edit Unit' : 'Add Unit'}>
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Unit Number *</label><input className="input" value={form.unit_number} onChange={f('unit_number')} placeholder="e.g. B89" required /></div>
            <div><label className="label">Block / Building</label>
              <select className="input" value={form.building} onChange={f('building')}>
                <option value="">Select…</option>
                {BUILDINGS.map(b => <option key={b} value={b}>{b === 'Other' ? 'Other' : `Block ${b}`}</option>)}
              </select>
            </div>
            <div><label className="label">Floor</label><input className="input" type="number" value={form.floor} onChange={f('floor')} /></div>
            <div><label className="label">Type</label>
              <select className="input" value={form.type} onChange={f('type')}>
                {UNIT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div><label className="label">Size (m²)</label><input className="input" type="number" value={form.size_sqm} onChange={f('size_sqm')} /></div>
            <div><label className="label">Status</label>
              <select className="input" value={form.status} onChange={f('status')}>
                <option value="vacant">Vacant</option>
                <option value="rented">Rented</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            <div className="col-span-2"><label className="label">Owner</label>
              <select className="input" value={form.owner_id} onChange={f('owner_id')}>
                <option value="">No owner</option>
                {owners.map(o => <option key={o.id} value={o.id}>{o.name}{o.phone ? ` · ${o.phone}` : ''}</option>)}
              </select>
            </div>
            <div className="col-span-2"><label className="label">Notes</label><textarea className="input resize-none h-16" value={form.notes} onChange={f('notes')} /></div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : editId ? 'Save' : 'Add Unit'}</button>
          </div>
        </form>
      </Modal>

      <Confirm isOpen={!!del} onClose={() => setDel(null)} onConfirm={doDelete}
        title="Delete Unit" message={`Delete unit ${del?.unit_number}? This will fail if the unit has contracts.`} />
    </div>
  )
}

function Spin() {
  return <div className="flex items-center justify-center h-64"><div className="w-7 h-7 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" /></div>
}
