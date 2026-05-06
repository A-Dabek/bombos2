import {expect, test} from "@playwright/test";
import {clearBalance, setupBalanceConfig,} from "./setup.ts";

test.describe("money module journeys", () => {
    test.beforeEach(async ({page}) => {
        clearBalance();
        setupBalanceConfig(15);
    });

    test("Balance: Managing transactions", async ({page}) => {
        // 1. Land
        await page.goto("/money/balance");
        await page.getByTestId("loader").waitFor({state: "hidden"});
        await page.waitForTimeout(500); // Hydration safety

        // 2. Add income
        await page.getByPlaceholder("Description").fill("Salary");
        await page.getByPlaceholder("Amount (negative for expense)").fill("5000");
        await Promise.all([
            page.waitForResponse(r => r.url().endsWith("/api/balance/transactions") && r.request().method() === "POST"),
            page.getByRole("button", {name: "Add"}).click(),
        ]);
        await expect(page.getByText("+5000")).toBeVisible();

        // 3. Add expense
        await page.getByPlaceholder("Description").fill("Groceries");
        await page.getByPlaceholder("Amount (negative for expense)").fill("-150");
        await Promise.all([
            page.waitForResponse(r => r.url().endsWith("/api/balance/transactions") && r.request().method() === "POST"),
            page.getByRole("button", {name: "Add"}).click(),
        ]);
        await expect(page.getByText("-150")).toBeVisible();

        // 4. Verify order (newest first)
        const transactionList = page.locator(".divide-y").first();
        await expect(transactionList.locator(".flex").first()).toContainText("Groceries");
        await expect(transactionList.locator(".flex").first()).toContainText("-150");
    });

    test("Balance: Configuration and persistence", async ({page}) => {
        // 1. Land
        await page.goto("/money/balance");
        await page.getByTestId("loader").waitFor({state: "hidden"});
        await page.waitForTimeout(500);

        // 2. Go to Admin
        await page.getByTestId("admin-button").click();
        await page.waitForURL(/\/money\/balance\/admin/);
        await page.getByTestId("loader").waitFor({state: "hidden"});
        await page.waitForTimeout(500);

        // 3. Verify current value
        await expect(page.locator("#day-of-month")).toHaveValue("15");

        // 4. Update
        await page.locator("#day-of-month").fill("25");
        await Promise.all([
            page.waitForResponse(r => r.url().endsWith("/api/balance/config") && r.request().method() === "POST"),
            page.getByRole("button", {name: "Save"}).click(),
        ]);
        await expect(page.getByTestId("save-success")).toBeVisible();

        // 5. Verify persistence after reload
        await page.reload();
        await page.getByTestId("loader").waitFor({state: "hidden"});
        await expect(page.locator("#day-of-month")).toHaveValue("25");

        // 6. Return and verify navigation
        await page.getByRole("link", {name: "Back"}).click();
        await page.waitForURL(/\/money\/balance\/?$/);
        await expect(page.getByPlaceholder("Description")).toBeVisible();
    });
});
