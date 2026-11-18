import React from "react";

/** Shared Farochet button. Keep business decisions in the owning feature/controller. */
export default function Button({
  children,
  variant = "primary",
  size = "md",
  type = "button",
  disabled = false,
  loading = false,
  fullWidth = false,
  admin = false,
  onClick,
  className = "",
  ...rest
}) {
  const classes = [
    "faro-button",
    `faro-button--${variant}`,
    `faro-button--${size}`,
    fullWidth ? "faro-button--full" : "",
    admin ? "faro-button--admin" : "",
    className,
  ].filter(Boolean).join(" ");

  return (
    <button
      className={classes}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      onClick={onClick}
      {...rest}
    >
      {loading ? "Please wait…" : children}
    </button>
  );
}
