import { component$ } from "@builder.io/qwik";
import SubNav, { TabItem } from "~/components/shared/SubNav";

const TABS: TabItem[] = [
  { label: "Odbierz", path: "/parcels/incoming", testId: "sub-nav-tab-incoming" },
  { label: "Nadaj", path: "/parcels/outgoing", testId: "sub-nav-tab-outgoing" },
];

export default component$(() => {
  return <SubNav tabs={TABS} />;
});
