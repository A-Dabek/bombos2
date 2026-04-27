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
        class="fixed bottom-4 right-4 flex items-center justify-center w-14 h-14 bg-red-500 rounded-full shadow-lg"
        aria-label="Admin"
      >
        <HiCog6ToothSolid class="w-7 h-7 text-white" />
      </Link>
    </div>
  );
});