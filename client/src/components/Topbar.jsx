const Topbar = ({ title, onMenuClick, onLogout, user }) => (
  <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onMenuClick}
        className="inline-flex rounded-2xl border border-app-border px-3 py-2 text-sm font-semibold text-app-black lg:hidden"
      >
        Menu
      </button>
      <div>
        <p className="text-sm font-medium text-app-muted">Welcome back</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-app-black">{title}</h1>
      </div>
    </div>

    <div className="flex items-center gap-3">
      <div className="rounded-2xl border border-app-border px-4 py-3">
        <p className="text-xs uppercase tracking-[0.25em] text-app-muted">Today</p>
        <p className="mt-1 text-sm font-semibold text-app-black">
          {new Intl.DateTimeFormat('en-IN', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }).format(new Date())}
        </p>
      </div>
      <div className="rounded-2xl bg-app-soft px-4 py-3">
        <p className="text-xs uppercase tracking-[0.25em] text-app-muted">Logged in</p>
        <p className="mt-1 text-sm font-semibold text-app-black">{user.role}</p>
      </div>
      <button type="button" onClick={onLogout} className="btn-secondary">
        Sign out
      </button>
    </div>
  </header>
);

export default Topbar;
