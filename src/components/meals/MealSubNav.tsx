import { component$ } from "@builder.io/qwik";
import SubNav, { TabItem } from "~/components/shared/SubNav";

const TABS: TabItem[] = [
  { label: "Obiad", path: "/meals/dinner", testId: "sub-nav-tab-dinner" },
  { label: "Kolacja", path: "/meals/supper", testId: "sub-nav-tab-supper" },
];

export default component$(() => {
  return <SubNav tabs={TABS} />;
});
