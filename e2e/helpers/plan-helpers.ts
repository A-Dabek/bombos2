import { type Page } from "@playwright/test";

export interface TestList {
  id: number;
  title: string;
  display_order: number;
}

export interface TestItem {
  id?: number;
  name: string;
  description?: string;
  amount?: number;
}

const API_BASE = "http://localhost:5173/api/plan";

export async function createTestList(title: string, displayOrder = 0): Promise<TestList> {
  const res = await fetch(`${API_BASE}/lists`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, display_order: displayOrder }),
  });
  return await res.json();
}

export async function createTestItem(listId: number, item: TestItem) {
  await fetch(`${API_BASE}/lists/${listId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item),
  });
}

export async function waitForListInUI(page: Page, listName: string) {
  await page.locator("li").filter({ hasText: listName }).waitFor();
}

export async function waitForItemInUI(page: Page, itemName: string) {
  await page.getByText(itemName).waitFor();
}