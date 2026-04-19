const Modal = ({ isOpen, title, description, onClose, children }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-8 backdrop-blur-sm">
      <div className="glass-panel max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-app-black">{title}</h3>
            {description ? <p className="mt-1 text-sm text-app-muted">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-app-border px-3 py-2 text-sm font-semibold text-app-muted transition hover:text-app-black"
          >
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default Modal;
