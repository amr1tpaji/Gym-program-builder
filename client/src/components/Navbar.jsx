import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <div className="navbar-logo">PB</div>
        <span className="navbar-title">Program Builder</span>
      </Link>
      <div className="navbar-links">
        <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Home</Link>
        <Link to="/knowledge" className={location.pathname === '/knowledge' ? 'active' : ''}>Knowledge Base</Link>
        <Link to="/create" className={location.pathname === '/create' ? 'active' : ''}>Create Program</Link>
        <Link to="/programs" className={location.pathname === '/programs' ? 'active' : ''}>My Programs</Link>
      </div>
    </nav>
  );
}
