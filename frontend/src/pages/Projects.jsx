import React, { useState, useEffect } from 'react';
import { projectsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { createPortal } from 'react-dom';
import { Plus, Edit, Trash2, Calendar, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Projects.css';

const STATUS_COLORS = {
  planning: '#64748b', active: '#10b981', on_hold: '#f59e0b',
  completed: '#6366f1', cancelled: '#ef4444'
};
const PROJECT_COLORS = ['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#f97316'];
const ICONS = ['📁','🚀','⚡','🎯','💡','🔧','🎨','📊','🌟','🏆','💻','📱'];

function ProjectModal({ project, onClose, onSave }) {
  const [form, setForm] = useState({
    name:        project?.name        || '',
    description: project?.description || '',
    status:      project?.status      || 'active',
    priority:    project?.priority    || 'medium',
    color:       project?.color       || '#6366f1',
    icon:        project?.icon        || '📁',
    startDate:   project?.startDate ? project.startDate.split('T')[0] : '',
    deadline:    project?.deadline  ? project.deadline.split('T')[0]  : '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.name.trim()) return toast.error('Project name is required');
    setSaving(true);
    try {
      await onSave({ ...form, startDate: form.startDate || null, deadline: form.deadline || null });
      toast.success(project ? 'Project updated!' : 'Project created!');
      onClose();
    } catch (e) { toast.error(e.message); }
    setSaving(false);
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{project ? 'Edit Project' : 'New Project'}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="form-group">
          <label className="label">Icon</label>
          <div className="icon-picker">
            {ICONS.map(icon => (
              <button key={icon} className={`icon-option ${form.icon === icon ? 'selected' : ''}`}
                onClick={() => setForm({ ...form, icon })}>{icon}</button>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label className="label">Project Name *</label>
          <input className="input-field" placeholder="Project name..."
            value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="label">Description</label>
          <textarea className="input-field" rows={3} placeholder="What is this project about?"
            value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="label">Color</label>
          <div className="color-picker">
            {PROJECT_COLORS.map(color => (
              <button key={color}
                className={`color-swatch ${form.color === color ? 'selected' : ''}`}
                style={{ background: color }} onClick={() => setForm({ ...form, color })} />
            ))}
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="label">Status</label>
            <select className="input-field" value={form.status}
              onChange={e => setForm({ ...form, status: e.target.value })}>
              {['planning','active','on_hold','completed','cancelled'].map(s => (
                <option key={s} value={s}>{s.replace('_',' ').toUpperCase()}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Priority</label>
            <select className="input-field" value={form.priority}
              onChange={e => setForm({ ...form, priority: e.target.value })}>
              {['low','medium','high'].map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="label">Start Date</label>
            <input type="date" className="input-field" value={form.startDate}
              onChange={e => setForm({ ...form, startDate: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="label">Deadline</label>
            <input type="date" className="input-field" value={form.deadline}
              onChange={e => setForm({ ...form, deadline: e.target.value })} />
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? <><div className="spinner" /> Saving...</> : project ? 'Save Changes' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function Projects() {
  const [projects, setProjects]     = useState([]);
  const [loading,  setLoading]      = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [editProject, setEditProject] = useState(null);

  const fetchProjects = async () => {
    try { const res = await projectsAPI.getAll(); setProjects(res.projects || []); }
    catch (e) { toast.error(e.message); }
  };

  useEffect(() => { fetchProjects().finally(() => setLoading(false)); }, []);

  const handleCreate = async (data) => { await projectsAPI.create(data); fetchProjects(); };
  const handleUpdate = async (data) => { await projectsAPI.update(editProject.id, data); fetchProjects(); };
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try { await projectsAPI.delete(id); toast.success('Project deleted'); fetchProjects(); }
    catch (e) { toast.error(e.message); }
  };

  if (loading) return (
    <div className="projects-grid">
      {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 200, borderRadius: 16 }} />)}
    </div>
  );

  return (
    <div className="projects-page page-enter">
      <div className="projects-header">
        <div className="projects-count">{projects.length} projects</div>
        <button className="btn btn-primary" onClick={() => { setEditProject(null); setShowModal(true); }}>
          <Plus size={18} /> New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state glass-card" style={{ padding: 80 }}>
          <div className="empty-state-icon">📁</div>
          <h3 style={{ marginBottom: 8 }}>No projects yet</h3>
          <p>Create a project to organise your tasks</p>
          <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => setShowModal(true)}>
            <Plus size={18} /> Create Project
          </button>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map(project => (
            <div key={project.id} className="project-card glass-card glass-card-hover animate-fade-in">
              <div className="project-card-header" style={{ borderColor: project.color + '30' }}>
                <div className="project-icon" style={{ background: project.color + '22' }}>
                  <span style={{ fontSize: 24 }}>{project.icon}</span>
                </div>
                <div className="project-header-actions">
                  <button className="btn btn-ghost btn-icon btn-sm"
                    onClick={() => { setEditProject(project); setShowModal(true); }}>
                    <Edit size={14} />
                  </button>
                  <button className="btn btn-danger btn-icon btn-sm"
                    onClick={() => handleDelete(project.id, project.name)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="project-card-body">
                <div className="project-color-bar" style={{ background: project.color }} />
                <h3 className="project-name">{project.name}</h3>
                {project.description && <p className="project-desc">{project.description}</p>}
                <div className="project-stats">
                  <div className="project-stat">
                    <span className="project-stat-value">{project.taskStats?.total || 0}</span>
                    <span className="project-stat-label">Tasks</span>
                  </div>
                  <div className="project-stat">
                    <span className="project-stat-value" style={{ color:'var(--accent-success)' }}>
                      {project.taskStats?.completed || 0}
                    </span>
                    <span className="project-stat-label">Done</span>
                  </div>
                  <div className="project-stat">
                    <span className="project-stat-value" style={{ color:'var(--accent-danger)' }}>
                      {project.taskStats?.overdue || 0}
                    </span>
                    <span className="project-stat-label">Overdue</span>
                  </div>
                </div>
                <div className="project-progress">
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ fontSize:12, color:'var(--text-muted)' }}>Progress</span>
                    <span style={{ fontSize:12, fontWeight:600, color: project.color }}>{project.progress || 0}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width:`${project.progress||0}%`, background: project.color }} />
                  </div>
                </div>
              </div>
              <div className="project-card-footer">
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span className="badge"
                    style={{ background: STATUS_COLORS[project.status]+'22', color: STATUS_COLORS[project.status] }}>
                    {project.status.replace('_',' ')}
                  </span>
                  {project.deadline && (
                    <span style={{ fontSize:12, color:'var(--text-muted)', display:'flex', alignItems:'center', gap:4 }}>
                      <Calendar size={11} />
                      {new Date(project.deadline).toLocaleDateString('en-US', { month:'short', day:'numeric' })}
                    </span>
                  )}
                </div>
                <Link to={`/projects/${project.id}`} className="btn btn-ghost btn-sm">
                  View <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <ProjectModal
          project={editProject}
          onClose={() => { setShowModal(false); setEditProject(null); }}
          onSave={editProject ? handleUpdate : handleCreate}
        />
      )}
    </div>
  );
}
