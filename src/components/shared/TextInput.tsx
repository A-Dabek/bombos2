import { component$, type QwikIntrinsicElements, useId } from "@builder.io/qwik";

export type TextInputProps = QwikIntrinsicElements["input"] & {
  label?: string;
  containerClass?: string;
};

export default component$<TextInputProps>((props) => {
  const { label, containerClass, class: className, id: providedId, type = "text", ...rest } = props;
  const id = providedId || useId();

  return (
    <div class={["flex flex-col", containerClass]}>
      {label && (
        <label for={id} class="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        {...rest}
        id={id}
        type={type}
        class={[
          "border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed",
          className,
        ]}
      />
    </div>
  );
});
