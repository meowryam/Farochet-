import express from "express";
import { describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createAuthRoutes } from "../src/presentation/routes/auth.routes.js";
import { requireRaazia } from "../src/presentation/middleware/authorizeRole.js";
import {
  createSupabaseAuthentication,
  createSupabaseIdentityVerification,
} from "../src/presentation/middleware/authentication.js";
import { errorHandler } from "../src/presentation/middleware/errorHandler.js";

const userId = "22f3d9b2-6f10-4f3f-933a-0b9042d90cf8";

function createTestApp({ userRepository, fetchUser, authControllerOptions = {} }) {
  const identityOptions = {
    supabaseUrl: "https://project.supabase.co",
    publishableKey: "sb_publishable_test",
    fetchUser,
  };
  const authenticate = createSupabaseAuthentication({ userRepository, ...identityOptions });
  const verifyIdentity = createSupabaseIdentityVerification(identityOptions);
  const app = express();

  app.use(express.json());
  app.use("/api/auth", createAuthRoutes({
    authenticate,
    verifyIdentity,
    userRepository,
    authControllerOptions,
  }));
  app.get("/api/admin/test", authenticate, requireRaazia, (_req, res) => {
    res.json({ ok: true });
  });
  app.use(errorHandler);

  return app;
}

function providerResponse(status, body = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() {
      return body;
    },
  };
}

function registrationProviderOptions(fetchProvider) {
  return {
    fetchProvider,
    supabaseUrl: "https://project.supabase.co",
    publishableKey: "sb_publishable_test",
    serviceRoleKey: "server-only-test-key",
    frontendUrl: "https://farochet.example",
    logger: { error: vi.fn() },
  };
}

const registrationDetails = {
  displayName: "New Customer",
  email: "new-customer@example.test",
  password: "example-test-password",
};

describe("Supabase authentication middleware", () => {
  it("requires a bearer access token and never treats the publishable key as identity", async () => {
    const fetchUser = vi.fn();
    const app = createTestApp({
      userRepository: { findUserById: vi.fn() },
      fetchUser,
    });

    await request(app)
      .get("/api/auth/me")
      .set("apikey", "sb_publishable_test")
      .expect(401);

    expect(fetchUser).not.toHaveBeenCalled();
  });

  it("verifies the supplied token with Supabase and uses the persisted role", async () => {
    const userRepository = {
      findUserById: vi.fn().mockResolvedValue({
        id: userId,
        email: "customer@example.test",
        displayName: "Customer",
        role: "CUSTOMER",
      }),
    };
    const fetchUser = vi.fn().mockResolvedValue(providerResponse(200, {
      id: userId,
      email: "customer@example.test",
      app_metadata: { role: "RAAZIA" },
    }));
    const app = createTestApp({ userRepository, fetchUser });

    await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer valid-access-token")
      .expect(200)
      .expect(({ body }) => {
        expect(body.user).toEqual({
          id: userId,
          email: "customer@example.test",
          displayName: "Customer",
          role: "CUSTOMER",
        });
      });

    expect(fetchUser).toHaveBeenCalledWith(
      "https://project.supabase.co/auth/v1/user",
      expect.objectContaining({
        headers: expect.objectContaining({
          apikey: "sb_publishable_test",
          Authorization: "Bearer valid-access-token",
        }),
      }),
    );
    expect(userRepository.findUserById).toHaveBeenCalledWith(userId);
    await request(app)
      .get("/api/admin/test")
      .set("Authorization", "Bearer valid-access-token")
      .expect(403);
  });

  it("allows a persisted Raazia profile to access Raazia-only routes", async () => {
    const userRepository = {
      findUserById: vi.fn().mockResolvedValue({
        id: userId,
        email: "raazia@example.test",
        displayName: "Raazia",
        role: "RAAZIA",
      }),
    };
    const fetchUser = vi.fn().mockResolvedValue(providerResponse(200, {
      id: userId,
      email: "raazia@example.test",
    }));
    const app = createTestApp({ userRepository, fetchUser });

    await request(app)
      .get("/api/admin/test")
      .set("Authorization", "Bearer valid-access-token")
      .expect(200)
      .expect({ ok: true });
  });

  it("rejects invalid tokens and verified identities without an application profile", async () => {
    const userRepository = { findUserById: vi.fn().mockResolvedValue(null) };
    const fetchUser = vi.fn()
      .mockResolvedValueOnce(providerResponse(401))
      .mockResolvedValueOnce(providerResponse(200, {
        id: userId,
        email: "customer@example.test",
      }));
    const app = createTestApp({ userRepository, fetchUser });

    await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer expired-access-token")
      .expect(401);
    await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer valid-access-token")
      .expect(403)
      .expect(({ body }) => {
        expect(body.error.code).toBe("APPLICATION_PROFILE_REQUIRED");
      });
  });

  it("completes profile creation from a verified identity and server-stored registration intent", async () => {
    const userRepository = {
      findUserById: vi.fn(),
      createCustomerProfileFromRegistrationIntent: vi.fn().mockResolvedValue({
        user: {
          id: userId,
          email: "customer@example.test",
          displayName: "Customer",
          role: "CUSTOMER",
        },
        created: true,
      }),
    };
    const fetchUser = vi.fn().mockResolvedValue(providerResponse(200, {
      id: userId,
      email: "customer@example.test",
      email_confirmed_at: "2026-11-21T10:00:00.000Z",
      app_metadata: { role: "RAAZIA" },
    }));
    const app = createTestApp({ userRepository, fetchUser });

    await request(app)
      .post("/api/auth/profile")
      .set("Authorization", "Bearer valid-access-token")
      .send({})
      .expect(201)
      .expect(({ body }) => {
        expect(body.user).toEqual({
          id: userId,
          email: "customer@example.test",
          displayName: "Customer",
          role: "CUSTOMER",
        });
      });

    expect(userRepository.createCustomerProfileFromRegistrationIntent).toHaveBeenCalledWith({
      supabaseUserId: userId,
      email: "customer@example.test",
    });
    expect(userRepository.findUserById).not.toHaveBeenCalled();
  });

  it("returns an existing profile unchanged and rejects client-controlled identity or role", async () => {
    const userRepository = {
      findUserById: vi.fn(),
      createCustomerProfileFromRegistrationIntent: vi.fn().mockResolvedValue({
        user: {
          id: userId,
          email: "raazia@example.test",
          displayName: "Raazia",
          role: "RAAZIA",
        },
        created: false,
      }),
    };
    const fetchUser = vi.fn().mockResolvedValue(providerResponse(200, {
      id: userId,
      email: "raazia@example.test",
      email_confirmed_at: "2026-11-21T10:00:00.000Z",
    }));
    const app = createTestApp({ userRepository, fetchUser });

    await request(app)
      .post("/api/auth/profile")
      .set("Authorization", "Bearer valid-access-token")
      .send({})
      .expect(200)
      .expect(({ body }) => {
        expect(body.user.role).toBe("RAAZIA");
        expect(body.user.displayName).toBe("Raazia");
      });

    await request(app)
      .post("/api/auth/profile")
      .set("Authorization", "Bearer valid-access-token")
      .send({
        id: "c8544f37-0d30-40fe-ad89-40f042278a19",
        email: "attacker@example.test",
        displayName: "Customer",
        role: "RAAZIA",
      })
      .expect(400);

    expect(userRepository.createCustomerProfileFromRegistrationIntent).toHaveBeenCalledTimes(1);
    expect(userRepository.findUserById).not.toHaveBeenCalled();
  });

  it("rejects profile provisioning without a verified identity or valid display name", async () => {
    const userRepository = {
      findUserById: vi.fn(),
      createCustomerProfileFromRegistrationIntent: vi.fn(),
    };
    const fetchUser = vi.fn()
      .mockResolvedValueOnce(providerResponse(401))
      .mockResolvedValueOnce(providerResponse(200, {
        id: userId,
        email: "customer@example.test",
      }));
    const app = createTestApp({ userRepository, fetchUser });

    await request(app)
      .post("/api/auth/profile")
      .send({})
      .expect(401);
    await request(app)
      .post("/api/auth/profile")
      .set("Authorization", "Bearer invalid-access-token")
      .send({ displayName: "Customer" })
      .expect(401);
    await request(app)
      .post("/api/auth/profile")
      .set("Authorization", "Bearer valid-access-token")
      .send({ id: userId, email: "customer@example.test", role: "RAAZIA" })
      .expect(400);

    expect(userRepository.createCustomerProfileFromRegistrationIntent).not.toHaveBeenCalled();
    expect(userRepository.findUserById).not.toHaveBeenCalled();
  });

  it("creates an intent only after Supabase Auth Admin creates a new identity", async () => {
    const userRepository = {
      createCustomerRegistrationIntent: vi.fn().mockResolvedValue({ id: "intent-id" }),
      findPendingCustomerRegistrationByEmail: vi.fn(),
      createCustomerProfileFromRegistrationIntent: vi.fn(),
    };
    const fetchProvider = vi.fn(async (url) => {
      if (url.endsWith("/settings")) {
        return providerResponse(200, {
          disable_signup: false,
          mailer_autoconfirm: false,
          external: { email: true },
        });
      }
      if (url.endsWith("/admin/users")) {
        return providerResponse(200, {
          id: userId,
          email: "verified@example.test",
        });
      }
      if (url.includes("/resend?")) return providerResponse(200, {});
      return providerResponse(404);
    });
    const app = createTestApp({
      userRepository,
      fetchUser: vi.fn(),
      authControllerOptions: registrationProviderOptions(fetchProvider),
    });

    await request(app)
      .post("/api/auth/register")
      .send(registrationDetails)
      .expect(202)
      .expect(({ body }) => {
        expect(body.emailConfirmationRequired).toBe(true);
        expect(body.message).toMatch(/sign in to finish account setup/i);
      });

    expect(fetchProvider).toHaveBeenCalledWith(
      "https://project.supabase.co/auth/v1/admin/users",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          apikey: "server-only-test-key",
          Authorization: "Bearer server-only-test-key",
        }),
        body: JSON.stringify({
          email: registrationDetails.email,
          password: registrationDetails.password,
          email_confirm: false,
          user_metadata: { display_name: "New Customer" },
        }),
      }),
    );
    expect(userRepository.createCustomerRegistrationIntent).toHaveBeenCalledWith({
      supabaseUserId: userId,
      email: "verified@example.test",
      displayName: "New Customer",
    });
    expect(userRepository.findPendingCustomerRegistrationByEmail).not.toHaveBeenCalled();

    const confirmationRequest = fetchProvider.mock.calls.find(([url]) => url.includes("/auth/v1/resend?"));
    expect(confirmationRequest[1]).toMatchObject({
      method: "POST",
      headers: {
        apikey: "sb_publishable_test",
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ email: "verified@example.test", type: "signup" }),
    });
  });

  it("does not create an intent for an existing RAAZIA identity and hides the duplicate result", async () => {
    const noIntent = Object.assign(new Error("No pending intent"), {
      status: 404,
      code: "CUSTOMER_REGISTRATION_INTENT_NOT_FOUND",
    });
    const userRepository = {
      createCustomerRegistrationIntent: vi.fn(),
      findPendingCustomerRegistrationByEmail: vi.fn().mockResolvedValue(null),
      activateCustomerRegistrationIntent: vi.fn().mockRejectedValue(noIntent),
      createCustomerProfileFromRegistrationIntent: vi.fn(),
    };
    const fetchProvider = vi.fn(async (url) => {
      if (url.endsWith("/settings")) {
        return providerResponse(200, {
          disable_signup: false,
          mailer_autoconfirm: false,
          external: { email: true },
        });
      }
      if (url.endsWith("/admin/users")) {
        return providerResponse(422, {
          code: "email_exists",
          message: "duplicate detail must not be returned",
        });
      }
      return providerResponse(404);
    });
    const fetchUser = vi.fn().mockResolvedValue(providerResponse(200, {
      id: userId,
      email: "raazia@example.test",
      email_confirmed_at: "2026-11-21T10:00:00.000Z",
    }));
    const app = createTestApp({
      userRepository,
      fetchUser,
      authControllerOptions: registrationProviderOptions(fetchProvider),
    });

    const duplicateResponse = await request(app)
      .post("/api/auth/register")
      .send({ ...registrationDetails, email: "raazia@example.test" })
      .expect(202);

    await request(app)
      .post("/api/auth/registration/activate")
      .set("Authorization", "Bearer valid-access-token")
      .send({})
      .expect(404);

    expect(duplicateResponse.body.message).not.toContain("duplicate detail");
    expect(userRepository.createCustomerRegistrationIntent).not.toHaveBeenCalled();
    expect(userRepository.createCustomerProfileFromRegistrationIntent).not.toHaveBeenCalled();
    expect(userRepository.activateCustomerRegistrationIntent).toHaveBeenCalledWith({
      supabaseUserId: userId,
      email: "raazia@example.test",
      emailConfirmedAt: "2026-11-21T10:00:00.000Z",
    });
  });

  it("respects Supabase email-confirmation settings without creating a profile at signup", async () => {
    const userRepository = {
      createCustomerRegistrationIntent: vi.fn().mockResolvedValue({ id: "intent-id" }),
      findPendingCustomerRegistrationByEmail: vi.fn(),
      createCustomerProfileFromRegistrationIntent: vi.fn(),
    };
    const fetchProvider = vi.fn(async (url) => {
      if (url.endsWith("/settings")) {
        return providerResponse(200, {
          disable_signup: false,
          mailer_autoconfirm: true,
          external: { email: true },
        });
      }
      if (url.endsWith("/admin/users")) {
        return providerResponse(200, { id: userId, email: registrationDetails.email });
      }
      return providerResponse(404);
    });
    const app = createTestApp({
      userRepository,
      fetchUser: vi.fn(),
      authControllerOptions: registrationProviderOptions(fetchProvider),
    });

    await request(app)
      .post("/api/auth/register")
      .send(registrationDetails)
      .expect(202)
      .expect(({ body }) => expect(body.emailConfirmationRequired).toBe(false));

    expect(userRepository.createCustomerRegistrationIntent).toHaveBeenCalledOnce();
    expect(userRepository.createCustomerProfileFromRegistrationIntent).not.toHaveBeenCalled();
    expect(fetchProvider.mock.calls.some(([url]) => url.includes("/resend"))).toBe(false);
  });

  it("activates registration only when the verified Supabase identity has a confirmed email", async () => {
    const userRepository = {
      findUserById: vi.fn(),
      activateCustomerRegistrationIntent: vi.fn().mockResolvedValue({
        expiresAt: new Date("2026-11-21T10:30:00.000Z"),
      }),
    };
    const fetchUser = vi.fn()
      .mockResolvedValueOnce(providerResponse(200, {
        id: userId,
        email: "customer@example.test",
      }))
      .mockResolvedValueOnce(providerResponse(200, {
        id: userId,
        email: "customer@example.test",
        email_confirmed_at: "2026-11-21T10:00:00.000Z",
      }));
    const app = createTestApp({ userRepository, fetchUser });

    await request(app)
      .post("/api/auth/registration/activate")
      .set("Authorization", "Bearer unconfirmed-access-token")
      .send({})
      .expect(403)
      .expect(({ body }) => {
        expect(body.error.code).toBe("CUSTOMER_REGISTRATION_EMAIL_UNCONFIRMED");
      });

    expect(userRepository.activateCustomerRegistrationIntent).not.toHaveBeenCalled();

    await request(app)
      .post("/api/auth/registration/activate")
      .set("Authorization", "Bearer confirmed-access-token")
      .send({})
      .expect(200);

    expect(userRepository.activateCustomerRegistrationIntent).toHaveBeenCalledWith({
      supabaseUserId: userId,
      email: "customer@example.test",
      emailConfirmedAt: "2026-11-21T10:00:00.000Z",
    });
  });

  it("returns a sanitized provider-unavailable error during signup", async () => {
    const app = createTestApp({
      userRepository: { createCustomerRegistrationIntent: vi.fn() },
      fetchUser: vi.fn(),
      authControllerOptions: registrationProviderOptions(
        vi.fn().mockRejectedValue(new Error("sensitive provider detail")),
      ),
    });

    await request(app)
      .post("/api/auth/register")
      .send(registrationDetails)
      .expect(503)
      .expect(({ body }) => {
        expect(body.error.code).toBe("AUTH_PROVIDER_UNAVAILABLE");
        expect(body.error.message).not.toContain("sensitive provider detail");
      });
  });

  it("does not turn Supabase outages into successful authentication", async () => {
    const app = createTestApp({
      userRepository: { findUserById: vi.fn() },
      fetchUser: vi.fn().mockResolvedValue(providerResponse(503)),
    });

    await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer valid-access-token")
      .expect(503);
  });

  it("rejects malformed or unavailable application identities", async () => {
    const userRepository = { findUserById: vi.fn() };
    const fetchUser = vi.fn()
      .mockResolvedValueOnce(providerResponse(200, { id: "client-controlled-id" }))
      .mockResolvedValueOnce(providerResponse(200, { id: userId }))
      .mockRejectedValueOnce(new Error("network unavailable"));
    const app = createTestApp({ userRepository, fetchUser });

    await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer valid-access-token")
      .expect(401);
    await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer valid-access-token")
      .expect(401);
    await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer valid-access-token")
      .expect(503);
    expect(userRepository.findUserById).not.toHaveBeenCalled();
  });
});
