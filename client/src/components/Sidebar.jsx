import { NavLink } from 'react-router-dom';
import StatusBadge from './StatusBadge';

const Sidebar = ({ navItems, user, mobileOpen, onClose }) => (
  <>
    {mobileOpen ? (
      <button
        type="button"
        aria-label="Close sidebar"
        className="fixed inset-0 z-30 bg-black/25 lg:hidden"
        onClick={onClose}
      />
    ) : null}
    <aside
      className={`fixed left-0 top-0 z-40 flex h-screen w-72 flex-col border-r border-app-border bg-white px-5 py-6 transition-transform duration-300 lg:translate-x-0 ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="rounded-3xl bg-app-soft p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-app-accent">HMS</p>
        <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-app-black">
          Careboard Suite
        </h2>
        <p className="mt-2 text-sm text-app-muted">Modern hospital operations in one clean workspace.</p>
      </div>

      <div className="mt-6 rounded-3xl border border-app-border p-4">
        <p className="text-sm font-semibold text-app-black">{user.profile?.name || user.email}</p>
        <p className="mt-1 text-xs text-app-muted">{user.email}</p>
        <div className="mt-3">
          <StatusBadge value={user.role} />
        </div>
      </div>

      <nav className="mt-6 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                isActive
                  ? 'bg-app-accent text-white shadow-card'
                  : 'text-app-muted hover:bg-app-soft hover:text-app-black'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  </>
);

export default Sidebar;
