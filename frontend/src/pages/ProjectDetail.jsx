import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { projectsAPI, tasksAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Plus, Edit, Trash2, CheckCircle, Circle,
  Clock, Calendar, Users, BarChart2, Tag, AlertTriangle
} from 'lucide-react';
import './ProjectDetail.css';

const STATUS_COLORS = {
  planning: '#64748b', active: '#10b981', on_hold: '#f59e0b',
  completed: '#6366f1', cancelled: '#ef4444'
};
const PRIORITY_COLORS = {
  low: '#64748b', medium: '#f59e0b', high: '#ef4444', urgent: '#ff3333'
};

/* ── Quick Task Form ─────────────────────────────────────────────────────── */
function QuickTaskModal({ projectId, onClose, onSave }) {
  const [form, setForm] = useState({
    title: '', priority: 'medium', dueDate: '', status: 'todo'
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.title.trim()) return toast.error('Title is required');
    setSaving(true);
    try {
      await onSave({ ...form, projectId, dueDate: form.dueDate || null });
      toast.success('Task created!');
      onClose();
    } catch (e) { toast.error(e.message); }
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Task to Project</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="form-group">
          <label className="label">Task Title *</label>
          <input className="input-field" placeholder="Task name..."
            value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
            autoFocus />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="label">Priority</label>
            <select className="input-field" value={form.priority}
              onChange={e => setForm({ ...form, priority: e.target.value })}>
              {['low','medium','high','urgent'].map(p =>
                <option key={p} value={p}>{p.toUpperCase()}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Due Date</label>
            <input type="date" className="input-field" value={form.dueDate}
              onChange={e => setForm({ ...form, dueDate: e.target.value })} />
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? <><div className="spinner" /> Adding...</> : 'Add Task'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── ProjectDetail Page ──────────────────────────────────────────────────── */
export default function ProjectDetail() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const [project,    setProject]    = useState(null);
  const [tasks,      setTasks]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [activeTab,  setActiveTab]  = useState('tasks');

  const fetchProject = async () => {
    try {
      const res = await projectsAPI.getOne(id);
      setProject(res.project);
      setTasks(res.tasks || []);
    } catch (e) {
      toast.error(e.message);
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProject(); }, [id]);

  const handleDeleteProject = async () => {
    if (!window.confirm(`Delete project "${project.name}"? Tasks will be unlinked.`)) return;
    try {
      await projectsAPI.delete(id);
      toast.success('Project deleted');
      navigate('/projects');
    } catch (e) { toast.error(e.message); }
  };

  const handleCreateTask = async (data) => {
    await tasksAPI.create(data);
    fetchProject();
  };

  const toggleTask = async (task) => {
    const newStatus = task.status === 'completed' ? 'todo' : 'completed';
    try { await tasksAPI.update(task.id, { status: newStatus }); fetchProject(); }
    catch (e) { toast.error(e.message); }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try { await tasksAPI.delete(taskId); toast.success('Task deleted'); fetchProject(); }
    catch (e) { toast.error(e.message); }
  };

  const isOverdue = (t) =>
    t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed';

  if (loading) return (
    <div className="pd-loading">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="skeleton" style={{ height: i === 0 ? 160 : 80, borderRadius: 16 }} />
      ))}
    </div>
  );

  if (!project) return null;

  const todo        = tasks.filter(t => t.status === 'todo');
  const inProgress  = tasks.filter(t => t.status === 'in_progress');
  const completed   = tasks.filter(t => t.status === 'completed');
  const overdue     = tasks.filter(isOverdue);

  return (
    <div className="project-detail page-enter">
      {/* Back button */}
      <button className="btn btn-ghost btn-sm pd-back" onClick={() => navigate('/projects')}>
        <ArrowLeft size={16} /> All Projects
      </button>

      {/* Hero */}
      <div className="pd-hero glass-card">
        <div className="pd-hero-left">
          <div className="pd-icon" style={{ background: project.color + '22' }}>
            <span style={{ fontSize: 32 }}>{project.icon}</span>
          </div>
          <div>
            <div className="pd-color-bar" style={{ background: project.color }} />
            <h1 className="pd-name">{project.name}</h1>
            {project.description && <p className="pd-desc">{project.description}</p>}
            <div className="pd-badges">
              <span className="badge"
                style={{ background: STATUS_COLORS[project.status] + '22', color: STATUS_COLORS[project.status] }}>
                {project.status.replace('_', ' ')}
              </span>
              <span className={`badge badge-${project.priority}`}>{project.priority}</span>
              {project.deadline && (
                <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'var(--text-muted)' }}>
                  <Calendar size={11} />
                  Due {new Date(project.deadline).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="pd-hero-right">
          <div className="pd-stat-cards">
            {[
              { label: 'Total',     value: tasks.length,      color: 'var(--accent-primary)' },
              { label: 'Done',      value: completed.length,  color: 'var(--accent-success)' },
              { label: 'Active',    value: inProgress.length, color: 'var(--accent-tertiary)' },
              { label: 'Overdue',   value: overdue.length,    color: 'var(--accent-danger)' },
            ].map((s, i) => (
              <div key={i} className="pd-stat">
                <div className="pd-stat-value" style={{ color: s.color }}>{s.value}</div>
                <div className="pd-stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="pd-progress-wrap">
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
              <span style={{ fontSize:12, color:'var(--text-muted)' }}>Progress</span>
              <span style={{ fontSize:13, fontWeight:700, color: project.color }}>{project.progress || 0}%</span>
            </div>
            <div className="progress-bar" style={{ height: 8 }}>
              <div className="progress-fill"
                style={{ width: `${project.progress || 0}%`, background: project.color }} />
            </div>
          </div>

          <div className="pd-actions">
            <Link to={`/projects/${id}/edit`} className="btn btn-ghost btn-sm">
              <Edit size={14} /> Edit
            </Link>
            <button className="btn btn-danger btn-sm" onClick={handleDeleteProject}>
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="pd-tabs">
        {['tasks', 'overview'].map(tab => (
          <button key={tab}
            className={`pd-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
        <button className="btn btn-primary btn-sm" style={{ marginLeft: 'auto' }}
          onClick={() => setShowModal(true)}>
          <Plus size={16} /> Add Task
        </button>
      </div>

      {/* Tasks tab */}
      {activeTab === 'tasks' && (
        <div className="pd-tasks">
          {tasks.length === 0 ? (
            <div className="empty-state glass-card" style={{ padding: 60 }}>
              <div className="empty-state-icon">📋</div>
              <h3 style={{ marginBottom: 8 }}>No tasks yet</h3>
              <p>Add tasks to start tracking progress</p>
              <button className="btn btn-primary" style={{ marginTop: 20 }}
                onClick={() => setShowModal(true)}>
                <Plus size={18} /> Add First Task
              </button>
            </div>
          ) : (
            <div className="pd-task-columns">
              {[
                { key: 'todo',        label: '📋 To Do',       list: todo },
                { key: 'in_progress', label: '⚡ In Progress', list: inProgress },
                { key: 'completed',   label: '✅ Completed',   list: completed },
              ].map(col => (
                <div key={col.key} className="pd-col glass-card">
                  <div className="pd-col-header">
                    <span className="pd-col-title">{col.label}</span>
                    <span className="pd-col-count">{col.list.length}</span>
                  </div>
                  <div className="pd-col-tasks">
                    {col.list.map(task => (
                      <div key={task.id}
                        className={`pd-task-card ${isOverdue(task) ? 'pd-task-overdue' : ''}`}>
                        <div className="pd-task-top">
                          <button className="pd-check" onClick={() => toggleTask(task)}>
                            {task.status === 'completed'
                              ? <CheckCircle size={16} style={{ color: 'var(--accent-success)' }} />
                              : <Circle size={16} />}
                          </button>
                          <span className={`pd-task-title ${task.status === 'completed' ? 'done' : ''}`}>
                            {task.title}
                          </span>
                          <button className="pd-task-del btn btn-danger btn-icon btn-sm"
                            onClick={() => deleteTask(task.id)}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                        <div className="pd-task-meta">
                          <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                          {task.dueDate && (
                            <span className={`pd-task-due ${isOverdue(task) ? 'overdue' : ''}`}>
                              <Clock size={10} />
                              {new Date(task.dueDate).toLocaleDateString('en-US', { month:'short', day:'numeric' })}
                            </span>
                          )}
                          {isOverdue(task) && (
                            <span className="pd-overdue-badge">
                              <AlertTriangle size={10} /> Overdue
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {col.list.length === 0 && (
                      <div style={{ padding:'16px 0', textAlign:'center', color:'var(--text-muted)', fontSize:13 }}>
                        No tasks here
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <div className="pd-overview">
          <div className="pd-overview-grid">
            <div className="glass-card pd-info-card">
              <h3 className="pd-card-title"><BarChart2 size={16} /> Project Details</h3>
              <div className="pd-info-rows">
                {[
                  { label: 'Status',    value: project.status.replace('_', ' ') },
                  { label: 'Priority',  value: project.priority },
                  { label: 'Progress',  value: `${project.progress || 0}%` },
                  { label: 'Owner',     value: project.owner?.name || '—' },
                  { label: 'Start Date', value: project.startDate ? new Date(project.startDate).toLocaleDateString() : '—' },
                  { label: 'Deadline',   value: project.deadline  ? new Date(project.deadline).toLocaleDateString() : '—' },
                  { label: 'Created',    value: new Date(project.createdAt).toLocaleDateString() },
                ].map((row, i) => (
                  <div key={i} className="pd-info-row">
                    <span className="pd-info-label">{row.label}</span>
                    <span className="pd-info-value">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card pd-info-card">
              <h3 className="pd-card-title"><Tag size={16} /> Tags</h3>
              {Array.isArray(project.tags) && project.tags.length > 0 ? (
                <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:12 }}>
                  {project.tags.map(tag => (
                    <span key={tag} className="chip">{tag}</span>
                  ))}
                </div>
              ) : (
                <p style={{ color:'var(--text-muted)', fontSize:13, marginTop:12 }}>No tags</p>
              )}

              <h3 className="pd-card-title" style={{ marginTop:24 }}>
                <AlertTriangle size={16} /> Overdue Tasks
              </h3>
              {overdue.length === 0 ? (
                <p style={{ color:'var(--accent-success)', fontSize:13, marginTop:8 }}>✅ None overdue!</p>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:8 }}>
                  {overdue.map(t => (
                    <div key={t.id} className="pd-overdue-item">
                      <div className="priority-dot" style={{ background: PRIORITY_COLORS[t.priority] }} />
                      <span style={{ fontSize:13 }}>{t.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <QuickTaskModal
          projectId={project.id}
          onClose={() => setShowModal(false)}
          onSave={handleCreateTask}
        />
      )}
    </div>
  );
}
