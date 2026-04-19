const palette = {
  scheduled: 'bg-app-accent/10 text-app-accent',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-zinc-100 text-zinc-700',
  paid: 'bg-emerald-100 text-emerald-700',
  unpaid: 'bg-amber-100 text-amber-700',
  admin: 'bg-black text-white',
  doctor: 'bg-app-accent/10 text-app-accent',
  patient: 'bg-sky-100 text-sky-700',
};

const StatusBadge = ({ value }) => (
  <span
    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${
      palette[value] || 'bg-zinc-100 text-zinc-700'
    }`}
  >
    {String(value || 'unknown').replace('_', ' ')}
  </span>
);

export default StatusBadge;
