import type { ClassList } from "@builder.io/qwik";

interface PingProps {
  color?: "red" | "blue";
  class?: ClassList;
  "data-testid"?: string;
}

/**
 * A notification ping component.
 * Layout and positioning should be handled via the 'class' prop at usage sites.
 */
export const Ping = (props: PingProps) => {
  const color = props.color || "red";
  const pingColorClass = color === "red" ? "bg-red-400" : "bg-blue-400";
  const dotColorClass = color === "red" ? "bg-red-500" : "bg-blue-500";

  return (
    <span class={props.class} data-testid={props["data-testid"]}>
      <span
        class={[
          "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
          pingColorClass,
        ]}
      ></span>
      <span
        class={["relative inline-flex rounded-full h-full w-full", dotColorClass]}
      ></span>
    </span>
  );
};

export default Ping;
