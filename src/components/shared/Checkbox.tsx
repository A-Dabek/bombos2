import { component$, type QwikIntrinsicElements, useId } from "@builder.io/qwik";

export type CheckboxProps = QwikIntrinsicElements["input"] & {
  label?: string;
};

export default component$<CheckboxProps>((props) => {
  const { label, class: className, id: providedId, ...rest } = props;
  const id = providedId || useId();

  return (
    <label for={id} class="flex items-center space-x-2 cursor-pointer">
      <input
        {...rest}
        id={id}
        type="checkbox"
        class={[
          "w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded focus:ring-blue-500",
          className,
        ]}
      />
      {label && <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>}
    </label>
  );
});
