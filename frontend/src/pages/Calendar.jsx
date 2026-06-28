import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';
import { ChevronLeft, ChevronRight, Calendar as CalIcon } from 'lucide-react';
import './Calendar.css';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const PRIORITY_COLORS = { low: '#64748b', medium: '#f59e0b', high: '#ef4444', urgent: '#ff3333' };

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [loading, setLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    setLoading(true);
    dashboardAPI.getCalendar({ month, year })
      .then(res => setEvents(res.events || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [month, year]);

  const getDaysInMonth = () => {
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const days = [];

    for (let i = 0; i < first.getDay(); i++) {
      const d = new Date(year, month, -i);
      days.unshift({ date: d, current: false });
    }

    for (let i = 1; i <= last.getDate(); i++) {
      days.push({ date: new Date(year, month, i), current: true });
    }

    while (days.length % 7 !== 0) {
      const d = new Date(year, month + 1, days.length - last.getDate() - first.getDay() + 1);
      days.push({ date: d, current: false });
    }

    return days;
  };

  const getTasksForDay = (date) => {
    return events.filter(e => {
      const d = new Date(e.dueDate);
      return d.getDate() === date.getDate() && d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
    });
  };

  const isToday = (date) => {
    const t = new Date();
    return date.getDate() === t.getDate() && date.getMonth() === t.getMonth() && date.getFullYear() === t.getFullYear();
  };

  const days = getDaysInMonth();
  const selectedDayTasks = selectedDay ? getTasksForDay(selectedDay) : [];

  return (
    <div className="calendar-page page-enter">
      <div className="calendar-layout">
        <div className="calendar-main glass-card">
          {/* Navigation */}
          <div className="cal-header">
            <button className="btn btn-ghost btn-icon" onClick={() => setCurrentDate(new Date(year, month - 1))}>
              <ChevronLeft size={18} />
            </button>
            <div className="cal-title">
              <span className="cal-month">{MONTHS[month]}</span>
              <span className="cal-year">{year}</span>
            </div>
            <button className="btn btn-ghost btn-icon" onClick={() => setCurrentDate(new Date(year, month + 1))}>
              <ChevronRight size={18} />
            </button>
            <button className="btn btn-ghost btn-sm" style={{ marginLeft: 12 }} onClick={() => setCurrentDate(new Date())}>
              Today
            </button>
          </div>

          {/* Day headers */}
          <div className="cal-day-headers">
            {DAYS.map(d => <div key={d} className="cal-day-header">{d}</div>)}
          </div>

          {/* Grid */}
          <div className="cal-grid">
            {days.map((day, i) => {
              const dayTasks = getTasksForDay(day.date);
              const isSelected = selectedDay && day.date.toDateString() === selectedDay.toDateString();
              return (
                <div
                  key={i}
                  className={`cal-day ${!day.current ? 'other-month' : ''} ${isToday(day.date) ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedDay(day.date)}
                >
                  <div className="cal-day-number">{day.date.getDate()}</div>
                  <div className="cal-day-events">
                    {dayTasks.slice(0, 3).map((task, j) => (
                      <div key={j} className="cal-event" style={{ background: PRIORITY_COLORS[task.priority] + '30', borderLeft: `2px solid ${PRIORITY_COLORS[task.priority]}` }}>
                        {task.title}
                      </div>
                    ))}
                    {dayTasks.length > 3 && (
                      <div className="cal-more">+{dayTasks.length - 3} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="calendar-sidebar">
          <div className="glass-card cal-sidebar-card">
            <div className="cal-sidebar-header">
              <CalIcon size={16} />
              {selectedDay ? (
                <span>{selectedDay.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
              ) : (
                <span>Select a day</span>
              )}
            </div>

            {selectedDay && (
              <>
                {selectedDayTasks.length > 0 ? (
                  <div className="cal-task-list">
                    {selectedDayTasks.map(task => (
                      <div key={task.id} className="cal-task-item">
                        <div className="priority-dot" style={{ background: PRIORITY_COLORS[task.priority], flexShrink: 0 }} />
                        <div className="cal-task-info">
                          <div className="cal-task-title">{task.title}</div>
                          {task.project && <div className="cal-task-project">{task.project.name}</div>}
                        </div>
                        <span className={`badge badge-${task.status}`}>{task.status.replace('_',' ')}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state" style={{ padding: '32px 0' }}>
                    <div style={{ fontSize: 32 }}>🎉</div>
                    <p style={{ marginTop: 8, fontSize: 13 }}>No tasks due this day</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Monthly summary */}
          <div className="glass-card cal-sidebar-card">
            <div className="cal-sidebar-header">
              <span>This Month</span>
            </div>
            <div className="month-stats">
              <div className="month-stat">
                <div className="month-stat-value">{events.length}</div>
                <div className="month-stat-label">Total tasks due</div>
              </div>
              <div className="month-stat">
                <div className="month-stat-value" style={{ color: 'var(--accent-success)' }}>
                  {events.filter(e => e.status === 'completed').length}
                </div>
                <div className="month-stat-label">Completed</div>
              </div>
              <div className="month-stat">
                <div className="month-stat-value" style={{ color: 'var(--accent-danger)' }}>
                  {events.filter(e => e.status !== 'completed' && new Date(e.dueDate) < new Date()).length}
                </div>
                <div className="month-stat-label">Overdue</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
