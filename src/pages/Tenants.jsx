import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getTenants, saveTenant, deleteTenant } from '../services/api'
import { NATIONALITIES } from '../utils/helpers'
import Modal from '../components/Modal'
import Confirm from '../components/Confirm'
import { Plus, Search, Users, Pencil, Trash2, Phone, Mail, Shield } from 'lucide-react'
import toast from 'react-hot-toast'

const blank = { name: '', phone: '', email: '', id_number: '', nationality: 'Turkish', emergency_contact: '', emergency_phone: '', notes: '' }

export default function Tenants() {
  const { user } = useAuth()
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(blank)
  const [del, setDel] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try { setTenants(await getTenants(user.id)) }
    catch { toast.error('Load failed') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const openAdd = () => { setForm(blank); setEditId(null); setModal(true) }
  const openEdit = t => { setForm(t); setEditId(t.id); setModal(true) }

  const save = async (e) => {
    e.preventDefault()
    if (!form.name) return toast.error('Name required')
    setSaving(true)
    try {
      await saveTenant(user.id, form, editId)
      toast.success(editId ? 'Tenant updated' : 'Tenant added')
      setModal(false); load()
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const filtered = tenants.filter(t => {
    const q = search.toLowerCase()
    return !q || t.name?.toLowerCase().includes(q) || t.phone?.includes(q) || t.nationality?.toLowerCase().includes(q)
  })

  if (loading) return <Spin />

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-800">Tenants</h1>
          <p className="text-slate-400 text-sm">{tenants.length} tenants registered</p>
        </div>
        <button onClick={openAdd} className="btn-primary"><Plus size={14} /> Add Tenant</button>
      </div>

      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className="input pl-8 text-sm" placeholder="Search by name, phone, nationality…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0
          ? <div className="card col-span-full py-14 flex flex-col items-center text-slate-300"><Users size={30} className="mb-2" /><p className="text-sm">No tenants found</p></div>
          : filtered.map(t => (
          <div key={t.id} className="card p-5 hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-semibold text-slate-800">{t.name}</p>
                {t.nationality && <span className="badge-blue mt-0.5">{t.nationality}</span>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(t)} className="p-1.5 rounded hover:bg-slate-100 text-slate-300 hover:text-slate-600"><Pencil size={13} /></button>
                <button onClick={() => setDel(t)} className="p-1.5 rounded hover:bg-red-50 text-slate-300 hover:text-red-500"><Trash2 size={13} /></button>
              </div>
            </div>
            <div className="space-y-1.5 text-sm">
              {t.phone && <div className="flex items-center gap-2 text-slate-500"><Phone size={12} className="text-slate-300" />{t.phone}</div>}
              {t.email && <div className="flex items-center gap-2 text-slate-500"><Mail size={12} className="text-slate-300" />{t.email}</div>}
              {t.id_number && <p className="text-xs text-slate-400 font-mono">ID: {t.id_number}</p>}
              {(t.emergency_contact || t.emergency_phone) && (
                <div className="mt-2 pt-2 border-t border-slate-100">
                  <p className="text-xs text-slate-400 flex items-center gap-1 mb-0.5"><Shield size={10} className="text-amber-400" /> Emergency</p>
                  {t.emergency_contact && <p className="text-xs text-slate-600 font-medium">{t.emergency_contact}</p>}
                  {t.emergency_phone && <p className="text-xs text-slate-400">{t.emergency_phone}</p>}
                </div>
              )}
            </div>
            {t.notes && <p className="text-xs text-slate-400 mt-2 pt-2 border-t border-slate-100 line-clamp-2">{t.notes}</p>}
          </div>
        ))}
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editId ? 'Edit Tenant' : 'Add Tenant'} size="lg">
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="label">Full Name *</label><input className="input" value={form.name} onChange={f('name')} required /></div>
            <div><label className="label">Phone / WhatsApp</label><input className="input" value={form.phone} onChange={f('phone')} placeholder="+90 5XX XXX XXXX" /></div>
            <div><label className="label">Email</label><input className="input" type="email" value={form.email} onChange={f('email')} /></div>
            <div><label className="label">ID / Passport</label><input className="input" value={form.id_number} onChange={f('id_number')} /></div>
            <div><label className="label">Nationality</label>
              <select className="input" value={form.nationality} onChange={f('nationality')}>
                {NATIONALITIES.map(n => <option key={n}>{n}</option>)}
              </select>
            </div>
          </div>
          <div className="border-t border-slate-100 pt-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Emergency Contact (optional)</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Name</label><input className="input" value={form.emergency_contact} onChange={f('emergency_contact')} /></div>
              <div><label className="label">Phone</label><input className="input" value={form.emergency_phone} onChange={f('emergency_phone')} /></div>
            </div>
          </div>
          <div><label className="label">Notes</label><textarea className="input resize-none h-14" value={form.notes} onChange={f('notes')} /></div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : editId ? 'Save' : 'Add Tenant'}</button>
          </div>
        </form>
      </Modal>

      <Confirm isOpen={!!del} onClose={() => setDel(null)} onConfirm={async () => { try { await deleteTenant(del.id); toast.success('Deleted'); load() } catch { toast.error('Cannot delete — tenant has contracts') } }}
        title="Delete Tenant" message={`Delete ${del?.name}?`} />
    </div>
  )
}

function Spin() { return <div className="flex items-center justify-center h-64"><div className="w-7 h-7 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" /></div> }
