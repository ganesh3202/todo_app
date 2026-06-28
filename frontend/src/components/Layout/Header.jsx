import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, Plus, X, Command } from 'lucide-react';
import { tasksAPI } from '../../services/api';
import './Header.css';

const pageNames = {
  '/dashboard': 'Dashboard',
  '/tasks': 'Tasks',
  '/projects': 'Projects',
  '/kanban': 'Kanban Board',
  '/calendar': 'Calendar',
  '/notes': 'Notes',
  '/documents': 'Documents',
  '/knowledge': 'Knowledge Vault',
  '/ai': 'AI Assistant',
  '/profile': 'Profile',
};

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef(null);

  const pageName = pageNames[location.pathname] || 'TaskFlow';

  useEffect(() => {
    const down = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchRef.current?.focus(), 100);
      }
      if (e.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await tasksAPI.getAll({ search: searchQuery, limit: 5 });
        setSearchResults(res.tasks || []);
      } catch (e) {}
      setSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const priorityColor = (p) => ({ low: '#64748b', medium: '#f59e0b', high: '#ef4444', urgent: '#ff3333' }[p] || '#64748b');

  return (
    <>
      <header className="header">
        <div className="header-left">
          <h1 className="page-title">{pageName}</h1>
          <div className="header-breadcrumb">
            <span>Home</span>
            <span>/</span>
            <span>{pageName}</span>
          </div>
        </div>

        <div className="header-right">
          <button className="search-trigger" onClick={() => { setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 100); }}>
            <Search size={15} />
            <span>Search...</span>
            <kbd><Command size={10} /> K</kbd>
          </button>

          <button className="header-icon-btn" title="Notifications">
            <Bell size={18} />
            <span className="notif-dot" />
          </button>

          <button className="btn btn-primary btn-sm" onClick={() => navigate('/tasks?new=1')}>
            <Plus size={16} /> New Task
          </button>
        </div>
      </header>

      {/* Global search modal */}
      {searchOpen && (
        <div className="search-modal-overlay" onClick={() => setSearchOpen(false)}>
          <div className="search-modal" onClick={e => e.stopPropagation()}>
            <div className="search-input-wrap">
              <Search size={18} className="search-icon" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search tasks, projects, notes..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="search-input"
              />
              {searching && <div className="spinner" />}
              <button onClick={() => setSearchOpen(false)} className="search-close">
                <X size={16} />
              </button>
            </div>

            <div className="search-results">
              {searchResults.length > 0 ? searchResults.map(task => (
                <div
                  key={task.id}
                  className="search-result-item"
                  onClick={() => { navigate('/tasks'); setSearchOpen(false); }}
                >
                  <div className="search-result-icon" style={{ background: priorityColor(task.priority) + '22' }}>
                    <div className="priority-dot" style={{ background: priorityColor(task.priority) }} />
                  </div>
                  <div>
                    <div className="search-result-title">{task.title}</div>
                    <div className="search-result-meta">
                      {task.project?.name && <span>{task.project.name}</span>}
                      <span className={`badge badge-${task.status}`}>{task.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>
              )) : searchQuery && !searching ? (
                <div className="search-empty">No results for "{searchQuery}"</div>
              ) : (
                <div className="search-hints">
                  <div className="search-hint">🔍 Search by task name, project, or tags</div>
                  <div className="search-hint">⌘K to open · ESC to close</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
