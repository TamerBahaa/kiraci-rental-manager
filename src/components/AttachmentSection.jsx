import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getAttachments, uploadAttachment, deleteAttachment, getAttachmentUrl } from '../services/api'
import { Paperclip, Upload, Trash2, Download, FileText, Image, File, Loader } from 'lucide-react'
import toast from 'react-hot-toast'

const MAX_SIZE = 2 * 1024 * 1024   // 2 MB

const fmtSize = (b) => {
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / (1024 * 1024)).toFixed(1)} MB`
}

function FileIcon({ mimeType }) {
  if (mimeType?.startsWith('image/'))
    return <Image size={14} className="text-blue-500 shrink-0" />
  if (mimeType === 'application/pdf')
    return <FileText size={14} className="text-red-500 shrink-0" />
  return <File size={14} className="text-slate-400 shrink-0" />
}

export default function AttachmentSection({ entityType, entityId }) {
  const { user } = useAuth()
  const [items, setItems]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [uploading, setUploading] = useState(false)
  const [confirmId, setConfirmId] = useState(null)   // id of item pending delete
  const inputRef = useRef(null)

  useEffect(() => {
    if (!entityId) { setLoading(false); return }
    load()
  }, [entityId])

  const load = async () => {
    setLoading(true)
    try { setItems(await getAttachments(entityType, entityId)) }
    catch { toast.error('Could not load attachments') }
    finally { setLoading(false) }
  }

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Reset so the same file can be re-uploaded after delete
    if (inputRef.current) inputRef.current.value = ''

    if (file.size > MAX_SIZE) {
      toast.error(`File too large — max 2 MB (this file is ${fmtSize(file.size)})`)
      return
    }

    setUploading(true)
    try {
      await uploadAttachment(user.id, entityType, entityId, file)
      toast.success('File uploaded')
      load()
    } catch (err) {
      toast.error(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (item) => {
    try {
      const url = await getAttachmentUrl(item.file_path)
      const a = document.createElement('a')
      a.href = url
      a.download = item.file_name
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      a.click()
    } catch {
      toast.error('Download failed')
    }
  }

  const handleDelete = async () => {
    const item = items.find(i => i.id === confirmId)
    if (!item) return
    try {
      await deleteAttachment(item.id, item.file_path)
      toast.success('File deleted')
      setItems(prev => prev.filter(i => i.id !== confirmId))
    } catch {
      toast.error('Delete failed')
    } finally {
      setConfirmId(null)
    }
  }

  if (!entityId) return null

  return (
    <div className="border-t border-slate-100 pt-4 mt-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
          <Paperclip size={11} />
          Attachments{!loading ? ` (${items.length})` : ''}
        </p>
        <label
          className={`btn-secondary cursor-pointer select-none ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
          style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem', gap: '0.375rem' }}
        >
          {uploading
            ? <><Loader size={11} className="animate-spin" /> Uploading…</>
            : <><Upload size={11} /> Upload File</>
          }
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.gif"
            onChange={handleFile}
          />
        </label>
      </div>

      {/* File list */}
      {loading ? (
        <div className="text-center py-3">
          <Loader size={14} className="animate-spin text-slate-300 mx-auto" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-xs text-slate-300 text-center py-3 italic">
          No attachments yet
        </p>
      ) : (
        <div className="space-y-1.5">
          {items.map(item => (
            <div
              key={item.id}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 group transition-colors"
            >
              <FileIcon mimeType={item.mime_type} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700 font-medium truncate leading-tight">
                  {item.file_name}
                </p>
                <p className="text-[10px] text-slate-400 leading-tight mt-0.5">
                  {fmtSize(item.file_size)}
                </p>
              </div>

              {/* Delete confirm inline */}
              {confirmId === item.id ? (
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[11px] text-red-500 font-medium">Delete?</span>
                  <button
                    onClick={handleDelete}
                    className="text-[11px] font-semibold text-red-600 hover:text-red-700 px-1.5 py-0.5 rounded bg-red-50 hover:bg-red-100 transition-colors"
                  >Yes</button>
                  <button
                    onClick={() => setConfirmId(null)}
                    className="text-[11px] font-semibold text-slate-500 hover:text-slate-700 px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 transition-colors"
                  >No</button>
                </div>
              ) : (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() => handleDownload(item)}
                    className="p-1.5 rounded hover:bg-white text-slate-400 hover:text-brand-600 transition-colors"
                    title="Download"
                  >
                    <Download size={13} />
                  </button>
                  <button
                    onClick={() => setConfirmId(item.id)}
                    className="p-1.5 rounded hover:bg-white text-slate-400 hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-[10px] text-slate-300 mt-2.5">
        Max 2 MB · PDF, DOC, JPG, PNG, WebP accepted
      </p>
    </div>
  )
}
