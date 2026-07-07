# Qwik City App ⚡️

- [Qwik Docs](https://qwik.dev/)
- [Discord](https://qwik.dev/chat)
- [Qwik GitHub](https://github.com/QwikDev/qwik)
- [@QwikDev](https://twitter.com/QwikDev)
- [Vite](https://vitejs.dev/)

---

## Project Structure

This project is using Qwik with [QwikCity](https://qwik.dev/qwikcity/overview/). QwikCity is just an extra set of tools on top of Qwik to make it easier to build a full site, including directory-based routing, layouts, and more.

Inside your project, you'll see the following directory structure:

```
├── public/
│   └── ...
└── src/
    ├── components/
    │   └── ...
    └── routes/
        └── ...
```

- `src/routes`: Provides the directory-based routing, which can include a hierarchy of `layout.tsx` layout files, and an `index.tsx` file as the page. Additionally, `index.ts` files are endpoints. Please see the [routing docs](https://qwik.dev/qwikcity/routing/overview/) for more info.

- `src/components`: Recommended directory for components.

- `public`: Any static assets, like images, can be placed in the public directory. Please see the [Vite public directory](https://vitejs.dev/guide/assets.html#the-public-directory) for more info.

## Authentication (Google Sign-In + email allowlist)

The app is gated by a Google Sign-In login page — only Gmail addresses listed
in `ALLOWED_EMAILS` can sign in. See `docs/adr-031-google-auth.md` for the
full design.

Required env vars (copy `.env.example` → `.env`):

- `GOOGLE_CLIENT_ID` — OAuth 2.0 Web Client ID from the Google Cloud Console.
- `SESSION_SECRET` — random string, ≥ 16 chars (`openssl rand -hex 32`).
- `ALLOWED_EMAILS` — comma-separated allowlist.

For local development / tests without Google credentials set
`AUTH_DISABLED=true` to bypass the guard. `playwright.config.ts` already sets
this for the e2e preview server.

## Add Integrations and deployment

Use the `pnpm qwik add` command to add additional integrations. Some examples of integrations includes: Cloudflare, Netlify or Express Server, and the [Static Site Generator (SSG)](https://qwik.dev/qwikcity/guides/static-site-generation/).

```shell
pnpm qwik add
```

## Development

Development mode uses [Vite's development server](https://vitejs.dev/). The `dev` command will server-side render (SSR) the output during development.

```shell
pnpm dev
```

> Note: during dev mode, Vite may request a significant number of `.js` files. This does not represent a Qwik production build.

## Preview

The preview command will create a production build of the client modules, a production build of `src/entry.preview.tsx`, and run a local server. The preview server is only for convenience to preview a production build locally and should not be used as a production server.

```shell
pnpm preview
```

## Production

The production build will generate client and server modules by running both client and server build commands. The build command will use Typescript to run a type check on the source code.

```shell
pnpm build
```

## Testing

The project uses Playwright for End-to-End testing and Vitest for unit tests.

- `pnpm e2e` — Run Playwright E2E tests
- `pnpm test.db` — Run Vitest database tests

### E2E Strategy
We are currently transitioning from atomic E2E tests to **User Journey** tests. Guidelines for this transition and future E2E development can be found in [docs/e2e-journey-transition.md](./docs/e2e-journey-transition.md).

## Fastify Server

This app has a minimal [Fastify server](https://fastify.dev/) implementation. After running a full build, you can preview the build using the command:

```
pnpm serve
```

Then visit [http://localhost:3000/](http://localhost:3000/)
