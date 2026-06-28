import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import {
  CheckSquare, Clock, AlertTriangle, FolderOpen, TrendingUp,
  Zap, Calendar, ArrowRight, Target, Award, Activity
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import './Dashboard.css';

const COLORS = ['#6366f1', '#8b5cf6', '#f59e0b', '#ef4444'];

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.getStats()
      .then(res => setStats(res))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  if (loading) return (
    <div className="dashboard-loading">
      <div className="loading-grid">
        {[...Array(8)].map((_, i) => <div key={i} className="skeleton" style={{ height: i < 4 ? 120 : 280, borderRadius: 16 }} />)}
      </div>
    </div>
  );

  const statCards = [
    { icon: CheckSquare, label: 'Total Tasks', value: stats?.stats.totalTasks || 0, color: '#6366f1', sub: `${stats?.stats.completedTasks} completed` },
    { icon: Clock, label: 'Pending', value: stats?.stats.pendingTasks || 0, color: '#f59e0b', sub: 'In progress' },
    { icon: AlertTriangle, label: 'Overdue', value: stats?.stats.overdueTasks || 0, color: '#ef4444', sub: 'Need attention' },
    { icon: FolderOpen, label: 'Projects', value: stats?.stats.activeProjects || 0, color: '#10b981', sub: 'Active projects' },
  ];

  const priorityData = stats?.priorityStats?.map(p => ({
    name: p._id,
    value: p.count
  })) || [];

  return (
    <div className="dashboard page-enter">
      {/* Hero greeting */}
      <div className="dashboard-hero glass-card">
        <div className="hero-content">
          <div className="hero-text">
            <div className="hero-greeting">
              <span className="greeting-emoji">✨</span>
              {greeting}, <strong>{user?.name?.split(' ')[0]}</strong>!
            </div>
            <p className="hero-subtitle">
              You've completed <strong className="gradient-text">{stats?.stats.todayCompleted || 0} tasks</strong> today.
              {stats?.stats.overdueTasks > 0 && ` You have ${stats.stats.overdueTasks} overdue tasks to catch up on.`}
              {stats?.stats.overdueTasks === 0 && " You're all caught up! 🎉"}
            </p>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-value gradient-text">{stats?.stats.completionRate || 0}%</div>
              <div className="hero-stat-label">Completion Rate</div>
            </div>
            <div className="hero-divider" />
            <div className="hero-stat">
              <div className="hero-stat-value gradient-text">{stats?.stats.weekCompleted || 0}</div>
              <div className="hero-stat-label">This Week</div>
            </div>
          </div>
        </div>
        <div className="hero-progress-bar">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${stats?.stats.completionRate || 0}%` }} />
          </div>
          <span className="hero-progress-label">Overall progress</span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="stat-cards">
        {statCards.map((card, i) => (
          <div key={i} className="stat-card glass-card glass-card-hover" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="stat-card-icon" style={{ background: card.color + '22' }}>
              <card.icon size={20} style={{ color: card.color }} />
            </div>
            <div className="stat-number" style={{ color: card.color }}>{card.value}</div>
            <div className="stat-label">{card.label}</div>
            <div className="stat-sub">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="dashboard-charts">
        {/* Weekly Activity */}
        <div className="chart-card glass-card">
          <div className="chart-header">
            <div>
              <h3 className="chart-title">Weekly Activity</h3>
              <p className="chart-subtitle">Tasks completed per day</p>
            </div>
            <Activity size={20} style={{ color: 'var(--accent-primary)' }} />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={stats?.weeklyData || []}>
              <defs>
                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-primary)' }} />
              <Area type="monotone" dataKey="completed" stroke="#6366f1" strokeWidth={2} fill="url(#colorCompleted)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Priority breakdown */}
        <div className="chart-card glass-card">
          <div className="chart-header">
            <div>
              <h3 className="chart-title">Priority Breakdown</h3>
              <p className="chart-subtitle">Tasks by priority level</p>
            </div>
            <Target size={20} style={{ color: 'var(--accent-secondary)' }} />
          </div>
          {priorityData.length > 0 ? (
            <div className="pie-container">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={priorityData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={4}>
                    {priorityData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-primary)' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pie-legend">
                {priorityData.map((d, i) => (
                  <div key={i} className="legend-item">
                    <div className="legend-dot" style={{ background: COLORS[i % COLORS.length] }} />
                    <span>{d.name}: {d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '40px 0' }}>
              <div className="empty-state-icon">📊</div>
              <p>No task data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="dashboard-bottom">
        {/* Upcoming tasks */}
        <div className="upcoming-tasks glass-card">
          <div className="section-header">
            <h3 className="chart-title">Upcoming Tasks</h3>
            <Link to="/tasks" className="btn btn-ghost btn-sm">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {stats?.upcomingTasks?.length > 0 ? (
            <div className="upcoming-list">
              {stats.upcomingTasks.map(task => (
                <div key={task.id} className="upcoming-item">
                  <div className={`priority-dot ${task.priority}`} />
                  <div className="upcoming-info">
                    <div className="upcoming-title">{task.title}</div>
                    {task.project && <div className="upcoming-project">{task.project.name}</div>}
                  </div>
                  <div className="upcoming-due">
                    {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '32px 0' }}>
              <div className="empty-state-icon">🎯</div>
              <p>No upcoming tasks this week</p>
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="recent-activity glass-card">
          <div className="section-header">
            <h3 className="chart-title">Recent Activity</h3>
          </div>
          {stats?.recentActivity?.length > 0 ? (
            <div className="activity-list">
              {stats.recentActivity.slice(0, 8).map(task => (
                <div key={task.id} className="activity-item">
                  <div className={`activity-status badge badge-${task.status}`}>
                    {task.status.replace('_', ' ')}
                  </div>
                  <div className="activity-title">{task.title}</div>
                  <div className="activity-time">
                    {new Date(task.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '32px 0' }}>
              <div className="empty-state-icon">📋</div>
              <p>No recent activity</p>
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="quick-links glass-card">
          <h3 className="chart-title" style={{ marginBottom: 16 }}>Quick Actions</h3>
          {[
            { icon: '✅', label: 'New Task', path: '/tasks?new=1', color: '#6366f1' },
            { icon: '📁', label: 'New Project', path: '/projects?new=1', color: '#8b5cf6' },
            { icon: '📝', label: 'New Note', path: '/notes?new=1', color: '#06b6d4' },
            { icon: '🤖', label: 'Ask AI', path: '/ai', color: '#10b981' },
            { icon: '📅', label: 'Calendar', path: '/calendar', color: '#f59e0b' },
            { icon: '📚', label: 'Knowledge', path: '/knowledge', color: '#ec4899' },
          ].map((link, i) => (
            <Link key={i} to={link.path} className="quick-link">
              <div className="quick-link-icon" style={{ background: link.color + '22' }}>
                {link.icon}
              </div>
              <span>{link.label}</span>
              <ArrowRight size={14} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
