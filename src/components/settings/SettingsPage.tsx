import { component$, useSignal, $ } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";
import { useSettings } from "~/routes/layout";

const ALL_TABS = [
  { path: "/parcels", label: "Paczki" },
  { path: "/meals", label: "Posiłki" },
  { path: "/plan", label: "Listy" },
  { path: "/money", label: "Finanse" },
  { path: "/groceries", label: "Spożywcze" },
];

export default component$(() => {
  const settings = useSettings();
  const hiddenTabs = useSignal<string[]>(settings.value.hiddenTabs);
  const theme = useSignal<"dark" | "light">(settings.value.theme);
  const saving = useSignal(false);
  const error = useSignal<string | null>(null);

  const toggleTab = $(async (path: string) => {
    const current = hiddenTabs.value;
    const next = current.includes(path)
      ? current.filter((t) => t !== path)
      : [...current, path];

    saving.value = true;
    error.value = null;
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hiddenTabs: next }),
      });
      if (!res.ok) throw new Error("Failed to save settings");
      const data = await res.json();
      hiddenTabs.value = data.hiddenTabs;
      // Reload so the layout nav reflects the updated hidden tabs
      window.location.reload();
    } catch (e: any) {
      error.value = e.message;
    } finally {
      saving.value = false;
    }
  });

  const toggleTheme = $(async () => {
    const nextTheme = theme.value === "dark" ? "light" : "dark";
    saving.value = true;
    error.value = null;
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: nextTheme }),
      });
      if (!res.ok) throw new Error("Failed to save settings");
      const data = await res.json();
      theme.value = data.theme;

      const appRoot = document.getElementById("app-root");
      if (appRoot) {
        if (data.theme === "dark") {
          appRoot.classList.add("dark", "bg-gray-900", "text-gray-100");
          appRoot.classList.remove("bg-white", "text-gray-900");
        } else {
          appRoot.classList.remove("dark", "bg-gray-900", "text-gray-100");
          appRoot.classList.add("bg-white", "text-gray-900");
        }
      }
      if (data.theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } catch (e: any) {
      error.value = e.message;
    } finally {
      saving.value = false;
    }
  });

  const handleLogout = $(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  });

  return (
    <div class="p-4">
      <h1 class="mb-6 text-xl font-semibold text-gray-800 dark:text-gray-100" data-testid="settings-title">
        Personalizacja
      </h1>

      {error.value && (
        <p class="mb-4 text-sm text-red-600 dark:text-red-400" data-testid="settings-error">
          {error.value}
        </p>
      )}

      <section class="mb-8">
        <h2 class="mb-3 text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Motyw
        </h2>
        <div class="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3">
          <span class="text-sm font-medium text-gray-800 dark:text-gray-200">Motyw ciemny</span>
          <button
            onClick$={toggleTheme}
            disabled={saving.value}
            data-testid="toggle-dark-theme"
            class={[
              "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50",
              theme.value === "dark" ? "bg-blue-500" : "bg-gray-200 dark:bg-gray-700",
            ]}
            aria-pressed={theme.value === "dark"}
            aria-label="Motyw ciemny"
          >
            <span
              class={[
                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200",
                theme.value === "dark" ? "translate-x-5" : "translate-x-0",
              ]}
            />
          </button>
        </div>
      </section>

      <section class="mb-8">
        <h2 class="mb-3 text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Widoczność zakładek
        </h2>
        <ul class="divide-y divide-gray-100 dark:divide-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          {ALL_TABS.map((tab) => {
            const isHidden = hiddenTabs.value.includes(tab.path);
            return (
              <li key={tab.path} class="flex items-center px-4 py-3">
                <span class="flex-1 text-sm text-gray-800 dark:text-gray-200">{tab.label}</span>
                {isHidden && (
                  <Link
                    href={tab.path}
                    class="mr-3 text-xs text-blue-500 dark:text-blue-400 underline"
                    data-testid={`visit-tab-${tab.path.replace("/", "")}`}
                  >
                    Odwiedź
                  </Link>
                )}
                <button
                  onClick$={() => toggleTab(tab.path)}
                  disabled={saving.value}
                  data-testid={`toggle-tab-${tab.path.replace("/", "")}`}
                  class={[
                    "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50",
                    isHidden ? "bg-gray-200 dark:bg-gray-700" : "bg-blue-500",
                  ]}
                  aria-pressed={!isHidden}
                  aria-label={`${isHidden ? "Pokaż" : "Ukryj"} ${tab.label}`}
                >
                  <span
                    class={[
                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200",
                      isHidden ? "translate-x-0" : "translate-x-5",
                    ]}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h2 class="mb-3 text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Konto
        </h2>
        <button
          onClick$={handleLogout}
          data-testid="logout-button"
          class="w-full rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-left text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50"
        >
          Wyloguj się
        </button>
      </section>
    </div>
  );
});
