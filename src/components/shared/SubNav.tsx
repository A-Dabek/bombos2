import { component$ } from "@builder.io/qwik";
import { useLocation, Link } from "@builder.io/qwik-city";
import Ping from "./Ping";

export interface TabItem {
  label: string;
  path: string;
  testId?: string; // Optional explicit test ID (English)
  showPing?: boolean;
}

export interface SubNavProps {
  tabs: TabItem[];
}

export default component$(({ tabs }: SubNavProps) => {
  const loc = useLocation();

  return (
    <nav class="flex border-b border-gray-200 bg-white animate-[fadeIn_0.3s_ease-out]">
      {tabs.map((tab) => {
        const isActive = loc.url.pathname.replace(/\/$/, "").startsWith(tab.path);
        return (
          <Link
            key={tab.path}
            href={tab.path}
            data-testid={tab.testId || `sub-nav-tab-${tab.label.toLowerCase()}`}
            class={[
              "relative flex-1 py-2 text-center text-sm font-medium transition-colors",
              isActive
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700",
            ]}
          >
            {tab.label}
            {tab.showPing && (
              <Ping class="absolute right-2 top-2 h-2 w-2" data-testid="tab-ping" />
            )}
          </Link>
        );
      })}
    </nav>
  );
});
