export function errorHandler(err, _req, res, _next) {
  const statusCode = err?.status ?? err?.statusCode ?? 500;

  if (statusCode >= 500) {
    console.error("Unhandled backend error:", err);
  }

  res.status(statusCode).json({
    error: {
      code: err?.code ?? "INTERNAL_ERROR",
      message: statusCode >= 500 && statusCode !== 503
        ? "An unexpected error occurred."
        : err?.message ?? "An error occurred.",
    },
  });
}
