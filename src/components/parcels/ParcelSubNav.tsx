import { component$ } from "@builder.io/qwik";
import { useLocation } from "@builder.io/qwik-city";

const TABS = [
  { label: "Incoming", path: "/parcels/incoming" },
  { label: "Outgoing", path: "/parcels/outgoing" },
];

export default component$(() => {
  const loc = useLocation();

  return (
    <nav class="flex border-b border-gray-200 bg-white">
      {TABS.map((tab) => {
        const isActive = loc.url.pathname.replace(/\/$/, "") === tab.path;
        return (
          <a
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
          </a>
        );
      })}
    </nav>
  );
});
