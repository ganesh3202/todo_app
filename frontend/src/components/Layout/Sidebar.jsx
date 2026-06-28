import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  LayoutDashboard, CheckSquare, FolderKanban, StickyNote, FileText,
  Calendar, Bot, Sun, Moon, LogOut, ChevronLeft, ChevronRight,
  Zap, User, Settings, BookOpen, BarChart3
} from 'lucide-react';
import './Sidebar.css';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: CheckSquare, label: 'Tasks', path: '/tasks' },
  { icon: FolderKanban, label: 'Projects', path: '/projects' },
  { icon: BarChart3, label: 'Kanban', path: '/kanban' },
  { icon: Calendar, label: 'Calendar', path: '/calendar' },
  { icon: StickyNote, label: 'Notes', path: '/notes' },
  { icon: FileText, label: 'Documents', path: '/documents' },
  { icon: BookOpen, label: 'Knowledge', path: '/knowledge' },
  { icon: Bot, label: 'AI Assistant', path: '/ai' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">
          <Zap size={20} />
        </div>
        {!collapsed && (
          <span className="logo-text">
            Task<span className="gradient-text">Flow</span>
          </span>
        )}
        <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* User info */}
      <div className="sidebar-user">
        <div className="user-avatar">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} />
          ) : (
            <span>{user?.name?.charAt(0).toUpperCase()}</span>
          )}
          <div className="user-status-dot" />
        </div>
        {!collapsed && (
          <div className="user-info">
            <div className="user-name">{user?.name}</div>
            <div className="user-role">{user?.role}</div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {!collapsed && <div className="nav-section-label">Navigation</div>}
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            title={collapsed ? item.label : ''}
          >
            <item.icon size={18} />
            {!collapsed && <span>{item.label}</span>}
            {item.badge && !collapsed && (
              <span className="nav-badge">{item.badge}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="sidebar-bottom">
        <NavLink to="/profile" className="nav-item" title={collapsed ? 'Profile' : ''}>
          <User size={18} />
          {!collapsed && <span>Profile</span>}
        </NavLink>

        <button className="nav-item" onClick={toggleTheme} title={collapsed ? 'Toggle Theme' : ''}>
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          {!collapsed && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>

        <button className="nav-item nav-item-danger" onClick={logout} title={collapsed ? 'Logout' : ''}>
          <LogOut size={18} />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
