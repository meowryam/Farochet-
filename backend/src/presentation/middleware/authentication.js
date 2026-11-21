import repository from "../../data-access/repositories/index.js";

function unauthorized(res) {
  return res.status(401).json({
    error: {
      code: "AUTHENTICATION_REQUIRED",
      message: "A valid sign-in session is required.",
    },
  });
}

function authenticationError(message, status, code) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function verifySupabaseIdentity(req, res, next, {
  supabaseUrl = process.env.SUPABASE_URL,
  publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY,
  fetchUser = globalThis.fetch,
} = {}) {
  const authorization = req.get("authorization") ?? "";
  const match = /^Bearer\s+(\S+)$/i.exec(authorization);
  if (!match) {
    unauthorized(res);
    return false;
  }

  if (!supabaseUrl || !publishableKey) {
    next(authenticationError(
      "Supabase authentication is not configured.",
      503,
      "AUTH_PROVIDER_NOT_CONFIGURED",
    ));
    return false;
  }

  let response;
  try {
    response = await fetchUser(`${supabaseUrl.replace(/\/$/, "")}/auth/v1/user`, {
      headers: {
        apikey: publishableKey,
        Authorization: `Bearer ${match[1]}`,
        Accept: "application/json",
      },
    });
  } catch {
    next(authenticationError(
      "The authentication provider could not verify this session.",
      503,
      "AUTH_PROVIDER_UNAVAILABLE",
    ));
    return false;
  }

  if (response.status === 401 || response.status === 403) {
    unauthorized(res);
    return false;
  }

  if (!response.ok) {
    next(authenticationError(
      "The authentication provider could not verify this session.",
      503,
      "AUTH_PROVIDER_UNAVAILABLE",
    ));
    return false;
  }

  let identity;
  try {
    identity = await response.json();
  } catch {
    next(authenticationError(
      "The authentication provider returned an invalid response.",
      503,
      "AUTH_PROVIDER_INVALID_RESPONSE",
    ));
    return false;
  }
  if (
    !identity
    || typeof identity.id !== "string"
    || !UUID_PATTERN.test(identity.id)
    || typeof identity.email !== "string"
    || !identity.email.trim()
  ) {
    unauthorized(res);
    return false;
  }

  const emailConfirmedAt = (
    typeof identity.email_confirmed_at === "string"
    && !Number.isNaN(Date.parse(identity.email_confirmed_at))
  )
    ? identity.email_confirmed_at
    : null;

  req.supabaseIdentity = Object.freeze({
    id: identity.id,
    email: identity.email.trim(),
    emailConfirmedAt,
  });
  return true;
}

export function createSupabaseIdentityVerification(options = {}) {
  return async function verifyIdentityRequest(req, res, next) {
    if (!await verifySupabaseIdentity(req, res, next, options)) return;
    return next();
  };
}

export function createSupabaseAuthentication({
  userRepository = repository,
  ...identityOptions
} = {}) {
  return async function authenticateWithSupabase(req, res, next) {
    if (!await verifySupabaseIdentity(req, res, next, identityOptions)) return;

    const user = await userRepository.findUserById(req.supabaseIdentity.id);
    if (!user || (user.role !== "RAAZIA" && user.role !== "CUSTOMER")) {
      return res.status(403).json({
        error: {
          code: "APPLICATION_PROFILE_REQUIRED",
          message: "This account is not configured for application access.",
        },
      });
    }

    req.authenticatedUser = Object.freeze({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
    });

    return next();
  };
}

export const authenticateRequest = createSupabaseAuthentication();
