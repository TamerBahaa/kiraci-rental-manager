import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getOwners, saveOwner, deleteOwner } from '../services/api'
import Modal from '../components/Modal'
import Confirm from '../components/Confirm'
import { Plus, Search, Home, Pencil, Trash2, Phone, Mail, Paperclip } from 'lucide-react'
import toast from 'react-hot-toast'
import AttachmentSection from '../components/AttachmentSection'

const blank = { name: '', phone: '', email: '', id_number: '', nationality: '', bank_account: '', notes: '' }

export default function Owners() {
  const { user } = useAuth()
  const [owners, setOwners] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(blank)
  const [del, setDel] = useState(null)
  const [saving, setSaving] = useState(false)
  const [newId, setNewId] = useState(null)   // set after creation to show attachment step

  const load = async () => {
    try { setOwners(await getOwners(user.id)) }
    catch { toast.error('Load failed') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const openAdd  = () => { setForm(blank); setEditId(null); setNewId(null); setModal(true) }
  const openEdit = o  => { setForm(o); setEditId(o.id); setNewId(null); setModal(true) }
  const closeModal = () => { setModal(false); setNewId(null) }

  const save = async (e) => {
    e.preventDefault()
    if (!form.name) return toast.error('Name required')
    setSaving(true)
    try {
      const result = await saveOwner(user.id, form, editId)
      if (editId) {
        toast.success('Owner updated')
        closeModal(); load()
      } else {
        toast.success('Owner added!')
        load()                   // reload list in background
        setNewId(result.id)      // stay in modal → show attachment step
      }
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const filtered = owners.filter(o => {
    const q = search.toLowerCase()
    return !q || o.name?.toLowerCase().includes(q) || o.phone?.includes(q) || o.email?.toLowerCase().includes(q)
  })

  if (loading) return <Spin />

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-800">Owners</h1>
          <p className="text-slate-400 text-sm">{owners.length} property owners</p>
        </div>
        <button onClick={openAdd} className="btn-primary"><Plus size={14} /> Add Owner</button>
      </div>

      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className="input pl-8 text-sm" placeholder="Search owners…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0
          ? <div className="card col-span-full py-14 flex flex-col items-center text-slate-300"><Home size={30} className="mb-2" /><p className="text-sm">No owners found</p></div>
          : filtered.map(o => (
          <div key={o.id} className="card p-5 hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-semibold text-slate-800">{o.name}</p>
                {o.nationality && <p className="text-xs text-slate-400">{o.nationality}</p>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(o)} className="p-1.5 rounded hover:bg-slate-100 text-slate-300 hover:text-slate-600"><Pencil size={13} /></button>
                <button onClick={() => setDel(o)} className="p-1.5 rounded hover:bg-red-50 text-slate-300 hover:text-red-500"><Trash2 size={13} /></button>
              </div>
            </div>
            <div className="space-y-1.5 text-sm">
              {o.phone && <div className="flex items-center gap-2 text-slate-500"><Phone size={12} className="text-slate-300" />{o.phone}</div>}
              {o.email && <div className="flex items-center gap-2 text-slate-500"><Mail size={12} className="text-slate-300" />{o.email}</div>}
              {o.bank_account && <p className="text-xs text-slate-400 font-mono truncate">{o.bank_account}</p>}
            </div>
            {o.notes && <p className="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-100 line-clamp-2">{o.notes}</p>}
          </div>
        ))}
      </div>

      <Modal isOpen={modal} onClose={closeModal} title={newId ? 'Add Owner — Attachments' : editId ? 'Edit Owner' : 'Add Owner'} size="lg">
        {newId ? (
          /* ── Step 2: owner created, show attachments ── */
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
              <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <span className="text-green-600 text-sm font-bold">✓</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-green-700">Owner added successfully!</p>
                <p className="text-xs text-green-600 mt-0.5">You can now attach ID scans, bank documents, or any other files.</p>
              </div>
            </div>
            <AttachmentSection entityType="owner" entityId={newId} />
            <div className="flex justify-end pt-2">
              <button type="button" onClick={closeModal} className="btn-primary">Done</button>
            </div>
          </div>
        ) : (
          /* ── Step 1: fill in the form ── */
          <form onSubmit={save} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className="label">Full Name *</label><input className="input" value={form.name} onChange={f('name')} required /></div>
              <div><label className="label">Phone / WhatsApp</label><input className="input" value={form.phone} onChange={f('phone')} placeholder="+90 5XX XXX XXXX" /></div>
              <div><label className="label">Email</label><input className="input" type="email" value={form.email} onChange={f('email')} /></div>
              <div><label className="label">ID / Passport</label><input className="input" value={form.id_number} onChange={f('id_number')} /></div>
              <div><label className="label">Nationality</label><input className="input" value={form.nationality} onChange={f('nationality')} /></div>
              <div className="col-span-2"><label className="label">Bank Account / IBAN</label><input className="input font-mono text-sm" value={form.bank_account} onChange={f('bank_account')} /></div>
              <div className="col-span-2"><label className="label">Notes</label><textarea className="input resize-none h-16" value={form.notes} onChange={f('notes')} /></div>
            </div>
            {editId && <AttachmentSection entityType="owner" entityId={editId} />}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : editId ? 'Save' : 'Add Owner'}</button>
            </div>
          </form>
        )}
      </Modal>

      <Confirm isOpen={!!del} onClose={() => setDel(null)} onConfirm={async () => { try { await deleteOwner(del.id); toast.success('Deleted'); load() } catch { toast.error('Cannot delete — owner has units') } }}
        title="Delete Owner" message={`Delete ${del?.name}? Units will be unassigned.`} />
    </div>
  )
}

function Spin() { return <div className="flex items-center justify-center h-64"><div className="w-7 h-7 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" /></div> }
