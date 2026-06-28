import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import './Layout.css';

export default function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="layout">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className={`layout-main ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <Header />
        <main className="layout-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
