export function requireRole(role) {
  return function authorizeRole(req, res, next) {
    if (!req.authenticatedUser) {
      return res.status(401).json({
        error: {
          code: "AUTHENTICATION_REQUIRED",
          message: "Authentication is required.",
        },
      });
    }

    if (req.authenticatedUser.role !== role) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "This operation is not permitted for this account.",
        },
      });
    }

    return next();
  };
}

export const requireRaazia = requireRole("RAAZIA");
