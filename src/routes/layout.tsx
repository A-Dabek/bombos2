import { component$, Slot } from "@builder.io/qwik";
import { useLocation } from "@builder.io/qwik-city";
import {
  HiCubeOutline,
  HiFireOutline,
  HiBanknotesOutline,
  HiShoppingCartOutline,
} from "@qwikest/icons/heroicons";

const TABS = [
  { label: "Parcels", path: "/parcels", Icon: HiCubeOutline },
  { label: "Meals", path: "/meals", Icon: HiFireOutline },
  { label: "Money", path: "/money", Icon: HiBanknotesOutline },
  { label: "Shopping", path: "/shopping", Icon: HiShoppingCartOutline },
];

export default component$(() => {
  const loc = useLocation();

  return (
    <>
      <nav class="flex border-b border-gray-200">
        {TABS.map((tab) => {
          const isActive = loc.url.pathname.replace(/\/$/, "") === tab.path;
          const Icon = tab.Icon;
          return (
            <a
              key={tab.path}
              href={tab.path}
              class={[
                "flex flex-1 flex-col items-center py-2 text-center text-sm font-medium transition-colors",
                isActive
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700",
              ]}
            >
              <Icon class="h-5 w-5" />
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
