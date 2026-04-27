import { component$ } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";
import { HiCog6ToothSolid } from "@qwikest/icons/heroicons";
import MealRandomizer from "./MealRandomizer";

interface MealPageProps {
  category: "dinner" | "supper";
}

export default component$<MealPageProps>((props) => {
  const title = props.category === "dinner" ? "Dinner" : "Supper";

  return (
    <div class="relative min-h-screen">
      <div class="flex items-center justify-between px-4 py-4">
        <h1 class="text-2xl font-bold text-gray-800">{title}</h1>
      </div>

      <MealRandomizer category={props.category} />

      <Link
        href={`/meals/${props.category}/admin`}
        class="fixed bottom-4 right-4 flex items-center justify-center w-12 h-12 bg-red-50 rounded-full shadow-lg hover:bg-red-100 transition-colors"
        aria-label="Admin"
      >
        <HiCog6ToothSolid class="w-6 h-6 text-red-500" />
      </Link>
    </div>
  );
});