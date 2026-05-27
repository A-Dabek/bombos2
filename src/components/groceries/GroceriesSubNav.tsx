import { component$ } from "@builder.io/qwik";
import SubNav from "../shared/SubNav";

export default component$(() => {
  const tabs = [
    { label: "Planowanie", path: "/groceries/planning" },
    { label: "Zakupy", path: "/groceries/shopping" },
  ];

  return <SubNav tabs={tabs} />;
});
