import {expect, test} from "@playwright/test";
import {clearFlows} from "./setup.ts";

test.describe("Money Flows journeys", () => {
    test.beforeEach(async () => {
        clearFlows();
    });

    test("Managing money flows", async ({page}) => {
        // 1. Navigate to Flows page
        await page.goto("/money/flows");
        await page.getByTestId("loader").waitFor({state: "hidden"});
        await page.waitForTimeout(500); // Hydration safety

        // 2. Add a flow item (positive)
        await page.getByTestId("flow-desc-input").fill("Salary");
        await page.getByTestId("flow-day-input").fill("15");
        await page.getByTestId("flow-amount-input").fill("5000");
        await Promise.all([
            page.waitForResponse(r => r.url().endsWith("/api/flows") && r.request().method() === "POST"),
            page.getByTestId("flow-add-btn").click(),
        ]);

        // 3. Verify item listed and form cleared
        await expect(page.getByText("Salary")).toBeVisible();
        await expect(page.getByText("+5000")).toBeVisible();
        await expect(page.getByText("15.")).toBeVisible();
        await expect(page.getByTestId("flow-desc-input")).toHaveValue("");
        await expect(page.getByTestId("flow-day-input")).toHaveValue("");
        await expect(page.getByTestId("flow-amount-input")).toHaveValue("");

        // 4. Add another item (negative) and verify sorting (15 first, then 1-14)
        await page.getByTestId("flow-desc-input").fill("Credit card");
        await page.getByTestId("flow-day-input").fill("25");
        await page.getByTestId("flow-amount-input").fill("-2000");
        await page.getByTestId("flow-add-btn").click();
        await page.waitForResponse(r => r.url().endsWith("/api/flows") && r.request().method() === "POST");

        await page.getByTestId("flow-desc-input").fill("Early bill");
        await page.getByTestId("flow-day-input").fill("5");
        await page.getByTestId("flow-amount-input").fill("-100");
        await page.getByTestId("flow-add-btn").click();
        await page.waitForResponse(r => r.url().endsWith("/api/flows") && r.request().method() === "POST");

        // Verify items and order
        const listItems = page.locator("li.flex");
        await expect(listItems).toHaveCount(3);
        
        // Order should be: Day 15, Day 25, Day 5
        await expect(listItems.nth(0)).toContainText("Salary");
        await expect(listItems.nth(1)).toContainText("Credit card");
        await expect(listItems.nth(2)).toContainText("Early bill");

        // 5. Delete an item
        const firstItemDeleteBtn = listItems.nth(0).getByTestId("delete-btn");
        await firstItemDeleteBtn.click(); // First click to enter confirm mode
        await expect(firstItemDeleteBtn).toHaveAttribute("aria-label", "Potwierdź");
        
        await Promise.all([
            page.waitForResponse(r => r.url().includes("/api/flows/") && r.request().method() === "DELETE"),
            firstItemDeleteBtn.click(), // Second click to confirm
        ]);

        await expect(page.getByText("Salary")).not.toBeVisible();
        await expect(listItems).toHaveCount(2);
    });
});
