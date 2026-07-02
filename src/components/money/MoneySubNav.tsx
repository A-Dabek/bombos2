import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import SubNav, { TabItem } from "~/components/shared/SubNav";
import { streamBillsUrgent } from "~/utils/bills-urgent-stream";

export default component$(() => {
  const isBillsUrgent = useSignal(false);

  useVisibleTask$(async ({ cleanup }) => {
    let active = true;
    const iterateBills = async () => {
      while (active) {
        try {
          const bStream = await streamBillsUrgent();
          for await (const urgent of bStream) {
            if (!active) break;
            isBillsUrgent.value = urgent;
          }
        } catch (error) {
          if (active) console.error("Bills stream error in SubNav:", error);
        }
        if (active) await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    };
    iterateBills();
    cleanup(() => { active = false; });
  });

  const tabs: TabItem[] = [
    { label: "Przepływy", path: "/money/flows", testId: "sub-nav-tab-flows" },
    { label: "Wydatki", path: "/money/balance", testId: "sub-nav-tab-balance" },
    { label: "Rachunki", path: "/money/bills", testId: "sub-nav-tab-bills", showPing: isBillsUrgent.value },
    { label: "Kieszonkowe", path: "/money/allowance", testId: "sub-nav-tab-allowance" },
  ];

  return <SubNav tabs={tabs} />;
});
