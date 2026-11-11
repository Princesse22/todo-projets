import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "e2e",
  webServer: { command: "npm start", url: "http://localhost:8080", reuseExistingServer: true },
  use: { baseURL: "http://localhost:8080" }
});
