/** Primitive, recursive readers for untrusted local import JSON. */

import type { LocalExportSelfReportValuesV1 } from "./exportTypes";

const LOCAL_DAY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const FORBIDDEN_IMPORT_KEYS = new Set([
  "api_key",
  "apiKey",
  "auth_token",
  "authToken",
  "access_token",
  "accessToken",
  "refresh_token",
  "refreshToken",
  "csrf_token",
  "csrfToken",
  "session_token",
  "sessionToken",
  "sessionTokenHash",
  "session_token_hash",
  "vault_key",
  "vaultKey",
  "vault_password",
  "vaultPassword",
  "password",
  "password_hash",
  "passwordHash",
  "provider_api_key",
  "providerApiKey",
  "private_key",
  "privateKey",
  "secret",
]);

export function assertNoForbiddenKeys(value: unknown, path = "$"): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoForbiddenKeys(item, `${path}[${index}]`));
    return;
  }

  if (!isPlainObject(value)) return;

  for (const [key, nestedValue] of Object.entries(value)) {
    assertCondition(
      !FORBIDDEN_IMPORT_KEYS.has(key),
      `Forbidden sensitive field in import package: ${path}.${key}`,
    );
    assertNoForbiddenKeys(nestedValue, `${path}.${key}`);
  }
}

export function assertAllowedKeys<TAllowed extends readonly string[]>(
  value: Record<string, unknown>,
  allowedKeys: TAllowed,
  context: string,
): void {
  const allowed = new Set<string>(allowedKeys as readonly string[]);

  for (const key of Object.keys(value)) {
    assertCondition(allowed.has(key), `Unexpected ${context} field: ${key}`);
  }
}

export function assertPlainObject(
  value: unknown,
  message: string,
): Record<string, unknown> {
  assertCondition(isPlainObject(value), message);
  return value;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function readExact<TExpected extends string>(
  object: Record<string, unknown>,
  key: string,
  expected: TExpected,
  message: string,
): TExpected {
  assertEquals(object[key], expected, message);
  return expected;
}

export function readString(
  object: Record<string, unknown>,
  key: string,
  message: string,
): string {
  const value = object[key];
  assertCondition(typeof value === "string", message);
  return value;
}

export function readNonEmptyString(
  object: Record<string, unknown>,
  key: string,
  message: string,
): string {
  const value = readString(object, key, message);
  assertCondition(value.trim().length > 0, message);
  return value;
}

export function readNullableString(
  object: Record<string, unknown>,
  key: string,
  message: string,
): string | null {
  const value = object[key];

  if (value === null) return null;
  assertCondition(typeof value === "string", message);

  return value;
}

export function readBoolean(
  object: Record<string, unknown>,
  key: string,
  message: string,
): boolean {
  const value = object[key];
  assertCondition(typeof value === "boolean", message);
  return value;
}

export function readNullableNonNegativeInteger(
  object: Record<string, unknown>,
  key: string,
  message: string,
): number | null {
  const value = object[key];

  if (value === null) return null;

  assertCondition(
    Number.isInteger(value) && typeof value === "number" && value >= 0,
    message,
  );

  return value;
}

export function readStringArray(
  object: Record<string, unknown>,
  key: string,
  message: string,
): string[] {
  const value = object[key];

  assertCondition(Array.isArray(value), message);

  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of value) {
    assertCondition(typeof item === "string", message);

    const normalized = item.trim();

    assertCondition(normalized.length > 0, message);

    if (!seen.has(normalized)) {
      seen.add(normalized);
      result.push(normalized);
    }
  }

  return result;
}

export function readLocalDay(
  object: Record<string, unknown>,
  key: string,
  message: string,
): string {
  const value = readString(object, key, message);
  assertCondition(isValidLocalDay(value), message);
  return value;
}

export function readIsoDate(
  object: Record<string, unknown>,
  key: string,
  message: string,
): string {
  const value = readString(object, key, message);
  assertIsoDate(value, message);
  return value;
}

export function readNullableSelfReportValue(
  object: Record<string, unknown>,
  key: keyof LocalExportSelfReportValuesV1,
): number | null {
  const value = object[key];

  if (value === null) return null;

  assertCondition(
    typeof value === "number" &&
      Number.isInteger(value) &&
      value >= 0 &&
      value <= 10,
    `Invalid self-report value: ${key}`,
  );

  return value;
}

export function readNullableJsonValue(
  object: Record<string, unknown>,
  key: string,
  message: string,
): unknown | null {
  const value = object[key];

  if (value === null) return null;

  assertJsonValue(value, message);

  return value;
}

function assertJsonValue(value: unknown, message: string): void {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    assertCondition(
      typeof value !== "number" || Number.isFinite(value),
      message,
    );
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => assertJsonValue(item, message));
    return;
  }

  if (isPlainObject(value)) {
    Object.values(value).forEach((item) => assertJsonValue(item, message));
    return;
  }

  throw new Error(message);
}

function isValidLocalDay(value: string): boolean {
  const match = value.match(LOCAL_DAY_PATTERN);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const parsed = new Date(Date.UTC(year, month - 1, day));

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

function assertIsoDate(value: string, message: string): void {
  const timestamp = Date.parse(value);

  assertCondition(!Number.isNaN(timestamp), message);
  assertCondition(new Date(timestamp).toISOString() === value, message);
}

export function assertEquals<TExpected>(
  actual: unknown,
  expected: TExpected,
  message: string,
): asserts actual is TExpected {
  assertCondition(actual === expected, message);
}

export function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}
