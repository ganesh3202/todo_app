import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout/Layout';
import Dashboard     from './pages/Dashboard';
import Tasks         from './pages/Tasks';
import Projects      from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Kanban        from './pages/Kanban';
import CalendarPage  from './pages/Calendar';
import Notes         from './pages/Notes';
import Documents     from './pages/Documents';
import AIAssistant   from './pages/AI';
import Profile       from './pages/Profile';
import { Login, Register } from './pages/Auth';
import './styles/globals.css';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center',
      justifyContent:'center', background:'var(--bg-primary)' }}>
      <div style={{ textAlign:'center' }}>
        <div className="spinner" style={{ width:40, height:40, borderWidth:3, margin:'0 auto 16px' }} />
        <div style={{ color:'var(--text-muted)', fontSize:14 }}>Loading TaskFlow…</div>
      </div>
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background:   'var(--bg-secondary)',
                color:        'var(--text-primary)',
                border:       '1px solid var(--border-color)',
                borderRadius: '12px',
                fontSize:     '14px',
                boxShadow:    'var(--shadow-lg)',
              },
              success: { iconTheme: { primary: '#10b981', secondary: 'white' } },
              error:   { iconTheme: { primary: '#ef4444', secondary: 'white' } },
            }}
          />
          <Routes>
            {/* Public */}
            <Route path="/login"    element={<PublicRoute><Login    /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
            <Route path="/"         element={<Navigate to="/dashboard" replace />} />

            {/* Protected */}
            <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
              <Route path="/dashboard"        element={<Dashboard />} />
              <Route path="/tasks"            element={<Tasks />} />
              <Route path="/projects"         element={<Projects />} />
              <Route path="/projects/:id"     element={<ProjectDetail />} />
              <Route path="/kanban"           element={<Kanban />} />
              <Route path="/calendar"         element={<CalendarPage />} />
              <Route path="/notes"            element={<Notes />} />
              <Route path="/knowledge"        element={<Notes isKnowledge={true} />} />
              <Route path="/documents"        element={<Documents />} />
              <Route path="/ai"               element={<AIAssistant />} />
              <Route path="/profile"          element={<Profile />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
