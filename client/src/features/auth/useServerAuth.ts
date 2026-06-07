import { useCallback, useEffect, useRef, useState } from "react";
import {
  loadServerAuthStatus,
  loginServerOwner,
  logoutServerOwner,
  SERVER_AUTH_REQUIRED_EVENT,
  setupServerOwner,
  type ServerAuthUser,
} from "./authApi";

export type ServerAuthPhase =
  | "checking"
  | "setup"
  | "locked"
  | "authenticated"
  | "error";

export type ServerAuthError =
  | "invalidCredentials"
  | "serverUnavailable"
  | "setupFailed";

export function useServerAuth() {
  const [phase, setPhase] = useState<ServerAuthPhase>("checking");
  const [user, setUser] = useState<ServerAuthUser | null>(null);
  const [error, setError] = useState<ServerAuthError | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [isRequired, setIsRequired] = useState(false);
  const authSecretRef = useRef<string | null>(null);
  const [authSecretVersion, setAuthSecretVersion] = useState(0);

  const refresh = useCallback(async () => {
    setIsBusy(true);
    setError(null);

    try {
      const status = await loadServerAuthStatus();

      setIsRequired(status.auth_required);

      if (!status.auth_required) {
        setUser(null);
        authSecretRef.current = null;
        setPhase("authenticated");
        return;
      }

      if (status.authenticated && status.user) {
        setUser(status.user);
        setPhase("authenticated");
        return;
      }

      setUser(null);
      authSecretRef.current = null;
      setPhase(status.setup_required ? "setup" : "locked");
    } catch {
      setUser(null);
      authSecretRef.current = null;
      setIsRequired(false);
      setPhase("authenticated");
      setError("serverUnavailable");
    } finally {
      setIsBusy(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    function handleAuthRequired() {
      void refresh();
    }

    window.addEventListener(SERVER_AUTH_REQUIRED_EVENT, handleAuthRequired);

    return () => {
      window.removeEventListener(SERVER_AUTH_REQUIRED_EVENT, handleAuthRequired);
    };
  }, [refresh]);

  async function setup(input: { username: string; password: string }) {
    setIsBusy(true);
    setError(null);

    try {
      const response = await setupServerOwner(input);

      authSecretRef.current = input.password;
      setAuthSecretVersion((version) => version + 1);
      setUser(response.user);
      setPhase("authenticated");
    } catch {
      setError("setupFailed");
    } finally {
      setIsBusy(false);
    }
  }

  async function login(input: { username: string; password: string }) {
    setIsBusy(true);
    setError(null);

    try {
      const response = await loginServerOwner(input);

      authSecretRef.current = input.password;
      setAuthSecretVersion((version) => version + 1);
      setUser(response.user);
      setPhase("authenticated");
    } catch {
      setError("invalidCredentials");
    } finally {
      setIsBusy(false);
    }
  }

  async function lock() {
    if (!isRequired) {
      authSecretRef.current = null;
      return;
    }

    setIsBusy(true);
    setError(null);

    try {
      await logoutServerOwner();
    } catch {
      // Local lock should still happen even if the session was already gone.
    } finally {
      authSecretRef.current = null;
      setUser(null);
      setPhase("locked");
      setIsBusy(false);
    }
  }

  const consumeAuthSecret = useCallback(() => {
    const secret = authSecretRef.current;

    authSecretRef.current = null;

    return secret;
  }, []);

  return {
    authSecretVersion,
    consumeAuthSecret,
    error,
    isRequired,
    isBusy,
    lock,
    login,
    phase,
    refresh,
    setup,
    user,
  };
}
