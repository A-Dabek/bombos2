import { component$, Slot, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { useLocation } from "@builder.io/qwik-city";
import { streamParcelCount } from "../utils/parcel-count-stream";
import {
  HiCubeOutline,
  HiFireOutline,
  HiListBulletOutline,
  HiBanknotesOutline,
  HiShoppingCartOutline,
} from "@qwikest/icons/heroicons";

const TABS = [
  { label: "Parcels", path: "/parcels", Icon: HiCubeOutline },
  { label: "Meals", path: "/meals", Icon: HiFireOutline },
  { label: "Plan", path: "/plan", Icon: HiListBulletOutline },
  { label: "Money", path: "/money", Icon: HiBanknotesOutline },
  { label: "Shopping", path: "/shopping", Icon: HiShoppingCartOutline },
];

export default component$(() => {
  const loc = useLocation();
  const parcelCount = useSignal(0);

  useVisibleTask$(async ({ cleanup }) => {
    const stream = await streamParcelCount();

    const iterate = async () => {
      try {
        for await (const count of stream) {
          parcelCount.value = count;
        }
      } catch (error) {
        console.error("Stream iteration error:", error);
      }
    };
    iterate();

    cleanup(() => {
      // Stream cleanup happens automatically when component unmounts
    });
  });

  return (
    <>
      <nav class="flex border-b border-gray-200">
        {TABS.map((tab) => {
          const pathname = loc.url.pathname.replace(/\/$/, "");
          const isActive =
            pathname === tab.path ||
            (tab.path !== "/" && pathname.startsWith(tab.path + "/"));
          const Icon = tab.Icon;
          return (
            <a
              key={tab.path}
              href={tab.path}
              data-testid={`${tab.label.toLowerCase()}-nav-link`}
              class={[
                "relative flex flex-1 flex-col items-center py-2 text-center text-sm font-medium transition-colors",
                isActive
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700",
              ]}
            >
              <Icon class="h-5 w-5" />
              {tab.label === "Parcels" && parcelCount.value > 0 && (
                <span class="absolute -right-1 top-1 flex h-3 w-3" data-testid="parcel-notification-dot">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                </span>
              )}
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
