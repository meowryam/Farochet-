import React from "react";

export default function TextArea({
  id,
  label,
  value,
  onChange,
  placeholder,
  required = false,
  rows = 5,
  helpText,
  error,
  disabled = false,
  name,
}) {
  if (!id || !label) {
    throw new Error("TextArea requires both id and label.");
  }

  const helpId = helpText ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="faro-field">
      <label className="faro-field__label" htmlFor={id}>
        {label}{required ? " *" : ""}
      </label>
      <textarea
        id={id}
        name={name}
        className="faro-field__control faro-textarea"
        rows={rows}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
      />
      {helpText && <span id={helpId} className="faro-field__help">{helpText}</span>}
      {error && <span id={errorId} className="faro-field__error" role="alert">{error}</span>}
    </div>
  );
}
