import { useState } from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '../AuthContext';
import { Link } from 'react-router-dom';

export default function Layout({ children, title = 'Dashboard', headerRight }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  
  const [theme, setTheme] = useState(document.documentElement.getAttribute('data-theme') || 'light');

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
  };

  return (
    <div className="app">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="main" id="main">
        <header className="page-header">
          <div className="page-header-left">
            <button className="menu-toggle visible" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
              <svg className="icon"><use href="#i-menu" /></svg>
            </button>
            {/* 👇 THIS NOW DYNAMICALLY RENDERS THE TITLE 👇 */}
            <h1>{title}</h1>
          </div>
          
          <div className="page-header-right">
            {headerRight}

            <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle dark mode">
              <svg className="icon i-sun"><use href="#i-sun" /></svg>
              <svg className="icon i-moon"><use href="#i-moon" /></svg>
            </button>

            <div className="user-chip">
              <div className="user-chip-text">
                <div className="user-chip-name">{user?.display_name || user?.username}</div>
                <div className="user-chip-role">{user?.role}</div>
              </div>
              <div className="avatar">
                {(user?.display_name || user?.username || '?').substring(0, 2).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}