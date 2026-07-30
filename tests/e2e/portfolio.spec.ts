import { test, expect } from "@playwright/test";

test("unauthenticated visit to /portfolio redirects to /login with callbackUrl", async ({ page }) => {
  await page.goto("/portfolio");
  await page.waitForURL("**/login**");
  expect(page.url()).toContain("callbackUrl=%2Fportfolio");
});

test("dev-mode login reaches the portfolio and shows seeded assessments", async ({ page }) => {
  await page.goto("/login");
  await page.fill("#email", `e2e-${Date.now()}@dct.gov.ae`);
  await page.fill("#name", "E2E Tester");
  await page.getByRole("combobox").click();
  await page.getByRole("option", { name: /Administrator/i }).click();
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL("**/portfolio**");

  await expect(page.getByRole("heading", { name: "Portfolio", exact: true })).toBeVisible();
  await expect(page.getByText("International Stadium Concert")).toBeVisible();
  await expect(page.getByRole("link", { name: /new assessment/i })).toBeVisible();
});

test("admin page enforces role — non-administrator sees a restricted notice", async ({ page }) => {
  await page.goto("/login");
  await page.fill("#email", `e2e-viewer-${Date.now()}@dct.gov.ae`);
  await page.getByRole("combobox").click();
  await page.getByRole("option", { name: /^Viewer/i }).click();
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL("**/portfolio**");

  await page.goto("/admin");
  await expect(page.getByText(/restricted to the Administrator role/i)).toBeVisible();
});

test("new-assessment form blocks submission without a selected destination", async ({ page }) => {
  await page.goto("/login");
  await page.fill("#email", `e2e-analyst-${Date.now()}@dct.gov.ae`);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL("**/portfolio**");

  await page.getByRole("link", { name: /new assessment/i }).click();
  await page.waitForURL("**/portfolio/new**");
  await page.fill("#name", "E2E Test Concert");
  await page.getByRole("button", { name: /create assessment/i }).click();
  await expect(page.getByText("Search and select a destination.")).toBeVisible();
});
