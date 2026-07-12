import {
  csrfHeaders,
  jsonHeaders,
  SERVER_AUTH_REQUIRED_EVENT,
} from "../../shared/http/httpClient";

export { SERVER_AUTH_REQUIRED_EVENT };

export type ServerAuthUser = {
  id: number;
  username: string;
  role: "owner";
};

export type ServerAuthStatus = {
  auth_required: boolean;
  authenticated: boolean;
  setup_required: boolean;
  user: ServerAuthUser | null;
  csrf_token?: string;
};

type ServerAuthResponse = {
  user: ServerAuthUser;
  csrf_token: string;
};

type ServerAuthPayload = {
  username: string;
  password: string;
};

export async function loadServerAuthStatus() {
  const response = await fetch("/auth/me", { credentials: "same-origin" });
  if (!response.ok) throw new Error("Не удалось проверить вход");
  return (await response.json()) as ServerAuthStatus;
}

export async function setupServerOwner(payload: ServerAuthPayload) {
  const response = await fetch("/auth/setup", {
    method: "POST",
    credentials: "same-origin",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Не удалось настроить владельца: ${await response.text()}`);
  }
  return (await response.json()) as ServerAuthResponse;
}

export async function loginServerOwner(payload: ServerAuthPayload) {
  const response = await fetch("/auth/login", {
    method: "POST",
    credentials: "same-origin",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Не удалось войти: ${await response.text()}`);
  }
  return (await response.json()) as ServerAuthResponse;
}

export async function logoutServerOwner() {
  const response = await fetch("/auth/logout", {
    method: "POST",
    credentials: "same-origin",
    headers: csrfHeaders(),
  });
  if (!response.ok && response.status !== 401) {
    throw new Error(`Не удалось выйти: ${await response.text()}`);
  }
}
