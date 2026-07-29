#!/bin/sh
set -e

# Generate runtime configuration from environment variables
# This runs at container startup, not during build
cat > /usr/share/nginx/html/runtime-config.js << EOF
window.RUNTIME_CONFIG = {
  BACKEND_URL: "${BACKEND_URL:-http://localhost:8080}"
};
EOF

exec "$@"

