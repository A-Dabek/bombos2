import { component$ } from "@builder.io/qwik";
import SubNav, { TabItem } from "~/components/shared/SubNav";

const TABS: TabItem[] = [
  { label: "Wydatki", path: "/money/balance", testId: "sub-nav-tab-balance" },
  { label: "Rachunki", path: "/money/bills", testId: "sub-nav-tab-bills" },
  { label: "Kieszonkowe", path: "/money/allowance", testId: "sub-nav-tab-allowance" },
];

export default component$(() => {
  return <SubNav tabs={TABS} />;
});
