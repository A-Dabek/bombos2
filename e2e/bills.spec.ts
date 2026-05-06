import {expect, test} from "@playwright/test";
import {addBillsPeriodStartMarker, clearBills, setupBillsConfig, clearBillsAutomaticPayments, addBillsAutomaticPaymentSql,} from "./setup.ts";

test.describe("money module journeys", () => {
    test.beforeEach(async ({page}) => {
        clearBills();
        clearBillsAutomaticPayments();
        setupBillsConfig(15);
    });

    test("Bills: Managing transactions", async ({page}) => {
        // 1. Land
        await page.goto("/money/bills");
        await page.getByTestId("loader").waitFor({state: "hidden"});
        await page.waitForTimeout(500);

        // 2. Add income
        await page.getByTestId("transaction-desc-input").fill("Refund");
        await page.getByTestId("transaction-amount-input").fill("100");
        await Promise.all([
            page.waitForResponse(r => r.url().endsWith("/api/bills/transactions") && r.request().method() === "POST"),
            page.getByTestId("transaction-add-button").click(),
        ]);
        await expect(page.getByText("+100")).toBeVisible();

        // 3. Add expense
        await page.getByTestId("transaction-desc-input").fill("Rent");
        await page.getByTestId("transaction-amount-input").fill("-1200");
        await Promise.all([
            page.waitForResponse(r => r.url().endsWith("/api/bills/transactions") && r.request().method() === "POST"),
            page.getByTestId("transaction-add-button").click(),
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

        await page.getByTestId("transaction-desc-input").fill("Rent");
        await page.getByTestId("transaction-amount-input").fill("-1200");
        await Promise.all([
            page.waitForResponse(r => r.url().endsWith("/api/bills/transactions") && r.request().method() === "POST"),
            page.getByTestId("transaction-add-button").click(),
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

        await page.getByTestId("transaction-desc-input").fill("July expense");
        await page.getByTestId("transaction-amount-input").fill("-100");
        await Promise.all([
            page.waitForResponse(r => r.url().endsWith("/api/bills/transactions") && r.request().method() === "POST"),
            page.getByTestId("transaction-add-button").click(),
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
        await page.goto("/money/bills");
        await page.getByTestId("loader").waitFor({state: "hidden"});
        await page.waitForTimeout(500); // Hydration safety
        await expect(page.getByTestId("transaction-desc-input")).toBeVisible();
    });

    test("Bills: Automatic payments in admin", async ({page}) => {
        // 1. Go to Admin
        await page.goto("/money/bills/admin");
        await page.getByTestId("loader").waitFor({state: "hidden"});
        await page.waitForTimeout(500);

        // 2. Verify Automatic Payments section
        await expect(page.getByText("Automatic Payments")).toBeVisible();

        // 3. Add new payment
        await page.getByTestId("payment-name-input").fill("Rent");
        await page.getByTestId("payment-slug-input").fill("rent");
        await page.getByTestId("payment-amount-input").fill("1200");
        await Promise.all([
            page.waitForResponse(r => r.url().includes("/api/bills/automatic-payments") && r.request().method() === "POST"),
            page.getByTestId("payment-add-button").click(),
        ]);

        // 4. Verify payment appears in list
        await expect(page.getByTestId("payment-item")).toBeVisible();
        await expect(page.getByText("Rent", { exact: true })).toBeVisible();
        await expect(page.getByText("$1200")).toBeVisible();

        // 4. Verify payment appears in list
        await expect(page.getByTestId("payment-item")).toBeVisible();
        await expect(page.getByText("Rent", { exact: true })).toBeVisible();
        await expect(page.getByText("$1200")).toBeVisible();

        // 5. Delete payment - click twice on Delete button
        const deleteBtn = page.locator("button").filter({ hasText: "Delete" }).first();
        await deleteBtn.click();
        await deleteBtn.click();

        // Give time for API call
        await page.waitForTimeout(2000);
    });
});