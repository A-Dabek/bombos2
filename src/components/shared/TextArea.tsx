import {
  $,
  component$,
  type QwikIntrinsicElements,
  useId,
  useSignal,
  useVisibleTask$,
} from "@builder.io/qwik";

export type TextAreaProps = QwikIntrinsicElements["textarea"] & {
  label?: string;
  containerClass?: string;
  autoResize?: boolean;
};

export default component$<TextAreaProps>((props) => {
  const {
    label,
    containerClass,
    class: className,
    id: providedId,
    autoResize,
    onInput$,
    ...rest
  } = props;
  const id = providedId || useId();
  const textareaRef = useSignal<HTMLTextAreaElement>();

  const resize = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  const handleInput$ = $((e: InputEvent) => {
    resize(e.target as HTMLTextAreaElement);
  });

  useVisibleTask$(({ track }) => {
    if (!autoResize) return;
    track(() => props.value);
    const el = textareaRef.value;
    if (el) resize(el);
  });

  return (
    <div class={["flex flex-col", containerClass]}>
      {label && (
        <label for={id} class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      <textarea
        {...rest}
        ref={textareaRef}
        id={id}
        rows={autoResize ? rest.rows ?? 1 : rest.rows}
        onInput$={autoResize ? [handleInput$, onInput$] : onInput$}
        class={[
          "border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed",
          autoResize && "resize-none overflow-hidden",
          className,
        ]}
      />
    </div>
  );
});
