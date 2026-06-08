pnpm install --prod --os=android

# Important: This is required for CSRF protection
export ORIGIN=https://termux.bombos.site

# Set production mode
export NODE_ENV=production

# Optional: Define a custom port (default is 3000)
export PORT=3000

# Backup DB with timestamp (YYYYMMDD-HHMM)
cp data/app.db "backup/app-$(date +%Y%m%d-%H%M).db"

pnpm build || true

# For Fastify
pnpm build.server || true

pnpm serve
