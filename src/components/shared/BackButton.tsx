import { component$ } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";
import { HiArrowLeftOutline } from "@qwikest/icons/heroicons";

interface BackButtonProps {
  href: string;
}

export default component$<BackButtonProps>(({ href }) => {
  return (
    <div class="flex items-center mb-4">
      <Link
        href={href}
        data-testid="back-button"
        class="flex items-center text-gray-500 hover:text-gray-700"
      >
        <HiArrowLeftOutline class="w-5 h-5 mr-1" />
        <span>Wróć</span>
      </Link>
    </div>
  );
});
