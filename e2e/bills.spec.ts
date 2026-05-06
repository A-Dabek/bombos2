import {expect, test} from "@playwright/test";
import {clearBills, setupBillsConfig,} from "./setup.ts";

test.describe("money module journeys", () => {
    test.beforeEach(async ({page}) => {
        clearBills();
        setupBillsConfig(15);
    });

    test("Bills: Managing transactions", async ({page}) => {
        // 1. Land
        await page.goto("/money/bills");
        await page.getByTestId("loader").waitFor({state: "hidden"});
        await page.waitForTimeout(500);

        // 2. Add income
        await page.getByPlaceholder("Description").fill("Refund");
        await page.getByPlaceholder("Amount (negative for expense)").fill("100");
        await Promise.all([
            page.waitForResponse(r => r.url().endsWith("/api/bills/transactions") && r.request().method() === "POST"),
            page.getByRole("button", {name: "Add"}).click(),
        ]);
        await expect(page.getByText("+100")).toBeVisible();

        // 3. Add expense
        await page.getByPlaceholder("Description").fill("Rent");
        await page.getByPlaceholder("Amount (negative for expense)").fill("-1200");
        await Promise.all([
            page.waitForResponse(r => r.url().endsWith("/api/bills/transactions") && r.request().method() === "POST"),
            page.getByRole("button", {name: "Add"}).click(),
        ]);
        await expect(page.getByText("-1200")).toBeVisible();

        // 4. Verify order (newest first)
        const transactionList = page.locator(".divide-y").first();
        await expect(transactionList.locator(".flex").first()).toContainText("Rent");
        await expect(transactionList.locator(".flex").first()).toContainText("-1200");
    });

    test("Bills: Configuration and persistence", async ({page}) => {
        // 1. Land
        await page.goto("/money/bills");
        await page.getByTestId("loader").waitFor({state: "hidden"});
        await page.waitForTimeout(500);

        // 2. Go to Admin
        await page.getByTestId("admin-button").click();
        await page.waitForURL(/\/money\/bills\/admin/);
        await page.getByTestId("loader").waitFor({state: "hidden"});
        await page.waitForTimeout(500);

        // 3. Verify current value
        await expect(page.locator("#day-of-month")).toHaveValue("15");

        // 4. Update
        await page.locator("#day-of-month").fill("1");
        await Promise.all([
            page.waitForResponse(r => r.url().endsWith("/api/bills/config") && r.request().method() === "POST"),
            page.getByRole("button", {name: "Save"}).click(),
        ]);
        await expect(page.getByTestId("save-success")).toBeVisible();

        // 5. Verify persistence after reload
        await page.reload();
        await page.getByTestId("loader").waitFor({state: "hidden"});
        await expect(page.locator("#day-of-month")).toHaveValue("1");

        // 6. Return
        await page.getByRole("link", {name: "Back"}).click();
        await page.waitForURL(/\/money\/bills\/?$/);
        await expect(page.getByPlaceholder("Description")).toBeVisible();
    });
});
