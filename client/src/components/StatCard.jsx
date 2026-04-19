const StatCard = ({ label, value, helper }) => (
  <div className="glass-panel p-5">
    <p className="text-sm font-medium text-app-muted">{label}</p>
    <p className="mt-3 text-3xl font-extrabold tracking-tight text-app-black">{value}</p>
    {helper ? <p className="mt-2 text-sm text-app-muted">{helper}</p> : null}
  </div>
);

export default StatCard;
