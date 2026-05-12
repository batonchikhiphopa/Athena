import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

type AthenaGlobal = typeof globalThis & {
  __ATHENA_ENV_LOADED__?: boolean;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..", "..");
const envPath = path.join(projectRoot, ".env");
const athenaGlobal = globalThis as AthenaGlobal;

if (!athenaGlobal.__ATHENA_ENV_LOADED__) {
  athenaGlobal.__ATHENA_ENV_LOADED__ = true;
  loadEnvFile();
}

function loadEnvFile(): void {
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) continue;

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    const value = unquote(trimmed.slice(equalsIndex + 1).trim());

    if (!key || Object.hasOwn(process.env, key)) continue;

    process.env[key] = value;
  }
}

function unquote(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}
