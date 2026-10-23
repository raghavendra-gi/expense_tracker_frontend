import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isApprover = user?.role === 'head' || user?.role === 'hr';

  const handleLogout = (e) => {
    e.preventDefault();
    logout();
    navigate('/login');
  };

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={onClose}></div>
      <nav className={`sidebar ${isOpen ? 'open' : ''}`} id="sidebar" aria-label="Main navigation">
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <h2 id="sidebarTitle">{isApprover ? 'Approver Panel' : 'Employee Panel'}</h2>
          </div>
          <button className="icon-btn sidebar-close" onClick={onClose} aria-label="Close menu">
            <svg className="icon" aria-hidden="true"><use href="#i-close" /></svg>
          </button>
        </div>

        <ul className="sidebar-menu" id="sidebarMenu">
          {/* Dashboard — approver goes to /dashboard, employee goes to /my */}
          <li>
            <Link to={isApprover ? '/dashboard' : '/my'} onClick={onClose}>
              <svg className="icon"><use href="#i-dashboard" /></svg> My Dashboard
            </Link>
          </li>

          {/* Submit expense — ONLY for employees */}
          {!isApprover && (
            <li>
              <Link to="/new" onClick={onClose}>
                <svg className="icon"><use href="#i-plus" /></svg> Submit expense
              </Link>
            </li>
          )}

          {/* View expenses — for everyone */}
          <li>
            <Link to="/expenses" onClick={onClose}>
              <svg className="icon"><use href="#i-list" /></svg> View expenses
            </Link>
          </li>

          {/* Sign out */}
          <li>
            <a href="#" onClick={handleLogout}>
              <svg className="icon"><use href="#i-logout" /></svg> Sign out
            </a>
          </li>
        </ul>
      </nav>
    </>
  );
}