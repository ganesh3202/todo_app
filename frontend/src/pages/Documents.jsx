import React, { useState, useEffect, useRef } from 'react';
import { documentsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Upload, Trash2, Download, File, Image, FileText, Eye, Search, UploadCloud } from 'lucide-react';
import './Documents.css';

const FILE_ICONS = {
  pdf:   { icon: FileText, color: '#ef4444' },
  docx:  { icon: FileText, color: '#3b82f6' },
  xlsx:  { icon: FileText, color: '#10b981' },
  image: { icon: Image,    color: '#8b5cf6' },
  other: { icon: File,     color: '#64748b' },
};

const formatSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024, sizes = ['B','KB','MB','GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export default function Documents() {
  const [documents,  setDocuments]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [uploading,  setUploading]  = useState(false);
  const [search,     setSearch]     = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [viewMode,   setViewMode]   = useState('grid');
  const fileInputRef = useRef(null);

  const fetchDocs = async () => {
    try { const res = await documentsAPI.getAll(); setDocuments(res.documents || []); }
    catch (e) { toast.error(e.message); }
  };

  useEffect(() => { fetchDocs().finally(() => setLoading(false)); }, []);

  const handleUpload = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    let success = 0;
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('name', file.name);
      try { await documentsAPI.upload(fd); success++; }
      catch (e) { toast.error(`Failed: ${file.name}`); }
    }
    if (success) { toast.success(`${success} file(s) uploaded!`); fetchDocs(); }
    setUploading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this document?')) return;
    try { await documentsAPI.delete(id); toast.success('Deleted'); fetchDocs(); }
    catch (e) { toast.error(e.message); }
  };

  const handleDrag = (e, active) => { e.preventDefault(); setDragActive(active); };
  const handleDrop = (e) => { e.preventDefault(); setDragActive(false); handleUpload(e.dataTransfer.files); };

  const filtered = documents.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    (d.description || '').toLowerCase().includes(search.toLowerCase())
  );

  const getIcon = (type) => FILE_ICONS[type] || FILE_ICONS.other;

  return (
    <div className="docs-page page-enter">
      {/* Upload zone */}
      <div
        className={`upload-zone glass-card ${dragActive ? 'drag-active' : ''}`}
        onDragEnter={e => handleDrag(e, true)}
        onDragLeave={e => handleDrag(e, false)}
        onDragOver={e => handleDrag(e, true)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}>
        <input ref={fileInputRef} type="file" multiple hidden
          onChange={e => handleUpload(e.target.files)} />
        <div className={`upload-icon ${dragActive ? 'bounce' : ''}`}>
          {uploading
            ? <div className="spinner" style={{ width:40, height:40, borderWidth:3 }} />
            : <UploadCloud size={40} />}
        </div>
        <div className="upload-text">
          {uploading ? 'Uploading...' : dragActive ? 'Drop files here!' : 'Drag & drop or click to upload'}
        </div>
        <div className="upload-hint">PDF, Word, Excel, Images — max 50 MB</div>
      </div>

      {/* Header */}
      <div className="docs-header">
        <div className="search-box" style={{ maxWidth: 280 }}>
          <Search size={16} />
          <input type="text" placeholder="Search documents..." value={search}
            onChange={e => setSearch(e.target.value)} className="search-box-input" />
        </div>
        <div className="view-toggle">
          <button className={`btn btn-ghost btn-sm ${viewMode === 'grid' ? 'active-filter' : ''}`}
            onClick={() => setViewMode('grid')}>Grid</button>
          <button className={`btn btn-ghost btn-sm ${viewMode === 'list' ? 'active-filter' : ''}`}
            onClick={() => setViewMode('list')}>List</button>
        </div>
        <span style={{ fontSize:13, color:'var(--text-muted)' }}>{filtered.length} files</span>
      </div>

      {/* Content */}
      {loading ? (
        <div className={viewMode === 'grid' ? 'docs-grid' : 'docs-list'}>
          {[...Array(6)].map((_,i) => (
            <div key={i} className="skeleton" style={{ height: viewMode==='grid'?160:64, borderRadius:12 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state glass-card" style={{ padding: 80 }}>
          <div className="empty-state-icon">📄</div>
          <h3 style={{ marginBottom: 8 }}>No documents yet</h3>
          <p>Upload your first file above</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="docs-grid">
          {filtered.map(doc => {
            const { icon: Icon, color } = getIcon(doc.type);
            return (
              <div key={doc.id} className="doc-card glass-card glass-card-hover animate-fade-in">
                <div className="doc-card-icon" style={{ background: color + '15' }}>
                  <Icon size={32} style={{ color }} />
                </div>
                <div className="doc-card-info">
                  <div className="doc-name" title={doc.name}>{doc.name}</div>
                  <div className="doc-meta">
                    <span className="doc-type" style={{ color }}>{doc.type.toUpperCase()}</span>
                    <span>{formatSize(doc.size)}</span>
                  </div>
                  <div className="doc-date">{new Date(doc.createdAt).toLocaleDateString()}</div>
                </div>
                <div className="doc-card-actions">
                  <a href={doc.url} target="_blank" rel="noreferrer"
                    className="btn btn-ghost btn-icon btn-sm" title="Preview">
                    <Eye size={14} />
                  </a>
                  <a href={doc.url} download={doc.originalName}
                    className="btn btn-ghost btn-icon btn-sm" title="Download">
                    <Download size={14} />
                  </a>
                  <button className="btn btn-danger btn-icon btn-sm"
                    onClick={() => handleDelete(doc.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="docs-list">
          {filtered.map(doc => {
            const { icon: Icon, color } = getIcon(doc.type);
            return (
              <div key={doc.id} className="doc-list-item glass-card animate-fade-in">
                <div className="doc-list-icon" style={{ background: color + '15' }}>
                  <Icon size={20} style={{ color }} />
                </div>
                <div className="doc-list-info">
                  <div className="doc-name">{doc.name}</div>
                  <div style={{ fontSize:12, color:'var(--text-muted)' }}>
                    {doc.type.toUpperCase()} · {formatSize(doc.size)} · {new Date(doc.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="doc-list-actions">
                  <a href={doc.url} target="_blank" rel="noreferrer"
                    className="btn btn-ghost btn-icon btn-sm"><Eye size={14} /></a>
                  <a href={doc.url} download={doc.originalName}
                    className="btn btn-ghost btn-icon btn-sm"><Download size={14} /></a>
                  <button className="btn btn-danger btn-icon btn-sm"
                    onClick={() => handleDelete(doc.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
