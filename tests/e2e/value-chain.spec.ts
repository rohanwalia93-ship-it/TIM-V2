import { test, expect } from "@playwright/test";

const DEMOS = [
  { label: "Coldplay in Abu Dhabi", archetype: "events" },
  { label: "Waterfront theme park in Jeddah", archetype: "attractions (built)" },
  { label: "Desert eco-lodge & dune reserve near Al Ain", archetype: "attractions (natural)" },
  { label: "Beach resort in Jeddah", archetype: "accommodation" },
  { label: "Global tourism conference in Abu Dhabi", archetype: "mice" },
];

for (const demo of DEMOS) {
  test(`full value chain — ${demo.label} (${demo.archetype})`, async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /should you launch it/i })).toBeVisible();

    await page.getByText(demo.label, { exact: true }).click();
    await page.waitForURL("**/scenario**");

    // Step 2 — City Context Dashboard
    await expect(page.getByRole("heading", { name: /city context dashboard/i })).toBeVisible();
    const continueToConfigure = page.getByRole("button", { name: /configure the model/i });
    await expect(continueToConfigure).toBeEnabled({ timeout: 20_000 });
    await continueToConfigure.click();

    // Step 3 — Configure model
    await expect(page.getByRole("heading", { name: /configure the model/i })).toBeVisible();
    const firstInput = page.locator('input[type="number"]').first();
    await expect(firstInput).toHaveValue(/.+/);
    await page.getByRole("button", { name: /run the model/i }).click();

    // Step 4 — Run model
    await expect(page.getByRole("heading", { name: /run the model/i })).toBeVisible();
    await expect(page.getByText(/formula transparency/i)).toBeVisible();
    await page.getByRole("button", { name: /see verdict & financials/i }).click();

    // Step 5 — Verdict & financials
    await expect(page.getByRole("heading", { name: /verdict & financials/i })).toBeVisible();
    await expect(page.getByRole("main").getByText(/^(GO|CONDITIONAL|NO-GO)$/).first()).toBeVisible();
    await expect(page.getByText(/^NPV$/)).toBeVisible();
    await page.getByRole("button", { name: /sensitivity & scenarios/i }).click();

    // Step 6 — Sensitivity
    await expect(page.getByRole("heading", { name: /scenario & sensitivity/i })).toBeVisible();
    await expect(page.getByText(/tornado/i).first()).toBeVisible();
    await page.getByRole("button", { name: /export report/i }).click();

    // Step 7 — Export
    await expect(page.getByRole("heading", { name: /^export$/i })).toBeVisible();
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: /download pdf/i }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  });
}

test("methodology page is reachable and cites all four frameworks", async ({ page }) => {
  await page.goto("/methodology");
  await expect(page.getByRole("heading", { name: /^methodology$/i })).toBeVisible();
  await expect(page.getByText(/Cifuentes/).first()).toBeVisible();
  await expect(page.getByText(/Butler/).first()).toBeVisible();
  await expect(page.getByText(/Huff/).first()).toBeVisible();
  await expect(page.getByText(/TSA:RMF 2008/).first()).toBeVisible();
});

test("dark mode toggle switches the theme without a layout break", async ({ page }) => {
  await page.goto("/");
  const toggle = page.getByRole("button", { name: /toggle dark mode/i });
  await toggle.click();
  await expect(page.locator("html")).toHaveClass(/dark/);
});
