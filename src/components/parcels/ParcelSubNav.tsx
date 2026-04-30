import { component$ } from "@builder.io/qwik";
import SubNav, { TabItem } from "~/components/shared/SubNav";

const TABS: TabItem[] = [
  { label: "Incoming", path: "/parcels/incoming" },
  { label: "Outgoing", path: "/parcels/outgoing" },
];

export default component$(() => {
  return <SubNav tabs={TABS} />;
});
