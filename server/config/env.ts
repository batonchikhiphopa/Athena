import path from "path";
import "./load-env.js";

export const PROJECT_ROOT = process.env.ATHENA_PROJECT_ROOT
  ? path.resolve(process.env.ATHENA_PROJECT_ROOT)
  : path.resolve(process.cwd());

export const DATA_DIR = process.env.ATHENA_DATA_DIR
  ? path.resolve(process.env.ATHENA_DATA_DIR)
  : path.join(PROJECT_ROOT, "data");

export const DATABASE_PATH = process.env.ATHENA_DATABASE_PATH
  ? path.resolve(process.env.ATHENA_DATABASE_PATH)
  : path.join(DATA_DIR, "athena.db");

export const CLIENT_DIST_DIR = process.env.ATHENA_CLIENT_DIST_DIR
  ? path.resolve(process.env.ATHENA_CLIENT_DIST_DIR)
  : path.join(PROJECT_ROOT, "client", "dist");

export const HOST = process.env.ATHENA_HOST ?? "127.0.0.1";
export const PORT = Number(process.env.PORT ?? 3000);
