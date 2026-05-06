import {expect, test} from "@playwright/test";
import {addBillsPeriodStartMarker, clearBills, setupBillsConfig,} from "./setup.ts";

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

        // 4. Verify order (newest first) within period group
        const transactionList = page.locator(".divide-y").first();
        await expect(transactionList.locator(".flex").first()).toContainText("Rent");
        await expect(transactionList.locator(".flex").first()).toContainText("-1200");
    });

    test("Bills: Period grouping with period markers", async ({page}) => {
        // 1. Add period start marker (May 15, 2026)
        addBillsPeriodStartMarker(Math.floor(new Date("2026-05-15").getTime() / 1000));

        // 2. Add user transaction
        await page.goto("/money/bills");
        await page.getByTestId("loader").waitFor({state: "hidden"});
        await page.waitForTimeout(500);

        await page.getByPlaceholder("Description").fill("Rent");
        await page.getByPlaceholder("Amount (negative for expense)").fill("-1200");
        await Promise.all([
            page.waitForResponse(r => r.url().endsWith("/api/bills/transactions") && r.request().method() === "POST"),
            page.getByRole("button", {name: "Add"}).click(),
        ]);

        // 3. Verify period header visible
        await expect(page.getByTestId("period-header")).toBeVisible();

        // 4. Verify period label format
        await expect(page.getByTestId("period-header")).toContainText("May 15th – June 15th");

        // 5. Verify period marker NOT visible (only user transactions show)
        await expect(page.getByText("Period start")).not.toBeVisible();

        // 6. Verify transaction under period header
        await expect(page.getByText("-1200")).toBeVisible();
        await expect(page.getByText("Rent")).toBeVisible();
    });

    test("Bills: Multiple periods create multiple groups", async ({page}) => {
        // 1. Add multiple period start markers
        addBillsPeriodStartMarker(Math.floor(new Date("2026-05-15").getTime() / 1000));
        addBillsPeriodStartMarker(Math.floor(new Date("2026-06-15").getTime() / 1000));
        addBillsPeriodStartMarker(Math.floor(new Date("2026-07-15").getTime() / 1000));

        // 2. Add transactions in different periods
        await page.goto("/money/bills");
        await page.getByTestId("loader").waitFor({state: "hidden"});
        await page.waitForTimeout(500);

        await page.getByPlaceholder("Description").fill("July expense");
        await page.getByPlaceholder("Amount (negative for expense)").fill("-100");
        await Promise.all([
            page.waitForResponse(r => r.url().endsWith("/api/bills/transactions") && r.request().method() === "POST"),
            page.getByRole("button", {name: "Add"}).click(),
        ]);

        // 3. Verify multiple period headers (newest period first)
        const periodHeaders = page.getByTestId("period-header");
        await expect(periodHeaders).toHaveCount(3);
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