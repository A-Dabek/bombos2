import { component$, useSignal, useVisibleTask$, $ } from "@builder.io/qwik";
import { HiSparklesSolid } from "@qwikest/icons/heroicons";
import type { MealRow } from "~/db/meals";

interface MealRandomizerProps {
  category: "breakfast" | "dinner" | "supper";
}

export default component$<MealRandomizerProps>((props) => {
  const meals = useSignal<MealRow[]>([]);
  const shuffledMeals = useSignal<MealRow[]>([]);
  const currentIndex = useSignal(0);
  const isExhausted = useSignal(false);
  const isLoaded = useSignal(false);
  const clickKey = useSignal(0);

  // Fetch meals on mount
  useVisibleTask$(async ({ track }) => {
    track(() => props.category);

    const response = await fetch(`/api/meals/${props.category}`);
    const data = await response.json();
    meals.value = data;
    isLoaded.value = true;
  });

  const handleClick = $(() => {
    // Bump key to trigger button animation
    clickKey.value++;

    // If exhausted, shuffle and restart
    if (isExhausted.value) {
      const shuffled = fisherYates([...meals.value]);
      shuffledMeals.value = shuffled;
      currentIndex.value = 0;
      isExhausted.value = false;
      // Immediately advance to show first meal in new cycle
      currentIndex.value = 1;
      return;
    }

    // If no meals loaded yet or shuffling fresh
    if (shuffledMeals.value.length === 0 && meals.value.length > 0) {
      const shuffled = fisherYates([...meals.value]);
      shuffledMeals.value = shuffled;
      // Immediately show first meal after shuffle
      currentIndex.value = 1;
      return;
    }

    // Advance pointer
    if (currentIndex.value >= shuffledMeals.value.length) {
      isExhausted.value = true;
      return;
    }

    currentIndex.value++;
    if (currentIndex.value >= shuffledMeals.value.length) {
      isExhausted.value = true;
    }
  });

  // Get current meal to display
  const getCurrentMeal = () => {
    if (!isLoaded.value) return null;
    if (isExhausted.value) return null;
    if (shuffledMeals.value.length === 0) return null;
    if (currentIndex.value === 0) return null;
    return shuffledMeals.value[currentIndex.value - 1];
  };

  const currentMeal = getCurrentMeal();

  return (
    <div class="flex flex-col items-center justify-center p-8">
      <button
        key={clickKey.value}
        onClick$={handleClick}
        class="flex flex-col items-center justify-center w-32 h-32 rounded-full bg-blue-50 hover:bg-blue-100 transition-colors animate-[scaleUpDown_0.2s_ease-out]"
      >
        <HiSparklesSolid class="w-16 h-16 text-blue-600" />
        <span class="text-xs text-blue-600 font-medium">Roll</span>
      </button>

      {currentMeal && (
        <p
          key={currentMeal.id}
          class="mt-6 text-2xl font-semibold text-gray-800 animate-[fadeIn_0.3s_ease-out]"
        >
          {currentMeal.name}
        </p>
      )}

      {isExhausted.value && (
        <p
          key="picky-eater"
          class="mt-6 text-lg text-gray-600 italic animate-[fadeIn_0.3s_ease-out]"
        >
          You're a picky eater
        </p>
      )}
    </div>
  );
});

// Fisher-Yates shuffle
function fisherYates<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}