import { component$ } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";
import { HiCog6ToothSolid } from "@qwikest/icons/heroicons";

interface AdminButtonProps {
  href: string;
}

export default component$<AdminButtonProps>(({ href }) => {
  return (
    <Link
      href={href}
      data-testid="admin-button"
      class="fixed bottom-4 right-4 flex items-center justify-center w-14 h-14 bg-red-500 rounded-full shadow-lg"
      aria-label="Admin"
    >
      <HiCog6ToothSolid class="w-7 h-7 text-white" />
    </Link>
  );
});
