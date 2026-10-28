import { expect, test, type Page } from "@playwright/test";
import { E2E_RAW, cleanupE2E, disconnectE2E, futureWeekday } from "./helpers";

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  await cleanupE2E();
});

test.afterAll(async () => {
  await cleanupE2E();
  await disconnectE2E();
});

async function book(page: Page, opts: {
  centre: string;
  service: string;
  date: string;
  phone: string;
  name: string;
}) {
  await page.goto("/book");
  await page.getByRole("button", { name: opts.centre }).click();
  await page.getByRole("button", { name: new RegExp(opts.service) }).first().click();
  await page.locator('input[type="date"]').fill(opts.date);
  // First available time slot (HH:MM buttons in the date step).
  const slot = page.locator("section", { hasText: "Pick a date" }).getByRole("button", { name: /^\d\d:\d\d$/ }).first();
  await expect(slot).toBeVisible({ timeout: 30_000 });
  await slot.click();
  await page.getByLabel("Full name").fill(opts.name);
  await page.getByLabel(/Phone/).fill(opts.phone);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: /Confirm booking|Request booking/ }).click();
}

test("book AUTO confirms instantly with a reference", async ({ page }) => {
  await book(page, {
    centre: "MedServe Kano Diagnostic Centre",
    service: "Blood Tests",
    date: futureWeekday(14),
    phone: E2E_RAW[0],
    name: "E2E Auto",
  });
  await expect(page).toHaveURL(/\/book\/confirmed\/MS-/, { timeout: 60_000 });
  await expect(page.getByText("Booking confirmed")).toBeVisible();
  const ref = page.url().split("/").pop() ?? "";
  expect(ref).toMatch(/^MS-MKDC-/);
});

test("book REVIEW lands as a request", async ({ page }) => {
  await book(page, {
    centre: "MedServe LUTH Cancer Centre",
    service: "Chemotherapy",
    date: futureWeekday(15),
    phone: E2E_RAW[1],
    name: "E2E Review",
  });
  await expect(page).toHaveURL(/\/book\/confirmed\/MS-/, { timeout: 60_000 });
  await expect(page.getByText("Request received")).toBeVisible();
  const reviewRef = page.url().split("/").pop() ?? "";
  expect(reviewRef).toMatch(/^MS-MLCC-/);
});

test("manage: OTP login then cancel", async ({ page }) => {
  page.on("dialog", (d) => void d.accept());
  await book(page, {
    centre: "MedServe Kano Diagnostic Centre",
    service: "Blood Tests",
    date: futureWeekday(14),
    phone: E2E_RAW[0],
    name: "E2E Auto",
  });
  await expect(page).toHaveURL(/\/book\/confirmed\/MS-/, { timeout: 60_000 });
  const autoRef = page.url().split("/").pop() ?? "";
  await page.goto(`/manage?ref=${autoRef}`);
  await page.getByLabel("Phone").fill(E2E_RAW[0]);
  await page.getByRole("button", { name: "Text me a code" }).click();
  const devCode = await page.getByTestId("dev-otp-code").innerText();
  const code = devCode.replace(/\D/g, "");
  await page.getByLabel("6-digit code").fill(code);
  await page.getByRole("button", { name: "View booking" }).click();
  await expect(page).toHaveURL(`/manage/${autoRef}`, { timeout: 30_000 });
  await page.getByRole("button", { name: "Cancel this booking" }).click();
  await expect(page.getByText("CANCELLED")).toBeVisible({ timeout: 30_000 });
});

test("manage: request a new time on AUTO re-confirms", async ({ page }) => {
  await book(page, {
    centre: "MedServe Kano Diagnostic Centre",
    service: "Blood Tests",
    date: futureWeekday(16),
    phone: E2E_RAW[2],
    name: "E2E Move",
  });
  await expect(page).toHaveURL(/\/book\/confirmed\/MS-/, { timeout: 60_000 });
  const moveRef = page.url().split("/").pop() ?? "";

  await page.goto(`/manage?ref=${moveRef}`);
  await page.getByLabel("Phone").fill(E2E_RAW[2]);
  await page.getByRole("button", { name: "Text me a code" }).click();
  const code = (await page.getByTestId("dev-otp-code").innerText()).replace(/\D/g, "");
  await page.getByLabel("6-digit code").fill(code);
  await page.getByRole("button", { name: "View booking" }).click();
  await expect(page).toHaveURL(`/manage/${moveRef}`, { timeout: 30_000 });

  await page.locator('input[type="date"]').fill(futureWeekday(17));
  const slot = page.getByRole("button", { name: /^\d\d:\d\d$/ }).first();
  await expect(slot).toBeVisible({ timeout: 30_000 });
  await slot.click();
  await page.getByRole("button", { name: "Request new time" }).click();
  await expect(page.getByText("CONFIRMED").first()).toBeVisible({ timeout: 60_000 });
});

test("hub: sign in, confirm REVIEW booking, complete it, result ready", async ({ page }) => {
  page.on("dialog", (d) => void d.accept());
  await book(page, {
    centre: "MedServe LUTH Cancer Centre",
    service: "Chemotherapy",
    date: futureWeekday(15),
    phone: E2E_RAW[1],
    name: "E2E Review",
  });
  await expect(page).toHaveURL(/\/book\/confirmed\/MS-/, { timeout: 60_000 });
  const reviewRef = page.url().split("/").pop() ?? "";

  await page.goto("/hub/login");
  await page.getByLabel("Email").fill("admin@medserve.ng");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/hub", { timeout: 60_000 });

  await page.goto("/hub/appointments");
  await page.getByPlaceholder(/Search ref/).fill(reviewRef);
  await page.getByRole("link", { name: reviewRef }).click();
  await expect(page).toHaveURL(/\/hub\/appointments\//, { timeout: 30_000 });

  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(page.getByText("CONFIRMED").first()).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: "Check in" }).click();
  await expect(page.getByText("CHECKED_IN").first()).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: "Complete" }).click();
  await expect(page.getByText("COMPLETED").first()).toBeVisible({ timeout: 30_000 });

  await page.getByRole("button", { name: "Result ready" }).click();
  await expect(page.getByText(/Sent|uncollected/i).first()).toBeVisible({ timeout: 30_000 });

  await page.goto("/hub/results");
  await expect(page.getByText(reviewRef)).toBeVisible({ timeout: 30_000 });
});

test("hub: build a care series then shift it", async ({ page }) => {
  await page.goto("/hub/login");
  await page.getByLabel("Email").fill("admin@medserve.ng");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/hub", { timeout: 60_000 });

  // Series-capable services live at MLCC — switch the working centre.
  const switcher = page.getByLabel("Working centre");
  await switcher.selectOption({ label: "MLCC — MedServe LUTH Cancer Centre" });
  await expect(switcher).toBeEnabled({ timeout: 30_000 });
  await page.goto("/hub/series/new");
  await page.getByLabel("Patient phone").fill(E2E_RAW[3]);
  await page.getByLabel("Full name").fill("E2E Series");
  await page.getByLabel(/Service \(series/).selectOption({ label: "Radiotherapy" });
  await page.getByLabel("Sessions").fill("5");
  await page.getByLabel("Start date").fill(futureWeekday(21));
  await page.getByLabel("Session time").fill("09:00");
  await expect(page.getByRole("heading", { name: /Preview/ })).toBeVisible({ timeout: 60_000 });
  await page.getByRole("button", { name: /Confirm series/ }).click();
  await expect(page).toHaveURL(/\/hub\/series\//, { timeout: 90_000 });

  await page.getByLabel("From date").fill(futureWeekday(22));
  await page.getByLabel("Days").fill("7");
  await page.getByRole("button", { name: /Shift \(one notice\)/ }).click();
  await expect(page.getByText(/Series changes/i)).toBeVisible({ timeout: 90_000 });
});
