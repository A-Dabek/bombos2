import { component$ } from "@builder.io/qwik";
import { useLocation, Link } from "@builder.io/qwik-city";

const TABS = [
  { label: "Dinner", path: "/meals/dinner" },
  { label: "Supper", path: "/meals/supper" },
];

export default component$(() => {
  const loc = useLocation();

  return (
    <nav class="flex border-b border-gray-200 bg-white animate-[fadeIn_0.3s_ease-out]">
      {TABS.map((tab) => {
        const isActive = loc.url.pathname.replace(/\/$/, "").startsWith(tab.path);
        return (
          <Link
            key={tab.path}
            href={tab.path}
            class={[
              "flex-1 py-2 text-center text-sm font-medium transition-colors",
              isActive
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700",
            ]}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
});