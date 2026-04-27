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
