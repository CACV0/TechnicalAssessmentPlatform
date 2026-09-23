import { NavLink, Outlet } from 'react-router-dom';

export function Layout() {
  return (
    <div className="app">
      <header className="topbar">
        <NavLink to="/" className="brand">
          <span className="brand-logo">&lt;/&gt;</span>
          Technical Assessment Platform
        </NavLink>
        <nav className="nav">
          <NavLink to="/" end className="nav-link">
            Evaluaciones
          </NavLink>
          <NavLink to="/admin" className="nav-link">
            Administración
          </NavLink>
        </nav>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
