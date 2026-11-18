import { timingSafeEqual } from "node:crypto";

function unauthorized(res) {
  return res.status(401).json({
    error: {
      code: "AUTHENTICATION_REQUIRED",
      message: "A valid Raazia session is required.",
    },
  });
}

export function createMockRaaziaAuthentication({ token, environment = process.env.NODE_ENV } = {}) {
  return function mockRaaziaAuthentication(req, res, next) {
    const configuredToken = token ?? process.env.DEV_RAAZIA_TOKEN;
    if (environment === "production" || !configuredToken) {
      return unauthorized(res);
    }

    const authorization = req.get("authorization") ?? "";
    const suppliedToken = authorization.startsWith("Bearer ")
      ? authorization.slice("Bearer ".length)
      : "";
    const supplied = Buffer.from(suppliedToken);
    const expected = Buffer.from(configuredToken);

    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
      return unauthorized(res);
    }

    req.authenticatedUser = Object.freeze({ id: "local-raazia", role: "RAAZIA" });
    return next();
  };
}

export const authenticateRequest = createMockRaaziaAuthentication();
