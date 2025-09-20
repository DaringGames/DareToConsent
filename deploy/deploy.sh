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
# Skipping template upload; render Nginx vhost via heredoc to avoid sed -i temp files

ssh ${SSH_OPTS} -T "${REMOTE}" APP_DIR="$APP_DIR" APP_PORT="$APP_PORT" APP_HOST="$APP_HOST" DTC_ADMIN_TOKEN="${DTC_ADMIN_TOKEN:-}" DTC_DIGEST_TO="${DTC_DIGEST_TO:-}" DTC_DIGEST_FROM="${DTC_DIGEST_FROM:-}" DEFAULT_DOMAIN="${DEFAULT_DOMAIN:-}" AWS_REGION="${AWS_REGION:-}" SES_REGION="${SES_REGION:-}" CERTBOT_EMAIL="${CERTBOT_EMAIL:-}" bash -s <<'EOSSH'
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
        HOST: "${APP_HOST}",
        DTC_ADMIN_TOKEN: "${DTC_ADMIN_TOKEN}",
        DTC_DIGEST_TO: "${DTC_DIGEST_TO}",
        DTC_DIGEST_FROM: "${DTC_DIGEST_FROM}",
        DEFAULT_DOMAIN: "${DEFAULT_DOMAIN}",
        AWS_REGION: "${AWS_REGION}",
        SES_REGION: "${SES_REGION}"
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
ssh ${SSH_OPTS} -T "${REMOTE}" APP_DIR="$APP_DIR" APP_PORT="$APP_PORT" APP_HOST="$APP_HOST" CERTBOT_EMAIL="${CERTBOT_EMAIL:-}" bash -s -- "${DOMAIN}" <<'EOSSH'
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
CERT_DIR="/etc/letsencrypt/live/${DOM}"
CERT_OK="no"
if [[ -f "${CERT_DIR}/fullchain.pem" && -f "${CERT_DIR}/privkey.pem" ]]; then
  CERT_OK="yes"
fi

write_conf_http_only() {
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

write_conf_with_tls() {
  sudo tee /etc/nginx/conf.d/daretoconsent.conf >/dev/null <<CONF
server {
  listen 80;
  listen [::]:80;
  server_name ${DOM} www.${DOM};

  location /.well-known/acme-challenge/ {
    root /var/www/letsencrypt;
  }

  # Redirect all HTTP to HTTPS
  location / {
    return 301 https://\$host\$request_uri;
  }
}

server {
  listen 443 ssl http2;
  listen [::]:443 ssl http2;
  server_name ${DOM} www.${DOM};

  ssl_certificate /etc/letsencrypt/live/${DOM}/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/${DOM}/privkey.pem;

  add_header X-Frame-Options SAMEORIGIN;
  add_header X-Content-Type-Options nosniff;
  add_header Referrer-Policy same-origin;

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

if [[ "${CERT_OK}" == "yes" ]]; then
  write_conf_with_tls
  sudo nginx -t
  sudo systemctl reload nginx || sudo service nginx reload
else
  write_conf_http_only
  sudo nginx -t
  sudo systemctl reload nginx || sudo service nginx reload

  if command -v certbot >/dev/null 2>&1; then
    EMAIL="${CERTBOT_EMAIL:-ops@example.com}"
    sudo certbot --nginx -d "${DOM}" -d "www.${DOM}" --non-interactive --agree-tos -m "${EMAIL}" --redirect || true
    if [[ -f "/etc/letsencrypt/live/${DOM}/fullchain.pem" && -f "/etc/letsencrypt/live/${DOM}/privkey.pem" ]]; then
      write_conf_with_tls
      sudo nginx -t
      sudo systemctl reload nginx || sudo service nginx reload
    else
      echo "WARN: certbot did not install certs for ${DOM}. HTTPS may serve a default certificate until certs are issued."
    fi
  else
    echo "WARN: certbot not available; skipping automatic certificate provisioning."
  fi
fi
EOSSH

# Fallback direct certbot run to avoid any variable escaping issues inside heredocs
# Fallback certbot block removed; handled in primary vhost step

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