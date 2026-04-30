import { component$ } from "@builder.io/qwik";
import SubNav, { TabItem } from "~/components/shared/SubNav";

const TABS: TabItem[] = [
  { label: "Dinner", path: "/meals/dinner" },
  { label: "Supper", path: "/meals/supper" },
];

export default component$(() => {
  return <SubNav tabs={TABS} />;
});
