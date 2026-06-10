import { server$ } from '@builder.io/qwik-city';
import { hasUrgentPlanItems } from '../db/plan';

export const streamPlanUrgent = server$(async function* () {
  const CHECK_INTERVAL = 1000; // 1 second

  try {
    while (!this.signal.aborted) {
      const hasUrgent = hasUrgentPlanItems();
      yield hasUrgent;

      // Wait for interval or until client disconnects
      await new Promise((resolve) => {
        const timeout = setTimeout(resolve, CHECK_INTERVAL);
        this.signal.addEventListener('abort', () => clearTimeout(timeout));
      });
    }
  } catch (error: unknown) {
    if (error instanceof Error && error.name !== 'AbortError') {
      console.error('Plan urgent stream error:', error);
    }
  }
});
