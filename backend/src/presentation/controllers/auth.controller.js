import { z } from "zod";
import repository from "../../data-access/repositories/index.ts";

const customerRegistrationSchema = z.object({
  displayName: z.string().trim().min(1, "Display name is required."),
  email: z.string().trim().email("Provide a valid email address."),
  password: z.string().min(1, "Password is required."),
}).strict();

const emptyBodySchema = z.object({}).strict();
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const GENERIC_REGISTRATION_MESSAGE = "If this address can be used, follow any email confirmation instructions, then sign in to finish account setup. If no email arrives, submit the form again to retry.";

function controllerError(status, code, message) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function authEndpoint(supabaseUrl, path) {
  return `${supabaseUrl.replace(/\/$/, "")}/auth/v1/${path}`;
}

async function responseJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function isDuplicateIdentity(response, body) {
  const code = body?.code ?? body?.error_code;
  const message = typeof body?.message === "string" ? body.message : "";
  return (
    response.status === 409
    || ["email_exists", "user_already_exists", "user_already_registered"].includes(code)
    || /user already registered|email already exists/i.test(message)
  );
}

function createAuthController({
  userRepository = repository,
  fetchProvider = globalThis.fetch,
  supabaseUrl = process.env.SUPABASE_URL,
  publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY,
  serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY,
  frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:5173",
  logger = console,
} = {}) {
  function authConfigurationError() {
    return controllerError(
      503,
      "AUTH_PROVIDER_NOT_CONFIGURED",
      "Customer registration is temporarily unavailable.",
    );
  }

  async function sendSignupConfirmation(email) {
    const confirmationUrl = new URL("/sign-in", frontendUrl).toString();
    const resendUrl = new URL(authEndpoint(supabaseUrl, "resend"));
    resendUrl.searchParams.set("redirect_to", confirmationUrl);

    try {
      const response = await fetchProvider(resendUrl.toString(), {
        method: "POST",
        headers: {
          apikey: publishableKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email, type: "signup" }),
      });
      if (!response.ok) {
        logger.error("Supabase did not accept a Customer registration confirmation request.");
      }
    } catch {
      logger.error("Supabase could not send a Customer registration confirmation.");
    }
  }

  async function deleteNewAuthIdentity(id) {
    try {
      const response = await fetchProvider(
        authEndpoint(supabaseUrl, `admin/users/${encodeURIComponent(id)}`),
        {
          method: "DELETE",
          headers: {
            apikey: serviceRoleKey,
            Authorization: `Bearer ${serviceRoleKey}`,
            Accept: "application/json",
          },
        },
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  return {
    me: (req, res) => {
      const { id, email, displayName, role } = req.authenticatedUser;
      res.json({ user: { id, email, displayName, role } });
    },

    registerCustomer: async (req, res) => {
      const parsed = customerRegistrationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Provide a display name, valid email address, and password.",
          },
        });
      }

      if (!supabaseUrl || !publishableKey || !serviceRoleKey) {
        throw authConfigurationError();
      }

      let settingsResponse;
      try {
        settingsResponse = await fetchProvider(authEndpoint(supabaseUrl, "settings"), {
          headers: { apikey: publishableKey, Accept: "application/json" },
        });
      } catch {
        throw controllerError(
          503,
          "AUTH_PROVIDER_UNAVAILABLE",
          "Customer registration is temporarily unavailable.",
        );
      }

      const settings = await responseJson(settingsResponse);
      if (
        !settingsResponse.ok
        || typeof settings?.disable_signup !== "boolean"
        || typeof settings?.mailer_autoconfirm !== "boolean"
        || typeof settings?.external?.email !== "boolean"
      ) {
        throw controllerError(
          503,
          "AUTH_PROVIDER_UNAVAILABLE",
          "Customer registration is temporarily unavailable.",
        );
      }
      if (settings.disable_signup || !settings.external.email) {
        throw controllerError(
          403,
          "CUSTOMER_REGISTRATION_DISABLED",
          "Customer registration is unavailable.",
        );
      }

      const emailConfirmationRequired = !settings.mailer_autoconfirm;
      let createUserResponse;
      try {
        createUserResponse = await fetchProvider(authEndpoint(supabaseUrl, "admin/users"), {
          method: "POST",
          headers: {
            apikey: serviceRoleKey,
            Authorization: `Bearer ${serviceRoleKey}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            email: parsed.data.email,
            password: parsed.data.password,
            email_confirm: !emailConfirmationRequired,
            user_metadata: { display_name: parsed.data.displayName },
          }),
        });
      } catch {
        throw controllerError(
          503,
          "AUTH_PROVIDER_UNAVAILABLE",
          "Customer registration is temporarily unavailable.",
        );
      }

      const providerBody = await responseJson(createUserResponse);
      if (!createUserResponse.ok) {
        if (isDuplicateIdentity(createUserResponse, providerBody)) {
          if (emailConfirmationRequired) {
            let pendingIntent = null;
            try {
              pendingIntent = await userRepository.findPendingCustomerRegistrationByEmail(parsed.data.email);
            } catch {
              logger.error("Could not look up a pending Customer registration for confirmation retry.");
            }
            if (pendingIntent) await sendSignupConfirmation(pendingIntent.email);
          }
          return res.status(202).json({
            message: GENERIC_REGISTRATION_MESSAGE,
            emailConfirmationRequired,
          });
        }

        if (createUserResponse.status >= 500) {
          throw controllerError(
            503,
            "AUTH_PROVIDER_UNAVAILABLE",
            "Customer registration is temporarily unavailable.",
          );
        }
        return res.status(400).json({
          error: {
            code: "REGISTRATION_DETAILS_INVALID",
            message: "Registration details could not be accepted.",
          },
        });
      }

      const providerUser = providerBody?.user ?? providerBody;
      if (
        !providerUser
        || typeof providerUser.id !== "string"
        || !UUID_PATTERN.test(providerUser.id)
        || typeof providerUser.email !== "string"
        || !providerUser.email.trim()
      ) {
        const error = controllerError(
          503,
          "AUTH_PROVIDER_INVALID_RESPONSE",
          "Customer registration is temporarily unavailable.",
        );
        const createdId = providerUser?.id;
        if (typeof createdId === "string" && UUID_PATTERN.test(createdId)) {
          await deleteNewAuthIdentity(createdId);
        }
        throw error;
      }

      try {
        await userRepository.createCustomerRegistrationIntent({
          supabaseUserId: providerUser.id,
          email: providerUser.email.trim(),
          displayName: parsed.data.displayName,
        });
      } catch {
        const identityRemoved = await deleteNewAuthIdentity(providerUser.id);
        if (!identityRemoved) {
          logger.error("Could not remove a newly created Supabase identity after registration setup failed.");
        }
        throw controllerError(
          503,
          "CUSTOMER_REGISTRATION_SETUP_FAILED",
          "Customer registration could not be completed. Please try again.",
        );
      }

      if (emailConfirmationRequired) {
        await sendSignupConfirmation(providerUser.email.trim());
      }

      return res.status(202).json({
        message: GENERIC_REGISTRATION_MESSAGE,
        emailConfirmationRequired,
      });
    },

    activateCustomerRegistration: async (req, res) => {
      const identity = req.supabaseIdentity;
      if (!identity) {
        return res.status(401).json({
          error: {
            code: "AUTHENTICATION_REQUIRED",
            message: "A valid sign-in session is required.",
          },
        });
      }
      if (!identity.emailConfirmedAt) {
        return res.status(403).json({
          error: {
            code: "CUSTOMER_REGISTRATION_EMAIL_UNCONFIRMED",
            message: "Confirm your email before finishing Customer registration.",
          },
        });
      }

      const activation = await userRepository.activateCustomerRegistrationIntent({
        supabaseUserId: identity.id,
        email: identity.email,
        emailConfirmedAt: identity.emailConfirmedAt,
      });
      return res.json({ expiresAt: activation.expiresAt });
    },

    profile: async (req, res) => {
      const parsed = emptyBodySchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Profile completion does not accept identity, email, role, or display name.",
          },
        });
      }

      const identity = req.supabaseIdentity;
      if (!identity) {
        return res.status(401).json({
          error: {
            code: "AUTHENTICATION_REQUIRED",
            message: "A valid sign-in session is required.",
          },
        });
      }
      if (!identity.emailConfirmedAt) {
        return res.status(403).json({
          error: {
            code: "CUSTOMER_REGISTRATION_EMAIL_UNCONFIRMED",
            message: "Confirm your email before finishing Customer registration.",
          },
        });
      }

      const { user, created } = await userRepository.createCustomerProfileFromRegistrationIntent({
        supabaseUserId: identity.id,
        email: identity.email,
      });
      const status = created ? 201 : 200;
      return res.status(status).json({
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
        },
      });
    },
  };
}

export {
  createAuthController,
  customerRegistrationSchema,
  emptyBodySchema,
};
