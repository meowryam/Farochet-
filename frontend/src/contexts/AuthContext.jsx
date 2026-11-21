import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  activateCustomerRegistration,
  completeCustomerProfile,
  getCurrentUser,
  registerCustomer,
} from "../services/api";
import { getSupabaseClient } from "../services/supabaseClient";

const AuthContext = createContext(null);

function getSignInErrorMessage(error) {
  const status = error?.status;
  const code = error?.code;
  const message = typeof error?.message === "string" ? error.message.toLowerCase() : "";

  if (code === "email_not_confirmed" || message.includes("email not confirmed")) {
    return "Confirm your email address before signing in.";
  }
  if (
    status === 400
    || code === "invalid_credentials"
    || message.includes("invalid login credentials")
  ) {
    return "Email or password is incorrect.";
  }
  if (status === 429) {
    return "Too many sign-in attempts. Please wait a moment and try again.";
  }
  if (
    (typeof status === "number" && status >= 500)
    || error?.name === "AuthRetryableFetchError"
    || error instanceof TypeError
  ) {
    return "The authentication service is temporarily unavailable. Check your connection and try again.";
  }
  return "Sign-in could not be completed. Please try again.";
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const profileRequest = useRef(0);

  const loadExistingProfile = useCallback(async (nextSession) => {
    try {
      return await getCurrentUser(nextSession.access_token);
    } catch (profileError) {
      if (profileError?.code !== "APPLICATION_PROFILE_REQUIRED") throw profileError;

      const error = new Error(
        "This account does not have a Farochet profile yet. If you just registered as a Customer, use the registration completion link; otherwise contact Raazia for authorized setup.",
      );
      error.code = profileError.code;
      throw error;
    }
  }, []);

  const saveProfileForSession = useCallback((nextSession, profile) => {
    profileRequest.current += 1;
    setSession(nextSession);
    setUser(profile);
    setError("");
    setLoading(false);
  }, []);

  const syncProfile = useCallback(async (nextSession) => {
    const requestId = ++profileRequest.current;
    setSession(nextSession);
    setError("");

    if (!nextSession) {
      setUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const profile = await loadExistingProfile(nextSession);
      if (requestId === profileRequest.current) setUser(profile);
    } catch (profileError) {
      if (requestId === profileRequest.current) {
        setUser(null);
        setError(profileError instanceof Error ? profileError.message : "Could not load the account profile.");
      }
    } finally {
      if (requestId === profileRequest.current) setLoading(false);
    }
  }, [loadExistingProfile]);

  useEffect(() => {
    let active = true;
    let client;

    try {
      client = getSupabaseClient();
    } catch (configurationError) {
      setError(configurationError.message);
      setLoading(false);
      return undefined;
    }

    const { data: { subscription } } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (active) queueMicrotask(() => {
        if (active) void syncProfile(nextSession);
      });
    });

    client.auth.getSession()
      .then(({ data, error: sessionError }) => {
        if (sessionError) throw sessionError;
        if (active) void syncProfile(data.session);
      })
      .catch((sessionError) => {
        if (active) {
          setError(sessionError instanceof Error ? sessionError.message : "Could not restore the sign-in session.");
          setLoading(false);
        }
      });

    return () => {
      active = false;
      profileRequest.current += 1;
      subscription.unsubscribe();
    };
  }, [syncProfile]);

  const signIn = useCallback(async ({ email, password }) => {
    const client = getSupabaseClient();
    const { data, error: signInError } = await client.auth.signInWithPassword({ email, password });
    if (signInError) throw new Error(getSignInErrorMessage(signInError));
    if (!data.session) throw new Error("Supabase did not return a sign-in session.");
    try {
      return await loadExistingProfile(data.session);
    } catch (profileError) {
      if (profileError?.code !== "APPLICATION_PROFILE_REQUIRED") throw profileError;

      await activateCustomerRegistration(data.session.access_token);
      const profile = await completeCustomerProfile(data.session.access_token);
      saveProfileForSession(data.session, profile);
      return profile;
    }
  }, [loadExistingProfile, saveProfileForSession]);

  const signUp = useCallback(async ({ displayName, email, password }) => {
    return registerCustomer({
      displayName: displayName.trim(),
      email: email.trim(),
      password,
    });
  }, []);

  const completeCustomerRegistration = useCallback(async ({ email, password }) => {
    const client = getSupabaseClient();
    const { data, error: signInError } = await client.auth.signInWithPassword({ email, password });
    if (signInError) throw new Error(getSignInErrorMessage(signInError));
    if (!data.session) throw new Error("Supabase did not return a sign-in session.");

    await activateCustomerRegistration(data.session.access_token);
    const userProfile = await completeCustomerProfile(data.session.access_token);
    saveProfileForSession(data.session, userProfile);
    return userProfile;
  }, [saveProfileForSession]);

  const completePendingRegistration = useCallback(async (nextSession) => {
    const client = getSupabaseClient();
    const sessionToUse = nextSession ?? (await client.auth.getSession()).data.session;
    if (!sessionToUse?.access_token) {
      throw new Error("A valid confirmation session was not found. Sign in again or request registration again.");
    }

    await activateCustomerRegistration(sessionToUse.access_token);
    const profile = await completeCustomerProfile(sessionToUse.access_token);
    saveProfileForSession(sessionToUse, profile);
    return profile;
  }, [saveProfileForSession]);

  const signOut = useCallback(async () => {
    const client = getSupabaseClient();
    const { error: signOutError } = await client.auth.signOut();
    if (signOutError) throw signOutError;
  }, []);

  return (
    <AuthContext.Provider value={{
      session,
      user,
      loading,
      error,
      signIn,
      signUp,
      completeCustomerRegistration,
      completePendingRegistration,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}
