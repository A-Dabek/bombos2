import { server$ } from '@builder.io/qwik-city';
import { getIncompleteParcelsCount } from '../db/parcels';

export const streamParcelCount = server$(async function* () {
  const CHECK_INTERVAL = 1000; // 1 second

  try {
    while (!this.signal.aborted) {
      const count = getIncompleteParcelsCount();
      yield count;

      // Wait for interval or until client disconnects
      await new Promise((resolve) => {
        const timeout = setTimeout(resolve, CHECK_INTERVAL);
        this.signal.addEventListener('abort', () => clearTimeout(timeout));
      });
    }
  } catch (error: unknown) {
    // AbortError is expected when client disconnects; only log unexpected errors
    if (error instanceof Error && error.name !== 'AbortError') {
      console.error('Parcel count stream error:', error);
    }
  }
});
