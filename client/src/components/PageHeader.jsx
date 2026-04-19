const PageHeader = ({ title, subtitle, actions }) => (
  <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight text-app-black">{title}</h1>
      {subtitle ? <p className="mt-2 text-sm text-app-muted">{subtitle}</p> : null}
    </div>
    {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
  </div>
);

export default PageHeader;
