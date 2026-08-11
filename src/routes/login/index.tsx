/**
 * Login page.
 *
 * Renders the Google Identity Services "Sign in with Google" button. When the
 * user completes the sign-in, GIS invokes our JS callback which POSTs the
 * received `credential` (ID token) to /auth/google. That endpoint verifies it,
 * checks the allowlist, sets our long-lived session cookie, and redirects.
 *
 * This page is public (allowed by the auth guard).
 */
import { component$, useVisibleTask$, useSignal } from "@builder.io/qwik";
import { routeLoader$, useLocation } from "@builder.io/qwik-city";

export const useLoginConfig = routeLoader$(({ query }) => {
  const clientId = process.env.GOOGLE_CLIENT_ID ?? "";
  const authDisabled = process.env.AUTH_DISABLED === "true";
  const next = query.get("next") ?? "/";
  return { clientId, authDisabled, next };
});

// Minimal type for the Google Identity Services global.
interface GoogleIdCredentialResponse {
  credential: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (r: GoogleIdCredentialResponse) => void;
            auto_select?: boolean;
            ux_mode?: "popup" | "redirect";
          }) => void;
          renderButton: (el: HTMLElement, options: Record<string, unknown>) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export default component$(() => {
  const cfg = useLoginConfig();
  const loc = useLocation();
  const error = useSignal<string | null>(null);
  const submitting = useSignal(false);

  useVisibleTask$(({ cleanup }) => {
    if (!cfg.value.clientId) {
      error.value = "GOOGLE_CLIENT_ID is not configured on the server.";
      return;
    }

    const SCRIPT_ID = "google-gsi-client";
    const init = () => {
      const g = window.google;
      if (!g) return;
      g.accounts.id.initialize({
        client_id: cfg.value.clientId,
        callback: async (resp: GoogleIdCredentialResponse) => {
          if (submitting.value) return;
          submitting.value = true;
          error.value = null;
          try {
            const res = await fetch("/auth/google", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ credential: resp.credential, next: cfg.value.next }),
              redirect: "follow",
            });
            if (res.redirected) {
              window.location.href = res.url;
              return;
            }
            if (!res.ok) {
              const body = await res.json().catch(() => ({}));
              error.value = body.error ?? `Sign-in failed (${res.status})`;
            } else {
              window.location.href = cfg.value.next || "/";
            }
          } catch (e: any) {
            error.value = e.message ?? "Sign-in failed";
          } finally {
            submitting.value = false;
          }
        },
      });
      const btn = document.getElementById("g-signin-btn");
      if (btn) {
        g.accounts.id.renderButton(btn, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "signin_with",
          shape: "rectangular",
          logo_alignment: "left",
        });
      }
    };

    if (document.getElementById(SCRIPT_ID)) {
      init();
      return;
    }
    const s = document.createElement("script");
    s.id = SCRIPT_ID;
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.defer = true;
    s.onload = () => init();
    s.onerror = () => (error.value = "Failed to load Google Sign-In script");
    document.head.appendChild(s);

    cleanup(() => {
      // Keep the script loaded across navigations; nothing to clean up.
    });
  });

  return (
    <div class="flex min-h-screen flex-col items-center justify-center p-6">
      <h1 class="mb-6 text-2xl font-semibold text-gray-800 dark:text-gray-100">Bombos</h1>
      <p class="mb-6 text-sm text-gray-500 dark:text-gray-400">Zaloguj się, żeby kontynuować</p>

      {cfg.value.authDisabled && (
        <p class="mb-4 rounded bg-yellow-50 dark:bg-yellow-950/50 px-3 py-2 text-sm text-yellow-800 dark:text-yellow-300">
          AUTH_DISABLED=true — logowanie nie jest wymagane.
        </p>
      )}

      {!cfg.value.clientId && (
        <p class="mb-4 rounded bg-red-50 dark:bg-red-950/50 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          Serwer nie ma skonfigurowanego GOOGLE_CLIENT_ID.
        </p>
      )}

      <div id="g-signin-btn" data-testid="google-signin-btn" />

      {submitting.value && (
        <p class="mt-4 text-sm text-gray-500 dark:text-gray-400">Weryfikuję…</p>
      )}
      {error.value && (
        <p class="mt-4 max-w-sm text-center text-sm text-red-600 dark:text-red-400" data-testid="login-error">
          {error.value}
        </p>
      )}

      <p class="mt-8 text-xs text-gray-400">next: {loc.url.searchParams.get("next") ?? "/"}</p>
    </div>
  );
});
