#!/usr/bin/env bash
# DareToConsent Online — Deployment script
#
# Environment and AWS stack context (non-secret, from ops cheat sheet):
# - AWS Account: 607100099518
# - Region: us-west-2
# - AWS CLI profile: worst-prod (SSO)
# - EC2: Amazon Linux 2023 arm64 (t4g.micro) at Elastic IP 54.70.251.49 behind Nginx; PM2 runs Node 20.x app
# - RDS: PostgreSQL 16.x (private; only reachable from EC2 SG on 5432; use strict TLS with RDS CA; DO NOT add sslmode=require)
# - S3: worstinworld-assets-prod (public GET for img/*; EC2 IAM permits PutObject to img/*)
# - SSM: parameters under /worst-prod/... (create a per-project namespace)
# Guardrails:
# - Add new Nginx server blocks; do not modify existing ones. Use unique localhost ports per app.
# - Do not change live PM2 processes for other apps. Validate nginx config before reloads.
#
# Private/local values are loaded from .env (git-ignored). Recommended keys:
#   EC2_SSH_KEY_PATH=/Users/you/.ssh/your-key.pem
#   DEFAULT_REMOTE=ec2-user@54.70.251.49
#   DEFAULT_DOMAIN=daretoconsent.com
#   APP_DIR=/opt/daretoconsent
#   APP_HOST=127.0.0.1
#   APP_PORT=3001
#   CERTBOT_EMAIL=ops@example.com
#   AWS_PROFILE=worst-prod
#   AWS_REGION=us-west-2
#
# Usage:
#   ./deploy.sh user@host daretoconsent.com
# Or relying on .env defaults:
#   ./deploy.sh
# Optional:
#   SSH_OPTS="-i ~/.ssh/id_aws -o StrictHostKeyChecking=no" ./deploy.sh ec2-user@54.70.251.49 daretoconsent.com
#   APP_DIR=/opt/daretoconsent
set -euo pipefail

# Load .env (local machine) for non-committed values
if [[ -f ".env" ]]; then
  set -o allexport
  # shellcheck disable=SC1091
  source ".env"
  set +o allexport
fi

# Defaults (can be overridden by env or .env)
SSH_OPTS="${SSH_OPTS:-}"
if [[ -z "${SSH_OPTS}" && -n "${EC2_SSH_KEY_PATH:-}" ]]; then
  SSH_OPTS="-i ${EC2_SSH_KEY_PATH} -o StrictHostKeyChecking=no"
fi

APP_DIR="${APP_DIR:-/opt/daretoconsent}"
APP_HOST="${APP_HOST:-127.0.0.1}"
APP_PORT="${APP_PORT:-3001}"
SERVICE_NAME="${SERVICE_NAME:-daretoconsent}"
AWS_PROFILE="${AWS_PROFILE:-worst-prod}"
AWS_REGION="${AWS_REGION:-us-west-2}"

# Args (can be omitted if DEFAULT_REMOTE/DEFAULT_DOMAIN are set in .env)
REMOTE="${1:-${DEFAULT_REMOTE:-}}"
DOMAIN="${2:-${DEFAULT_DOMAIN:-}}"
if [[ -z "$REMOTE" || -z "$DOMAIN" ]]; then
  echo "Usage: $0 user@host daretoconsent.com"
  echo "Hint: set DEFAULT_REMOTE and DEFAULT_DOMAIN in .env to omit arguments."
  exit 1
fi

YEL=$'\033[33m'; GRN=$'\033[32m'; RED=$'\033[31m'; NC=$'\033[0m'

# Make sure the remote base directory exists and is writable by the ssh user before rsync
echo "${YEL}==> Ensuring ${APP_DIR} exists and is owned by the SSH user on ${REMOTE}${NC}"
ssh ${SSH_OPTS} -T "${REMOTE}" "sudo mkdir -p '${APP_DIR}' && sudo chown -R \$(id -un):\$(id -gn) '${APP_DIR}'" || true
# Ensure the rsync target parent exists
ssh ${SSH_OPTS} -T "${REMOTE}" "sudo mkdir -p '${APP_DIR}/src-tmp' && sudo chown -R \$(id -un):\$(id -gn) '${APP_DIR}/src-tmp'" || true

echo "${YEL}==> Uploading source (online/ only) to ${REMOTE}${NC}"
# Upload only what the server needs to run (the online app), not large local assets outside online/
# Use --progress for compatibility with older rsync versions
rsync -az --progress -e "ssh ${SSH_OPTS}" --delete \
  --exclude ".git" --exclude "node_modules" --exclude ".DS_Store" \
  ./online/ "${REMOTE}:${APP_DIR}/src-tmp/online"

echo "${YEL}==> Preparing release on remote host${NC}"
ssh ${SSH_OPTS} -T "${REMOTE}" APP_DIR="$APP_DIR" bash -s <<'EOSSH'
set -euo pipefail
APP_DIR="${APP_DIR:-/opt/daretoconsent}"

sudo mkdir -p "${APP_DIR}"
sudo chown -R "$(id -un)":"$(id -gn)" "${APP_DIR}"

mkdir -p "${APP_DIR}/releases" "${APP_DIR}/shared"
ts="$(date +%Y%m%d%H%M%S)"
mv "${APP_DIR}/src-tmp" "${APP_DIR}/releases/${ts}"
ln -sfn "${APP_DIR}/releases/${ts}" "${APP_DIR}/current"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js not found. Install Node 20.x on the instance before deploying." >&2
  exit 2
fi

cd "${APP_DIR}/current/online"
npm ci --omit=dev
EOSSH

echo "${YEL}==> Staging runtime configs (PM2 ecosystem, Nginx vhost)${NC}"
scp ${SSH_OPTS} -q "deploy/nginx/daretoconsent.conf" "${REMOTE}:/tmp/daretoconsent.conf"

ssh ${SSH_OPTS} -T "${REMOTE}" APP_DIR="$APP_DIR" APP_PORT="$APP_PORT" APP_HOST="$APP_HOST" bash -s <<'EOSSH'
set -euo pipefail
APP_DIR="${APP_DIR:-/opt/daretoconsent}"
APP_PORT="${APP_PORT:-3001}"
APP_HOST="${APP_HOST:-127.0.0.1}"

# Always (re)generate PM2 ecosystem using current env
cat > /tmp/dtc.ecosystem.config.js <<EOF
module.exports = {
  apps: [
    {
      name: "daretoconsent",
      cwd: "${APP_DIR}/current",
      script: "online/server/index.js",
      env: {
        NODE_ENV: "production",
        PORT: "${APP_PORT}",
        HOST: "${APP_HOST}"
      },
      instances: 1,
      exec_mode: "fork",
      watch: false,
      autorestart: true,
      max_memory_restart: "250M",
      out_file: "${APP_DIR}/current/online/tmp/pm2-out.log",
      error_file: "${APP_DIR}/current/online/tmp/pm2-err.log"
    }
  ]
}
EOF
EOSSH

echo "${YEL}==> Installing/Updating Nginx vhost for ${DOMAIN}${NC}"
ssh ${SSH_OPTS} -T "${REMOTE}" APP_DIR="$APP_DIR" APP_PORT="$APP_PORT" APP_HOST="$APP_HOST" bash -s -- "${DOMAIN}" <<'EOSSH'
set -euo pipefail
APP_DIR="${APP_DIR:-/opt/daretoconsent}"
APP_PORT="${APP_PORT:-3001}"
APP_HOST="${APP_HOST:-127.0.0.1}"

if ! command -v nginx >/dev/null 2>&1; then
  echo "Nginx not found. Install Nginx on the instance before deploying." >&2
  exit 3
fi

sudo mkdir -p /var/www/letsencrypt

DOM="$1"
VHOST_TMP="/tmp/daretoconsent.conf"
CERT_DIR="/etc/letsencrypt/live/${DOM}"
CERT_OK="no"
if [[ -f "${CERT_DIR}/fullchain.pem" && -f "${CERT_DIR}/privkey.pem" ]]; then
  CERT_OK="yes"
fi

# Replace server_name, cert paths, and upstream in the template we uploaded
if [[ -f "$VHOST_TMP" ]]; then
  # server_name
  sudo sed -i "s/server_name .*/server_name ${DOM} www.${DOM};/" "$VHOST_TMP" || true
  # certificate paths (ensure they point at the correct domain directory)
  sudo sed -i "s|/etc/letsencrypt/live/[^/]\\+/|/etc/letsencrypt/live/${DOM}/|g" "$VHOST_TMP" || true
  # upstream proxy_pass host:port to the app variables
  sudo sed -i -E "s|proxy_pass http://[0-9\\.]+:[0-9]+;|proxy_pass http://${APP_HOST}:${APP_PORT};|g" "$VHOST_TMP" || true
fi

write_conf_http_only() {
  # Minimal HTTP-only vhost so we can issue certs and serve the app immediately
  sudo tee /etc/nginx/conf.d/daretoconsent.conf >/dev/null <<CONF
server {
  listen 80;
  listen [::]:80;
  server_name ${DOM} www.${DOM};

  location /.well-known/acme-challenge/ {
    root /var/www/letsencrypt;
  }

  location / {
    proxy_set_header Host \$host;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_pass http://${APP_HOST}:${APP_PORT};
  }
}
CONF
}

install_conf_with_tls() {
  if [[ -d /etc/nginx/sites-available ]]; then
    sudo mv "\$VHOST_TMP" "/etc/nginx/sites-available/daretoconsent.conf"
    sudo ln -sfn "/etc/nginx/sites-available/daretoconsent.conf" "/etc/nginx/sites-enabled/daretoconsent.conf"
  elif [[ -d /etc/nginx/conf.d ]]; then
    sudo mv "\$VHOST_TMP" "/etc/nginx/conf.d/daretoconsent.conf"
  else
    echo "Unable to locate Nginx vhost directory. Please place the vhost manually." >&2
    exit 4
  fi
}

if [[ "\$CERT_OK" == "yes" ]]; then
  # Certs already present: install full TLS vhost
  install_conf_with_tls
else
  # No certs yet: install HTTP-only vhost so certbot can succeed and site is up on HTTP
  write_conf_http_only
fi

sudo nginx -t
sudo systemctl reload nginx || sudo service nginx reload
EOSSH

echo "${YEL}==> Starting app with PM2${NC}"
ssh ${SSH_OPTS} -T "${REMOTE}" APP_DIR="$APP_DIR" bash -s <<'EOSSH'
set -euo pipefail
APP_DIR="${APP_DIR:-/opt/daretoconsent}"
ECOSYS="/tmp/dtc.ecosystem.config.js"

if ! command -v pm2 >/dev/null 2>&1; then
  echo "PM2 not found; installing globally with npm -g"
  sudo npm i -g pm2
fi

mkdir -p "${APP_DIR}/current/online/tmp"

pm2 startOrReload "${ECOSYS}" --only daretoconsent
pm2 save
pm2 startup systemd -u "$(id -un)" --hp "$HOME" >/dev/null 2>&1 || true
pm2 status daretoconsent || true
EOSSH

echo "${YEL}==> Health check ${GRN}${DOMAIN}${NC}"
for i in 1 2 3; do
  if curl -fsS "https://${DOMAIN}/health" >/dev/null 2>&1; then
    echo "${GRN}OK: HTTPS health passed${NC}"
    break
  elif curl -fsS "http://${DOMAIN}/health" >/dev/null 2>&1; then
    echo "${YEL}WARN: HTTPS unavailable, HTTP health passed (certs not installed yet?)${NC}"
    break
  else
    echo "Health attempt ${i} failed; retrying..."
    sleep 2
  fi
done

echo "${GRN}==> Deploy complete${NC}"
echo "If TLS is not yet provisioned, run on the server:"
echo "  sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN} --redirect --agree-tos -m ${CERTBOT_EMAIL:-YOUR_EMAIL}"