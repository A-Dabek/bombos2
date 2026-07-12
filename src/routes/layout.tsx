import { component$, Slot, useSignal, useVisibleTask$, useContextProvider, $ } from "@builder.io/qwik";
import { useLocation, routeLoader$, Link } from "@builder.io/qwik-city";
import { streamParcelCount } from "../utils/parcel-count-stream";
import { streamPlanUrgent } from "../utils/plan-urgent-stream";
import { streamBillsUrgent } from "../utils/bills-urgent-stream";
import Ping from "~/components/shared/Ping";
import { RefreshContext } from "~/constants/refresh";
import { getHiddenTabs } from "~/db/settings";
import {
  HiCubeOutline,
  HiFireOutline,
  HiListBulletOutline,
  HiBanknotesOutline,
  HiShoppingCartOutline,
  HiCog6ToothOutline,
} from "@qwikest/icons/heroicons";

const TABS = [
  { label: "Paczki", path: "/parcels", Icon: HiCubeOutline, testId: "parcels-nav-link" },
  { label: "Posiłki", path: "/meals", Icon: HiFireOutline, testId: "meals-nav-link" },
  { label: "Listy", path: "/plan", Icon: HiListBulletOutline, testId: "plan-nav-link" },
  { label: "Finanse", path: "/money", Icon: HiBanknotesOutline, testId: "money-nav-link" },
  { label: "Spożywcze", path: "/groceries", Icon: HiShoppingCartOutline, testId: "groceries-nav-link" },
];

export const useSettings = routeLoader$(() => {
  return getHiddenTabs();
});

export default component$(() => {
  const loc = useLocation();
  const settings = useSettings();
  const parcelCount = useSignal(0);
  const hasUrgentItems = useSignal(false);
  const isBillsUrgent = useSignal(false);
  const refreshSignal = useSignal(0);

  useContextProvider(RefreshContext, refreshSignal);

  const triggerRefresh = $(() => {
    refreshSignal.value++;
  });

  useVisibleTask$(async ({ cleanup }) => {
    // Don't start background streams on the login page — the user is
    // unauthenticated there and all /api/* calls would return 401.
    if (typeof window !== "undefined" && window.location.pathname.startsWith("/login")) {
      return;
    }
    let active = true;

    const iterateParcels = async () => {
      while (active) {
        try {
          const pStream = await streamParcelCount();
          for await (const count of pStream) {
            if (!active) break;
            parcelCount.value = count;
          }
        } catch (error) {
          if (active) {
            console.error("Parcel stream error, retrying...", error);
          }
        }
        if (active) {
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }
    };

    const iterateUrgent = async () => {
      while (active) {
        try {
          const uStream = await streamPlanUrgent();
          for await (const hasUrgent of uStream) {
            if (!active) break;
            hasUrgentItems.value = hasUrgent;
          }
        } catch (error) {
          if (active) {
            console.error("Urgent stream error, retrying...", error);
          }
        }
        if (active) {
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }
    };

    const iterateBills = async () => {
      while (active) {
        try {
          const bStream = await streamBillsUrgent();
          for await (const urgent of bStream) {
            if (!active) break;
            isBillsUrgent.value = urgent;
          }
        } catch (error) {
          if (active) {
            console.error("Bills stream error, retrying...", error);
          }
        }
        if (active) {
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }
    };

    iterateParcels();
    iterateUrgent();
    iterateBills();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        triggerRefresh();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    cleanup(() => {
      active = false;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    });
  });

  const isLogin = loc.url.pathname.startsWith("/login");
  const isSettings = loc.url.pathname.startsWith("/settings");

  return (
    <>
      {!isLogin && (
        <nav class="flex border-b border-gray-200">
          {TABS.filter((tab) => !settings.value.includes(tab.path)).map((tab) => {
            const pathname = loc.url.pathname.replace(/\/$/, "");
            const isActive =
              pathname === tab.path ||
              (tab.path !== "/" && pathname.startsWith(tab.path + "/"));
            const Icon = tab.Icon;
            return (
              <Link
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
                {tab.path === "/money" && isBillsUrgent.value && (
                  <Ping
                    class="absolute -right-1 top-1 flex h-3 w-3"
                    data-testid="money-notification-dot"
                  />
                )}
                {tab.label}
              </Link>
            );
          })}
          <Link
            href="/settings"
            data-testid="settings-nav-link"
            class={[
              "relative flex flex-shrink-0 flex-col items-center px-3 py-2 text-center text-sm font-medium transition-colors",
              isSettings
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700",
            ]}
          >
            <HiCog6ToothOutline class="h-5 w-5" />
          </Link>
        </nav>
      )}
      <main>
        <Slot />
      </main>
    </>
  );
});
