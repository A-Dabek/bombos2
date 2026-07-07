pnpm install --prod --os=android

# Setup .env if missing
if [ ! -f .env ]; then
  echo "Creating .env from .env.example"
  cp .env.example .env
fi

# Update SESSION_SECRET every run
echo "Generating new SESSION_SECRET..."
SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
if grep -q "^SESSION_SECRET=" .env; then
  sed -i "s/^SESSION_SECRET=.*$/SESSION_SECRET=$SECRET/" .env
else
  echo "SESSION_SECRET=$SECRET" >> .env
fi

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
