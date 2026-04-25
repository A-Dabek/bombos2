pnpm install --prod --os=android

# Important: This is required for CSRF protection
export ORIGIN=https://your-domain.com

# Set production mode
export NODE_ENV=production

# Optional: Define a custom port (default is 3000)
export PORT=3000

pnpm build || true

# For Fastify
pnpm build.server || true

pnpm serve
