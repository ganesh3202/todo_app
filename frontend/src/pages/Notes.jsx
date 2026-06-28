import React, { useState, useEffect } from 'react';
import { notesAPI } from '../services/api';
import toast from 'react-hot-toast';
import { createPortal } from 'react-dom';
import { Plus, Pin, Edit, Trash2, Search, Tag } from 'lucide-react';
import './Notes.css';

const NOTE_TYPES = [
  { value: 'note',         label: 'Note',         icon: '📝' },
  { value: 'snippet',      label: 'Code Snippet',  icon: '💻' },
  { value: 'interview_qa', label: 'Interview Q&A', icon: '🎯' },
  { value: 'learning',     label: 'Learning',      icon: '📚' },
  { value: 'resource',     label: 'Resource',      icon: '🔗' },
];
const NOTE_COLORS = ['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899'];

//* ── Note Modal ─────────────────────────────────────────────────────────── */
function NoteModal({ note, onClose, onSave }) {
  const [form, setForm] = useState({
    title:        note?.title    || '',
    content:      note?.content  || '',
    type:         note?.type     || 'note',
    color:        note?.color    || '#6366f1',
    tags:         Array.isArray(note?.tags) ? note.tags.join(', ') : '',
    isPinned:     note?.isPinned || false,
    // codeSnippet stored as codeLanguage + codeContent in MySQL backend
    codeLanguage: note?.codeLanguage || note?.codeSnippet?.language || 'javascript',
    codeContent:  note?.codeContent  || note?.codeSnippet?.code     || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.title.trim()) return toast.error('Title is required');
    setSaving(true);
    try {
      const { codeLanguage, codeContent, ...rest } = form;
      const payload = {
        ...rest,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        // send as codeSnippet object so backend controller can handle it
        codeSnippet: { language: codeLanguage, code: codeContent },
      };
      await onSave(payload);
      toast.success(note ? 'Note updated!' : 'Note created!');
      onClose();
    } catch (e) { toast.error(e.message); }
    setSaving(false);
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content note-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{note ? 'Edit Note' : 'New Note'}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>

        <div className="form-group">
          <label className="label">Type</label>
          <div className="type-picker">
            {NOTE_TYPES.map(t => (
              <button key={t.value}
                className={`type-option ${form.type === t.value ? 'selected' : ''}`}
                onClick={() => setForm({ ...form, type: t.value })}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="label">Title *</label>
          <input className="input-field" placeholder="Note title..."
            value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        </div>

        <div className="form-group">
          <label className="label">Content</label>
          <textarea className="input-field" rows={5} placeholder="Write your note here..."
            value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
        </div>

        {form.type === 'snippet' && (
          <div className="form-group">
            <label className="label">Code</label>
            <select className="input-field" style={{ marginBottom: 8 }}
              value={form.codeLanguage}
              onChange={e => setForm({ ...form, codeLanguage: e.target.value })}>
              {['javascript','typescript','python','java','cpp','c','html','css','sql','bash','json','go','rust'].map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
            <textarea className="input-field code-input" rows={6}
              placeholder="// Paste your code here..."
              value={form.codeContent}
              onChange={e => setForm({ ...form, codeContent: e.target.value })} />
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label className="label">Color</label>
            <div className="color-picker">
              {NOTE_COLORS.map(color => (
                <button key={color}
                  className={`color-swatch ${form.color === color ? 'selected' : ''}`}
                  style={{ background: color }} onClick={() => setForm({ ...form, color })} />
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="label">Tags (comma separated)</label>
            <input className="input-field" placeholder="react, tips, css..."
              value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
          </div>
        </div>

        <div className="form-group">
          <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:14, color:'var(--text-secondary)' }}>
            <input type="checkbox" checked={form.isPinned}
              onChange={e => setForm({ ...form, isPinned: e.target.checked })} />
            Pin this note to the top
          </label>
        </div>

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? <><div className="spinner" /> Saving...</> : note ? 'Save Changes' : 'Create Note'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
/* ── Notes Page ─────────────────────────────────────────────────────────── */
export default function Notes({ isKnowledge = false }) {
  const [notes,        setNotes]       = useState([]);
  const [loading,      setLoading]     = useState(true);
  const [showModal,    setShowModal]   = useState(false);
  const [editNote,     setEditNote]    = useState(null);
  const [search,       setSearch]      = useState('');
  const [typeFilter,   setTypeFilter]  = useState('');
  const [expandedNote, setExpandedNote] = useState(null);

  const fetchNotes = async () => {
    try {
      const params = {};
      if (search)     params.search = search;
      if (typeFilter) params.type   = typeFilter;
      const res = await notesAPI.getAll(params);
      setNotes(res.notes || []);
    } catch (e) { toast.error(e.message); }
  };

  useEffect(() => { fetchNotes().finally(() => setLoading(false)); }, []);

  useEffect(() => {
    const t = setTimeout(fetchNotes, 300);
    return () => clearTimeout(t);
  }, [search, typeFilter]);

  const handleCreate = async (data) => { await notesAPI.create(data); fetchNotes(); };
  const handleUpdate = async (data) => { await notesAPI.update(editNote.id, data); fetchNotes(); };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this note?')) return;
    try { await notesAPI.delete(id); toast.success('Note deleted'); fetchNotes(); }
    catch (e) { toast.error(e.message); }
  };

  const handlePin = async (note) => {
    try { await notesAPI.update(note.id, { isPinned: !note.isPinned }); fetchNotes(); }
    catch (e) { toast.error(e.message); }
  };

  const pinnedNotes  = notes.filter(n => n.isPinned);
  const regularNotes = notes.filter(n => !n.isPinned);

  const renderNote = (note) => (
    <div key={note.id} className="note-card glass-card" style={{ borderColor: note.color + '30' }}>
      <div className="note-card-header">
        <div className="note-type-badge" style={{ background: note.color + '22', color: note.color }}>
          {NOTE_TYPES.find(t => t.value === note.type)?.icon}{' '}
          {NOTE_TYPES.find(t => t.value === note.type)?.label}
        </div>
        <div className="note-actions">
          <button className={`btn btn-ghost btn-icon btn-sm ${note.isPinned ? 'pinned' : ''}`}
            onClick={() => handlePin(note)} title="Pin">
            <Pin size={13} style={{ fill: note.isPinned ? 'currentColor' : 'none' }} />
          </button>
          <button className="btn btn-ghost btn-icon btn-sm"
            onClick={() => { setEditNote(note); setShowModal(true); }}>
            <Edit size={13} />
          </button>
          <button className="btn btn-danger btn-icon btn-sm"
            onClick={() => handleDelete(note.id)}>
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div className="note-color-strip" style={{ background: note.color }} />

      <div className="note-card-body"
        onClick={() => setExpandedNote(expandedNote === note.id ? null : note.id)}>
        <h3 className="note-title">{note.title}</h3>
        {note.content && (
          <p className={`note-content ${expandedNote === note.id ? 'expanded' : ''}`}>
            {note.content}
          </p>
        )}
        {/* Code snippet — stored as codeLanguage + codeContent in MySQL */}
        {note.type === 'snippet' && note.codeContent && (
          <div className="code-preview">
            <div className="code-lang">{note.codeLanguage || 'code'}</div>
            <pre className={`code-block ${expandedNote === note.id ? 'expanded' : ''}`}>
              <code>{note.codeContent}</code>
            </pre>
          </div>
        )}
      </div>

      {Array.isArray(note.tags) && note.tags.length > 0 && (
        <div className="note-tags">
          {note.tags.map(tag => (
            <span key={tag} className="chip"><Tag size={10} />{tag}</span>
          ))}
        </div>
      )}

      <div className="note-footer">
        <span style={{ fontSize:11, color:'var(--text-muted)' }}>
          {new Date(note.updatedAt).toLocaleDateString()}
        </span>
        {note.isPinned && <span style={{ fontSize:11, color: note.color }}>📌 Pinned</span>}
      </div>
    </div>
  );

  return (
    <div className="notes-page page-enter">
      <div className="notes-header">
        <div className="search-box" style={{ maxWidth: 280 }}>
          <Search size={16} />
          <input type="text" placeholder="Search notes..." value={search}
            onChange={e => setSearch(e.target.value)} className="search-box-input" />
        </div>
        <div className="type-filter-tabs">
          <button className={`filter-tab ${!typeFilter ? 'active' : ''}`}
            onClick={() => setTypeFilter('')}>All</button>
          {NOTE_TYPES.map(t => (
            <button key={t.value}
              className={`filter-tab ${typeFilter === t.value ? 'active' : ''}`}
              onClick={() => setTypeFilter(t.value)}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
        <button className="btn btn-primary"
          onClick={() => { setEditNote(null); setShowModal(true); }}>
          <Plus size={18} /> New Note
        </button>
      </div>

      {loading ? (
        <div className="notes-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 200, borderRadius: 16 }} />
          ))}
        </div>
      ) : (
        <>
          {pinnedNotes.length > 0 && (
            <div className="notes-section">
              <div className="section-title"><Pin size={14} /> Pinned</div>
              <div className="notes-grid">{pinnedNotes.map(renderNote)}</div>
            </div>
          )}
          {regularNotes.length > 0 && (
            <div className="notes-section">
              {pinnedNotes.length > 0 && <div className="section-title">All Notes</div>}
              <div className="notes-grid">{regularNotes.map(renderNote)}</div>
            </div>
          )}
          {notes.length === 0 && (
            <div className="empty-state glass-card" style={{ padding: 80 }}>
              <div className="empty-state-icon">📝</div>
              <h3 style={{ marginBottom: 8 }}>No notes yet</h3>
              <p>Start capturing your ideas and knowledge</p>
              <button className="btn btn-primary" style={{ marginTop: 20 }}
                onClick={() => setShowModal(true)}>
                <Plus size={18} /> Create Note
              </button>
            </div>
          )}
        </>
      )}

      {showModal && (
        <NoteModal
          note={editNote}
          onClose={() => { setShowModal(false); setEditNote(null); }}
          onSave={editNote ? handleUpdate : handleCreate}
        />
      )}
    </div>
  );
}
