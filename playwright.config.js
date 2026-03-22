var { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/smoke',
  timeout: 60000,
  retries: 0,
  workers: 1,  // sequential — pages share a server
  use: {
    baseURL: 'http://localhost:8090',
    headless: true,
    browserName: 'chromium'
  },
  webServer: {
    command: 'npx serve site -l 8090 --no-clipboard',
    port: 8090,
    reuseExistingServer: false
  }
});
