import path from "path";
import { fileURLToPath } from "url";
import "./load-env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
export const DATA_DIR = process.env.ATHENA_DATA_DIR ?? path.join(PROJECT_ROOT, "data");
export const DATABASE_PATH =
  process.env.ATHENA_DATABASE_PATH ?? path.join(DATA_DIR, "athena.db");
export const HOST = process.env.ATHENA_HOST ?? "127.0.0.1";
export const PORT = Number(process.env.PORT ?? 3000);

export function isServerAuthRequired(): boolean {
  return parseBoolean(process.env.ATHENA_AUTH_REQUIRED, false);
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();

  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return fallback;
}
