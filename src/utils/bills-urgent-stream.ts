import { server$ } from '@builder.io/qwik-city';
import { isBillsUrgent } from '../db/bills';

export const streamBillsUrgent = server$(async function* () {
  // 5 seconds is enough for production; e2e overrides this to keep tests fast.
  const CHECK_INTERVAL = Number(process.env.BILLS_URGENT_INTERVAL_MS ?? 5000);

  try {
    while (!this.signal.aborted) {
      const urgent = isBillsUrgent();
      yield urgent;

      // Wait for interval or until client disconnects
      await new Promise((resolve) => {
        const timeout = setTimeout(resolve, CHECK_INTERVAL);
        this.signal.addEventListener('abort', () => clearTimeout(timeout));
      });
    }
  } catch (error: unknown) {
    if (error instanceof Error && error.name !== 'AbortError') {
      console.error('Bills urgent stream error:', error);
    }
  }
});
