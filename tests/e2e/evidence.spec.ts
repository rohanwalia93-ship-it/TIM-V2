import { test, expect } from "@playwright/test";

test("evidence plan page: add evidence resolves a metric and shrinks the gap count", async ({ page }) => {
  await page.goto("/login");
  await page.fill("#email", `e2e-evidence-${Date.now()}@dct.gov.ae`);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL("**/portfolio**");

  await page.getByText("International Stadium Concert").click();
  await page.waitForURL("**/portfolio/seed-stadium-concert-auh**");
  await page.getByRole("link", { name: /evidence plan & data health/i }).click();
  await page.waitForURL("**/evidence**");

  await expect(page.getByText(/data gaps blocking decision/i)).toBeVisible();
  const gapsHeading = await page.getByText(/data gaps blocking decision \((\d+)\)/i).textContent();
  const before = Number(gapsHeading!.match(/\((\d+)\)/)![1]);

  await page.getByRole("button", { name: /add evidence/i }).first().click();
  await page.fill("#value", "42");
  await page.fill("#unit", "test-unit");
  await page.fill("#geography", "Test geography");
  await page.fill("#sourceName", "E2E test source");
  await page.getByRole("button", { name: /save evidence/i }).click();

  await expect(async () => {
    const text = await page.getByText(/data gaps blocking decision \((\d+)\)/i).textContent();
    const current = Number(text!.match(/\((\d+)\)/)![1]);
    expect(current).toBe(before - 1);
  }).toPass({ timeout: 10_000 });

  await expect(page.getByRole("button", { name: /view provenance/i }).first()).toBeVisible();
});
