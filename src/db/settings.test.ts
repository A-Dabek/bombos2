import { describe, it, expect, beforeEach } from "vitest";
import Database from "better-sqlite3";
import { runMigrations } from "./migrations.ts";
import { getHiddenTabs, setHiddenTabs, getTheme, setTheme } from "./settings.ts";

describe("settings db - per-account hidden tabs", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = new Database(":memory:");
    runMigrations(db);
  });

  it("should store and retrieve hidden tabs per account", () => {
    expect(getHiddenTabs("user1@example.com", db)).toEqual([]);
    expect(getHiddenTabs("user2@example.com", db)).toEqual([]);

    setHiddenTabs("user1@example.com", ["/meals", "/plan"], db);
    setHiddenTabs("user2@example.com", ["/money"], db);

    expect(getHiddenTabs("user1@example.com", db)).toEqual(["/meals", "/plan"]);
    expect(getHiddenTabs("user2@example.com", db)).toEqual(["/money"]);
  });

  it("should fallback to default or legacy settings when email not specified or user has no settings", () => {
    setHiddenTabs(["/groceries"], db);
    expect(getHiddenTabs("default", db)).toEqual(["/groceries"]);
    expect(getHiddenTabs(undefined, db)).toEqual(["/groceries"]);
    // Unset user falls back to default settings
    expect(getHiddenTabs("newuser@example.com", db)).toEqual(["/groceries"]);

    // Saving custom settings for newuser overrides default fallback
    setHiddenTabs("newuser@example.com", ["/meals"], db);
    expect(getHiddenTabs("newuser@example.com", db)).toEqual(["/meals"]);
    expect(getHiddenTabs("default", db)).toEqual(["/groceries"]);
  });

  it("should store and retrieve theme per account", () => {
    expect(getTheme("user1@example.com", db)).toBe("light");
    expect(getTheme("user2@example.com", db)).toBe("light");

    setTheme("user1@example.com", "dark", db);
    setTheme("user2@example.com", "light", db);

    expect(getTheme("user1@example.com", db)).toBe("dark");
    expect(getTheme("user2@example.com", db)).toBe("light");
  });

  it("should fallback to default theme when user has no custom theme", () => {
    setTheme("dark", db);
    expect(getTheme("default", db)).toBe("dark");
    expect(getTheme(undefined, db)).toBe("dark");
    expect(getTheme("newuser@example.com", db)).toBe("dark");

    setTheme("newuser@example.com", "light", db);
    expect(getTheme("newuser@example.com", db)).toBe("light");
    expect(getTheme("default", db)).toBe("dark");
  });
});
