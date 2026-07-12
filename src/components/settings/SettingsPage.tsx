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
  const hiddenTabs = useSignal<string[]>(settings.value);
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

  const handleLogout = $(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  });

  return (
    <div class="p-4">
      <h1 class="mb-6 text-xl font-semibold text-gray-800" data-testid="settings-title">
        Personalizacja
      </h1>

      {error.value && (
        <p class="mb-4 text-sm text-red-600" data-testid="settings-error">
          {error.value}
        </p>
      )}

      <section class="mb-8">
        <h2 class="mb-3 text-sm font-medium uppercase tracking-wide text-gray-500">
          Widoczność zakładek
        </h2>
        <ul class="divide-y divide-gray-100 rounded-lg border border-gray-200">
          {ALL_TABS.map((tab) => {
            const isHidden = hiddenTabs.value.includes(tab.path);
            return (
              <li key={tab.path} class="flex items-center px-4 py-3">
                <span class="flex-1 text-sm text-gray-800">{tab.label}</span>
                {isHidden && (
                  <Link
                    href={tab.path}
                    class="mr-3 text-xs text-blue-500 underline"
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
                    isHidden ? "bg-gray-200" : "bg-blue-500",
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
        <h2 class="mb-3 text-sm font-medium uppercase tracking-wide text-gray-500">
          Konto
        </h2>
        <button
          onClick$={handleLogout}
          data-testid="logout-button"
          class="w-full rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-100"
        >
          Wyloguj się
        </button>
      </section>
    </div>
  );
});
