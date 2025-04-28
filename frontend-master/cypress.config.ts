import { defineConfig } from "cypress";

export default defineConfig({
  reporter: "mochawesome",

  reporterOptions: {
    reportDir: "cypress/videos/results",
    charts: true,
    overwrite: false,
    html: true,
    json: false,
  },

  video: true,

  e2e: {
    setupNodeEvents(on, config) {},
    baseUrl: "https://oswe-frontend-staging.apps.fr01.paas.tech.orange",
    supportFile: "cypress/support/e2e.ts",
    viewportWidth: 1200,
    experimentalRunAllSpecs: true,
    //Cypress studio
    experimentalStudio: true
  },
});
