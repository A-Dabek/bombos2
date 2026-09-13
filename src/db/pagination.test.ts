import { test, expect } from "vitest";
import { paginateGroups } from "./pagination.ts";

test("returns empty page with no more when input is empty", () => {
  const page = paginateGroups([], 3);
  expect(page.groups).toEqual([]);
  expect(page.hasMore).toBe(false);
});

test("returns all groups and hasMore=false when count equals limit", () => {
  const page = paginateGroups(["a", "b", "c"], 3);
  expect(page.groups).toEqual(["a", "b", "c"]);
  expect(page.hasMore).toBe(false);
});

test("returns exactly limit groups and hasMore=true when count exceeds limit", () => {
  const page = paginateGroups(["a", "b", "c", "d"], 3);
  expect(page.groups).toEqual(["a", "b", "c"]);
  expect(page.hasMore).toBe(true);
});

test("advances by offset and reports no more at the last page", () => {
  const all = ["a", "b", "c", "d", "e"];
  const first = paginateGroups(all, 3, 0);
  expect(first.groups).toEqual(["a", "b", "c"]);
  expect(first.hasMore).toBe(true);

  const second = paginateGroups(all, 3, 3);
  expect(second.groups).toEqual(["d", "e"]);
  expect(second.hasMore).toBe(false);
});

test("reports hasMore=true when a full final page is followed by more rows", () => {
  const all = ["a", "b", "c", "d", "e", "f", "g"];
  const page = paginateGroups(all, 3, 3);
  expect(page.groups).toEqual(["d", "e", "f"]);
  expect(page.hasMore).toBe(true);
});

test("offset past the end yields an empty page", () => {
  const page = paginateGroups(["a", "b"], 3, 5);
  expect(page.groups).toEqual([]);
  expect(page.hasMore).toBe(false);
});

test("limit of 1 probes the next group correctly", () => {
  expect(paginateGroups(["a"], 1)).toEqual({ groups: ["a"], hasMore: false });
  expect(paginateGroups(["a", "b"], 1)).toEqual({ groups: ["a"], hasMore: true });
});
