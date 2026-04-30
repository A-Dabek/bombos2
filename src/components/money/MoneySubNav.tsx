import { component$ } from "@builder.io/qwik";
import SubNav, { TabItem } from "~/components/shared/SubNav";

const TABS: TabItem[] = [
  { label: "Balance", path: "/money/balance" },
  { label: "Bills", path: "/money/bills" },
  { label: "Allowance", path: "/money/allowance" },
];

export default component$(() => {
  return <SubNav tabs={TABS} />;
});
