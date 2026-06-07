import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

const e2eDataDir = path.join(process.cwd(), ".tmp", "e2e");
const e2eApiOrigin = "http://127.0.0.1:3100";
const e2eEnv = {
  ATHENA_AI_PROVIDER: "off",
  ATHENA_AUTH_REQUIRED: "false",
  ATHENA_DATABASE_PATH: path.join(e2eDataDir, "athena-e2e.db"),
  ATHENA_DATA_DIR: e2eDataDir,
  ATHENA_HOST: "127.0.0.1",
  NODE_ENV: "test",
  PORT: "3100",
};

export default defineConfig({
  testDir: "test/e2e",
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command:
        "node -e \"require('fs').rmSync('.tmp/e2e',{recursive:true,force:true})\" && npm run migrate && npm run dev",
      env: e2eEnv,
      reuseExistingServer: false,
      timeout: 120_000,
      url: `${e2eApiOrigin}/config`,
    },
    {
      command:
        "npm --workspace athena-client run dev -- --host 127.0.0.1 --port 5173 --strictPort",
      env: {
        ATHENA_DEV_API_ORIGIN: e2eApiOrigin,
      },
      reuseExistingServer: false,
      timeout: 120_000,
      url: "http://127.0.0.1:5173",
    },
  ],
});
