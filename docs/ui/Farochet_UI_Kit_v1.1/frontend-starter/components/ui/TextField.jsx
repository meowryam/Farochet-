import React from "react";

export default function TextField({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  helpText,
  error,
  disabled = false,
  name,
  autoComplete,
}) {
  if (!id || !label) {
    throw new Error("TextField requires both id and label.");
  }

  const helpId = helpText ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="faro-field">
      <label className="faro-field__label" htmlFor={id}>
        {label}{required ? " *" : ""}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        className="faro-field__control"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
      />
      {helpText && <span id={helpId} className="faro-field__help">{helpText}</span>}
      {error && <span id={errorId} className="faro-field__error" role="alert">{error}</span>}
    </div>
  );
}
