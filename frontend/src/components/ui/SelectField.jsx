import React from "react";

export default function SelectField({
  id,
  label,
  value,
  onChange,
  options = [],
  placeholder = "Select an option",
  required = false,
  error,
  disabled = false,
  name,
}) {
  if (!id || !label) {
    throw new Error("SelectField requires both id and label.");
  }

  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="faro-field">
      <label className="faro-field__label" htmlFor={id}>
        {label}{required ? " *" : ""}
      </label>
      <select
        id={id}
        name={name}
        className="faro-field__control"
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      {error && <span id={errorId} className="faro-field__error" role="alert">{error}</span>}
    </div>
  );
}
