import { component$, Slot } from "@builder.io/qwik";
import { useLocation } from "@builder.io/qwik-city";

const TABS = [
  { label: "Parcels", path: "/parcels" },
  { label: "Meals", path: "/meals" },
  { label: "Money", path: "/money" },
  { label: "Shopping", path: "/shopping" },
];

export default component$(() => {
  const loc = useLocation();

  return (
    <>
      <nav class="flex border-b border-gray-200">
        {TABS.map((tab) => {
          const isActive = loc.url.pathname === tab.path;
          return (
            <a
              key={tab.path}
              href={tab.path}
              class={[
                "flex-1 py-3 text-center text-sm font-medium transition-colors",
                isActive
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700",
              ]}
            >
              {tab.label}
            </a>
          );
        })}
      </nav>
      <main>
        <Slot />
      </main>
    </>
  );
});
