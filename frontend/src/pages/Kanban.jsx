import React, { useState, useEffect } from 'react';
import { tasksAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Plus, GripVertical, Clock, Tag } from 'lucide-react';
import './Kanban.css';

const COLUMNS = [
  { id: 'todo',        label: 'To Do',       color: '#64748b', emoji: '📋' },
  { id: 'in_progress', label: 'In Progress',  color: '#06b6d4', emoji: '⚡' },
  { id: 'completed',   label: 'Completed',    color: '#10b981', emoji: '✅' },
  { id: 'cancelled',   label: 'Cancelled',    color: '#ef4444', emoji: '❌' },
];

const PRI_COLORS = { low: '#64748b', medium: '#f59e0b', high: '#ef4444', urgent: '#ff3333' };

export default function Kanban() {
  const [columns, setColumns] = useState({
    todo: [], in_progress: [], completed: [], cancelled: []
  });
  const [loading,     setLoading]     = useState(true);
  const [dragging,    setDragging]    = useState(null);   // { task, fromCol }
  const [dragOver,    setDragOver]    = useState(null);   // colId
  const [newTaskCol,  setNewTaskCol]  = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  useEffect(() => {
    tasksAPI.getAll({ limit: 200 })
      .then(res => {
        const grouped = { todo: [], in_progress: [], completed: [], cancelled: [] };
        (res.tasks || []).forEach(t => {
          if (grouped[t.status]) grouped[t.status].push(t);
        });
        setColumns(grouped);
      })
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  /* ── Drag handlers ──────────────────────────────────────── */
  const onDragStart = (e, task, fromCol) => {
    setDragging({ task, fromCol });
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e, colId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(colId);
  };

  const onDrop = async (e, toCol) => {
    e.preventDefault();
    if (!dragging || dragging.fromCol === toCol) {
      setDragging(null); setDragOver(null); return;
    }
    const { task, fromCol } = dragging;

    // Optimistic update
    setColumns(prev => ({
      ...prev,
      [fromCol]: prev[fromCol].filter(t => t.id !== task.id),
      [toCol]:   [...prev[toCol], { ...task, status: toCol }]
    }));

    try {
      await tasksAPI.update(task.id, { status: toCol });
      toast.success(`Moved to ${toCol.replace('_', ' ')}`);
    } catch (e) {
      toast.error('Failed to move task');
      // revert
      setColumns(prev => ({
        ...prev,
        [toCol]:   prev[toCol].filter(t => t.id !== task.id),
        [fromCol]: [...prev[fromCol], task]
      }));
    }
    setDragging(null); setDragOver(null);
  };

  /* ── Quick add ──────────────────────────────────────────── */
  const quickAdd = async (colId) => {
    if (!newTaskTitle.trim()) return;
    try {
      const res = await tasksAPI.create({ title: newTaskTitle, status: colId });
      setColumns(prev => ({ ...prev, [colId]: [...prev[colId], res.task] }));
      setNewTaskTitle('');
      setNewTaskCol(null);
      toast.success('Task added');
    } catch (e) { toast.error(e.message); }
  };

  if (loading) return (
    <div className="kanban-loading">
      {COLUMNS.map(col => (
        <div key={col.id} className="skeleton" style={{ height: 400, borderRadius: 16 }} />
      ))}
    </div>
  );

  return (
    <div className="kanban-page page-enter">
      <div className="kanban-board">
        {COLUMNS.map(col => {
          const colTasks = columns[col.id] || [];
          return (
            <div key={col.id}
              className={`kanban-col ${dragOver === col.id ? 'drag-over' : ''}`}
              onDragOver={e => onDragOver(e, col.id)}
              onDrop={e => onDrop(e, col.id)}
              onDragLeave={() => setDragOver(null)}>

              {/* Column header */}
              <div className="kanban-col-header">
                <div className="col-title">
                  <span className="col-emoji">{col.emoji}</span>
                  <span style={{ color: col.color }}>{col.label}</span>
                </div>
                <div className="col-count"
                  style={{ background: col.color + '22', color: col.color }}>
                  {colTasks.length}
                </div>
              </div>

              <div className="col-accent" style={{ background: col.color }} />

              {/* Task cards */}
              <div className="kanban-tasks">
                {colTasks.map(task => (
                  <div key={task.id}
                    className={`kanban-task ${dragging?.task.id === task.id ? 'dragging' : ''}`}
                    draggable
                    onDragStart={e => onDragStart(e, task, col.id)}
                    onDragEnd={() => { setDragging(null); setDragOver(null); }}>

                    <div className="kanban-task-header">
                      <div className="priority-bar"
                        style={{ background: PRI_COLORS[task.priority] }} />
                      <GripVertical size={14} className="drag-handle" />
                    </div>

                    <div className="kanban-task-title">{task.title}</div>

                    {task.description && (
                      <div className="kanban-task-desc">{task.description}</div>
                    )}

                    <div className="kanban-task-footer">
                      <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                      {task.dueDate && (
                        <span className="kanban-due">
                          <Clock size={10} />
                          {new Date(task.dueDate).toLocaleDateString('en-US',
                            { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                      {task.project && (
                        <span className="kanban-project" style={{ color: task.project.color }}>
                          {task.project.name}
                        </span>
                      )}
                    </div>

                    {Array.isArray(task.tags) && task.tags.length > 0 && (
                      <div className="kanban-tags">
                        {task.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="chip"><Tag size={9} />{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Drop zone hint */}
                {dragOver === col.id && dragging?.fromCol !== col.id && (
                  <div className="drop-zone-indicator" style={{ borderColor: col.color }}>
                    Drop here
                  </div>
                )}
              </div>

              {/* Quick add */}
              {newTaskCol === col.id ? (
                <div className="quick-add-form">
                  <input autoFocus className="input-field" placeholder="Task title..."
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter')  quickAdd(col.id);
                      if (e.key === 'Escape') { setNewTaskCol(null); setNewTaskTitle(''); }
                    }} />
                  <div className="quick-add-actions">
                    <button className="btn btn-primary btn-sm" onClick={() => quickAdd(col.id)}>Add</button>
                    <button className="btn btn-ghost btn-sm"
                      onClick={() => { setNewTaskCol(null); setNewTaskTitle(''); }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <button className="quick-add-btn" onClick={() => setNewTaskCol(col.id)}>
                  <Plus size={16} /> Add task
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
