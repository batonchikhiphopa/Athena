import express from "express";
import { isServerAuthRequired } from "../../config/env.js";
import { loginSchema, setupOwnerSchema } from "./auth.schema.js";
import { getDb } from "../../db/sqlite.js";
import {
  CSRF_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  clearAuthCookies,
  readCookie,
  requireAuth,
  requireCsrf,
  setAuthCookies,
} from "./auth.middleware.js";
import {
  authenticateSessionToken,
  ensureCsrfToken,
  isFirstRunSetupRequired,
  login,
  logout,
  setupOwner,
} from "./auth.service.js";
import { sendValidationError } from "../../platform/http/http.js";

const router = express.Router();

router.get("/auth/me", async (req, res, next) => {
  try {
    if (!isServerAuthRequired()) {
      clearAuthCookies(res);

      return res.json({
        auth_required: false,
        authenticated: true,
        setup_required: false,
        user: null,
      });
    }

    const db = await getDb();
    const setupRequired = await isFirstRunSetupRequired(db);
    const sessionToken = readCookie(req, SESSION_COOKIE_NAME);
    const auth = await authenticateSessionToken(db, sessionToken);

    if (!auth) {
      return res.json({
        auth_required: true,
        authenticated: false,
        setup_required: setupRequired,
        user: null,
      });
    }

    const csrfToken = await ensureCsrfToken(
      db,
      auth,
      readCookie(req, CSRF_COOKIE_NAME),
    );

    setAuthCookies(res, {
      sessionToken: sessionToken!,
      csrfToken,
      expiresAt: auth.session.expires_at,
    });

    return res.json({
      auth_required: true,
      authenticated: true,
      setup_required: false,
      user: auth.user,
      csrf_token: csrfToken,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/auth/setup", async (req, res, next) => {
  if (!isServerAuthRequired()) {
    clearAuthCookies(res);

    return res.status(403).json({
      error: "Server authentication is disabled",
    });
  }

  const parsed = setupOwnerSchema.safeParse(req.body);

  if (!parsed.success) {
    return sendValidationError(
      res,
      "Не удалось обработать данные владельца",
      parsed.error,
    );
  }

  try {
    const db = await getDb();
    const created = await setupOwner(db, parsed.data);

    setAuthCookies(res, {
      sessionToken: created.sessionToken,
      csrfToken: created.csrfToken,
      expiresAt: created.session.expires_at,
    });

    return res.status(201).json({
      user: created.user,
      csrf_token: created.csrfToken,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "auth_owner_already_exists"
    ) {
      return res.status(409).json({
        error: "Владелец уже настроен",
      });
    }

    next(error);
  }
});

router.post("/auth/login", async (req, res, next) => {
  if (!isServerAuthRequired()) {
    clearAuthCookies(res);

    return res.status(403).json({
      error: "Server authentication is disabled",
    });
  }

  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    return sendValidationError(
      res,
      "Не удалось обработать данные входа",
      parsed.error,
    );
  }

  try {
    const db = await getDb();
    const created = await login(db, parsed.data);

    setAuthCookies(res, {
      sessionToken: created.sessionToken,
      csrfToken: created.csrfToken,
      expiresAt: created.session.expires_at,
    });

    return res.json({
      user: created.user,
      csrf_token: created.csrfToken,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "auth_invalid_credentials"
    ) {
      return res.status(401).json({
        error: "Неверный логин или пароль",
      });
    }

    next(error);
  }
});

router.post("/auth/logout", requireAuth, requireCsrf, async (req, res, next) => {
  try {
    const db = await getDb();

    await logout(db, readCookie(req, SESSION_COOKIE_NAME));
    clearAuthCookies(res);

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
