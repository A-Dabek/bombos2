import { component$, Slot, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { useLocation } from "@builder.io/qwik-city";
import { streamParcelCount } from "../utils/parcel-count-stream";
import { streamPlanUrgent } from "../utils/plan-urgent-stream";
import Ping from "~/components/shared/Ping";
import {
  HiCubeOutline,
  HiFireOutline,
  HiListBulletOutline,
  HiBanknotesOutline,
  HiShoppingCartOutline,
} from "@qwikest/icons/heroicons";

const TABS = [
  { label: "Paczki", path: "/parcels", Icon: HiCubeOutline, testId: "parcels-nav-link" },
  { label: "Posiłki", path: "/meals", Icon: HiFireOutline, testId: "meals-nav-link" },
  { label: "Listy", path: "/plan", Icon: HiListBulletOutline, testId: "plan-nav-link" },
  { label: "Finanse", path: "/money", Icon: HiBanknotesOutline, testId: "money-nav-link" },
  { label: "Spożywcze", path: "/groceries", Icon: HiShoppingCartOutline, testId: "groceries-nav-link" },
];

export default component$(() => {
  const loc = useLocation();
  const parcelCount = useSignal(0);
  const hasUrgentItems = useSignal(false);

  useVisibleTask$(async ({ cleanup }) => {
    const pStream = await streamParcelCount();
    const uStream = await streamPlanUrgent();

    const iterateParcels = async () => {
      try {
        for await (const count of pStream) {
          parcelCount.value = count;
        }
      } catch (error) {
        console.error("Parcel stream error:", error);
      }
    };

    const iterateUrgent = async () => {
      try {
        for await (const hasUrgent of uStream) {
          hasUrgentItems.value = hasUrgent;
        }
      } catch (error) {
        console.error("Urgent stream error:", error);
      }
    };

    iterateParcels();
    iterateUrgent();

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
              data-testid={tab.testId || `${tab.label.toLowerCase()}-nav-link`}
              class={[
                "relative flex flex-1 flex-col items-center py-2 text-center text-sm font-medium transition-colors",
                isActive
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700",
              ]}
            >
              <Icon class="h-5 w-5" />
              {tab.path === "/parcels" && parcelCount.value > 0 && (
                <Ping
                  class="absolute -right-1 top-1 flex h-3 w-3"
                  data-testid="parcel-notification-dot"
                />
              )}
              {tab.path === "/plan" && hasUrgentItems.value && (
                <Ping
                  class="absolute -right-1 top-1 flex h-3 w-3"
                  data-testid="plan-notification-dot"
                />
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
