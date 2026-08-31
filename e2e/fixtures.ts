import { test as base, expect, type Page } from "@playwright/test";

const EMAIL = process.env.E2E_EMAIL;
const PASSWORD = process.env.E2E_PASSWORD;

export const test = base.extend<{ authedPage: Page }>({
  authedPage: async ({ page }, use) => {
    test.skip(!EMAIL || !PASSWORD, "E2E_EMAIL / E2E_PASSWORD no configurados");
    await page.goto("/login");
    await page.getByLabel("Email").fill(EMAIL as string);
    await page.getByLabel("Contraseña").fill(PASSWORD as string);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: /Dashboard/i })).toBeVisible({
      timeout: 15000,
    });
    await use(page);
  },
});

export { expect };
