const FormField = ({
  label,
  error,
  as = 'input',
  options = [],
  className = '',
  ...props
}) => {
  let field = null;

  if (as === 'textarea') {
    field = <textarea className={`field-input min-h-28 ${className}`} {...props} />;
  } else if (as === 'select') {
    field = (
      <select className={`field-input ${className}`} {...props}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  } else {
    field = <input className={`field-input ${className}`} {...props} />;
  }

  return (
    <label className="block">
      <span className="field-label">{label}</span>
      {field}
      {error ? <span className="mt-2 block text-xs text-app-accent">{error}</span> : null}
    </label>
  );
};

export default FormField;
