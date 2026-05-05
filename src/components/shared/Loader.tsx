import { component$ } from "@builder.io/qwik";

interface LoaderProps {
  /**
   * sm: h-5 w-5
   * lg: h-10 w-10 (default)
   */
  size?: "sm" | "lg";
  color?: string;
  class?: string;
}

export default component$<LoaderProps>((props) => {
  const sizeClass = props.size === "sm" ? "h-5 w-5" : "h-10 w-10";

  // Default to border-blue-600 unless specified
  // We use border-b-2 for the spinning effect
  const colorClass = props.color || "border-blue-600";

  return (
    <div
      data-testid="loader"
      class={[
        "animate-spin rounded-full border-b-2",
        sizeClass,
        colorClass,
        props.class,
      ]}
    ></div>
  );
});
