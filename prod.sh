pnpm install --prod

# Important: This is required for CSRF protection
export ORIGIN=https://your-domain.com

# Set production mode
export NODE_ENV=production

# Optional: Define a custom port (default is 3000)
export PORT=3000

# For Fastify
pnpm build.server

pnpm serve
