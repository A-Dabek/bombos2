import { component$, type QwikIntrinsicElements, useId } from "@builder.io/qwik";

export type TextInputProps = QwikIntrinsicElements["input"] & {
  label?: string;
  containerClass?: string;
  list?: string;
};

export default component$<TextInputProps>((props) => {
  const { label, containerClass, class: className, id: providedId, type = "text", ...rest } = props;
  const id = providedId || useId();

  return (
    <div class={["flex flex-col", containerClass]}>
      {label && (
        <label for={id} class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      <input
        {...rest}
        id={id}
        type={type}
        class={[
          "border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed",
          className,
        ]}
      />
    </div>
  );
});
