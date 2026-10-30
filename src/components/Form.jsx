import { useId } from 'react';

export function Field({ label, hint, required, children, wide }) {
  const id = useId();
  return (
    <div className={`field${wide ? ' field--wide' : ''}`}>
      <label htmlFor={id} className="field__label">
        {label}
        {required && <span className="field__required"> *</span>}
      </label>
      {children(id)}
      {hint && <p className="field__hint">{hint}</p>}
    </div>
  );
}

export function TextInput({ label, hint, required, value, onChange, placeholder, wide, type = 'text' }) {
  return (
    <Field label={label} hint={hint} required={required} wide={wide}>
      {(id) => (
        <input
          id={id}
          type={type}
          className="input"
          value={value}
          placeholder={placeholder}
          required={required}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </Field>
  );
}

export function TextArea({ label, hint, value, onChange, placeholder, rows = 4 }) {
  return (
    <Field label={label} hint={hint} wide>
      {(id) => (
        <textarea
          id={id}
          className="input input--area"
          rows={rows}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </Field>
  );
}

export function Select({ label, hint, value, onChange, options, wide }) {
  return (
    <Field label={label} hint={hint} wide={wide}>
      {(id) => (
        <select id={id} className="input" value={value} onChange={(e) => onChange(e.target.value)}>
          {options.map((option) => {
            const { value: v, label: l } = typeof option === 'string' ? { value: option, label: option } : option;
            return (
              <option key={v} value={v}>
                {l}
              </option>
            );
          })}
        </select>
      )}
    </Field>
  );
}

export function CheckboxGroup({ label, options, value, onChange }) {
  const toggle = (option) =>
    onChange(value.includes(option) ? value.filter((v) => v !== option) : [...value, option]);
  return (
    <fieldset className="field field--wide">
      <legend className="field__label">{label}</legend>
      <div className="checks">
        {options.map((option) => (
          <label key={option} className="check">
            <input type="checkbox" checked={value.includes(option)} onChange={() => toggle(option)} />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function Toggle({ label, hint, checked, onChange }) {
  return (
    <div className="field field--wide">
      <label className="check check--plain">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span>
          <span className="field__label">{label}</span>
          {hint && <span className="field__hint field__hint--inline">{hint}</span>}
        </span>
      </label>
    </div>
  );
}
