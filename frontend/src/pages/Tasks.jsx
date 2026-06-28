import React, { useState, useEffect } from 'react';
import { tasksAPI, projectsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { createPortal } from 'react-dom';
import { Plus, Filter, Search, Trash2, Edit, CheckCircle, Circle, Clock, Tag } from 'lucide-react';
import './Tasks.css';

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const STATUSES   = ['todo', 'in_progress', 'completed', 'cancelled'];

/* ── Task Modal ─────────────────────────────────────────────────────────── */
function TaskModal({ task, projects, onClose, onSave }) {
  const [form, setForm] = useState({
    title:        task?.title        || '',
    description:  task?.description  || '',
    status:       task?.status       || 'todo',
    priority:     task?.priority     || 'medium',
    dueDate:      task?.dueDate      ? task.dueDate.split('T')[0] : '',
    category:     task?.category     || '',
    tags:         Array.isArray(task?.tags) ? task.tags.join(', ') : '',
    projectId:    task?.projectId    || task?.project?.id || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.title.trim()) return toast.error('Title is required');
    setSaving(true);
    try {
      const data = {
        ...form,
        tags:      form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        projectId: form.projectId || null,
        dueDate:   form.dueDate   || null,
      };
      await onSave(data);
      toast.success(task ? 'Task updated!' : 'Task created!');
      onClose();
    } catch (e) {
      toast.error(e.message);
    }
    setSaving(false);
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{task ? 'Edit Task' : 'Create New Task'}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>

        <div className="form-group">
          <label className="label">Task Title *</label>
          <input className="input-field" placeholder="What needs to be done?"
            value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        </div>

        <div className="form-group">
          <label className="label">Description</label>
          <textarea className="input-field" rows={3} placeholder="Add details..."
            value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="label">Status</label>
            <select className="input-field" value={form.status}
              onChange={e => setForm({ ...form, status: e.target.value })}>
              {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Priority</label>
            <select className="input-field" value={form.priority}
              onChange={e => setForm({ ...form, priority: e.target.value })}>
              {PRIORITIES.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="label">Due Date</label>
            <input type="date" className="input-field" value={form.dueDate}
              onChange={e => setForm({ ...form, dueDate: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="label">Project</label>
            <select className="input-field" value={form.projectId}
              onChange={e => setForm({ ...form, projectId: e.target.value })}>
              <option value="">No project</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="label">Category</label>
            <input className="input-field" placeholder="e.g., Design, Dev..."
              value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="label">Tags (comma separated)</label>
            <input className="input-field" placeholder="tag1, tag2..."
              value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? <><div className="spinner" /> Saving...</> : task ? 'Save Changes' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ── Tasks Page ─────────────────────────────────────────────────────────── */
export default function Tasks() {
  const [tasks,     setTasks]     = useState([]);
  const [projects,  setProjects]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTask,  setEditTask]  = useState(null);
  const [filters,   setFilters]   = useState({ status: '', priority: '', search: '' });
  const [showFilters, setShowFilters] = useState(false);

  const fetchTasks = async () => {
    try {
      const params = {};
      if (filters.status)   params.status   = filters.status;
      if (filters.priority) params.priority  = filters.priority;
      if (filters.search)   params.search    = filters.search;
      const res = await tasksAPI.getAll(params);
      setTasks(res.tasks || []);
    } catch (e) { toast.error(e.message); }
  };

  useEffect(() => {
    Promise.all([
      fetchTasks(),
      projectsAPI.getAll().then(r => setProjects(r.projects || []))
    ]).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchTasks(); }, [filters.status, filters.priority]);

  useEffect(() => {
    const t = setTimeout(fetchTasks, 400);
    return () => clearTimeout(t);
  }, [filters.search]);

  const handleCreate = async (data) => { await tasksAPI.create(data);          fetchTasks(); };
  const handleUpdate = async (data) => { await tasksAPI.update(editTask.id, data); fetchTasks(); };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try { await tasksAPI.delete(id); toast.success('Task deleted'); fetchTasks(); }
    catch (e) { toast.error(e.message); }
  };

  const toggleComplete = async (task) => {
    const newStatus = task.status === 'completed' ? 'todo' : 'completed';
    try { await tasksAPI.update(task.id, { status: newStatus }); fetchTasks(); }
    catch (e) { toast.error(e.message); }
  };

  const isOverdue = (task) =>
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';

  const grouped = {
    todo:        tasks.filter(t => t.status === 'todo'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    completed:   tasks.filter(t => t.status === 'completed'),
    cancelled:   tasks.filter(t => t.status === 'cancelled'),
  };

  return (
    <div className="tasks-page page-enter">
      {/* Header */}
      <div className="tasks-header">
        <div className="tasks-header-left">
          <div className="tasks-count">{tasks.length} tasks</div>
          <div className="header-actions">
            <div className="search-box">
              <Search size={16} />
              <input type="text" placeholder="Search tasks..." value={filters.search}
                onChange={e => setFilters({ ...filters, search: e.target.value })}
                className="search-box-input" />
            </div>
            <button className={`btn btn-ghost btn-sm ${showFilters ? 'active-filter' : ''}`}
              onClick={() => setShowFilters(!showFilters)}>
              <Filter size={16} /> Filters
            </button>
          </div>
        </div>
        <button className="btn btn-primary"
          onClick={() => { setEditTask(null); setShowModal(true); }}>
          <Plus size={18} /> New Task
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="filters-bar glass-card animate-fade-in">
          <select className="input-field" value={filters.status}
            onChange={e => setFilters({ ...filters, status: e.target.value })}>
            <option value="">All Status</option>
            {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
          <select className="input-field" value={filters.priority}
            onChange={e => setFilters({ ...filters, priority: e.target.value })}>
            <option value="">All Priority</option>
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <button className="btn btn-ghost btn-sm"
            onClick={() => setFilters({ status: '', priority: '', search: '' })}>
            Clear
          </button>
        </div>
      )}

      {/* Task groups */}
      {loading ? (
        <div className="tasks-skeleton">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12 }} />
          ))}
        </div>
      ) : (
        <div className="tasks-groups">
          {Object.entries(grouped).map(([status, statusTasks]) =>
            statusTasks.length > 0 && (
              <div key={status} className="task-group">
                <div className="task-group-header">
                  <div className={`badge badge-${status}`}>
                    {status.replace('_', ' ').toUpperCase()}
                  </div>
                  <span className="task-group-count">{statusTasks.length}</span>
                </div>

                <div className="task-list">
                  {statusTasks.map(task => (
                    <div key={task.id}
                      className={`task-card glass-card
                        ${task.status === 'completed' ? 'task-completed' : ''}
                        ${isOverdue(task) ? 'task-overdue' : ''}`}>
                      <button className="task-check" onClick={() => toggleComplete(task)}>
                        {task.status === 'completed'
                          ? <CheckCircle size={20} style={{ color: 'var(--accent-success)' }} />
                          : <Circle size={20} />}
                      </button>

                      <div className="task-main">
                        <div className="task-title">{task.title}</div>
                        {task.description && (
                          <div className="task-desc">{task.description}</div>
                        )}
                        <div className="task-meta">
                          <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                          {task.project && (
                            <span className="task-project"
                              style={{ borderColor: task.project.color + '40', color: task.project.color }}>
                              {task.project.name}
                            </span>
                          )}
                          {task.dueDate && (
                            <span className={`task-due ${isOverdue(task) ? 'overdue' : ''}`}>
                              <Clock size={11} />
                              {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          )}
                          {Array.isArray(task.tags) && task.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="chip"><Tag size={10} />{tag}</span>
                          ))}
                        </div>
                      </div>

                      <div className="task-actions">
                        <button className="btn btn-ghost btn-icon btn-sm"
                          onClick={() => { setEditTask(task); setShowModal(true); }}>
                          <Edit size={14} />
                        </button>
                        <button className="btn btn-danger btn-icon btn-sm"
                          onClick={() => handleDelete(task.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}

          {tasks.length === 0 && (
            <div className="empty-state glass-card" style={{ padding: '60px 20px' }}>
              <div className="empty-state-icon">✅</div>
              <h3 style={{ marginBottom: 8 }}>No tasks yet</h3>
              <p>Create your first task to get started</p>
              <button className="btn btn-primary" style={{ marginTop: 20 }}
                onClick={() => setShowModal(true)}>
                <Plus size={18} /> Create Task
              </button>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <TaskModal
          task={editTask}
          projects={projects}
          onClose={() => { setShowModal(false); setEditTask(null); }}
          onSave={editTask ? handleUpdate : handleCreate}
        />
      )}
    </div>
  );
}
