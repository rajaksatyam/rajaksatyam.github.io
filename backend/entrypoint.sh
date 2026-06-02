#!/bin/bash
# =============================================================
#  entrypoint.sh
#  Fetches all secrets from OCI Vault at container startup
#  Uses Instance Principal — no credentials needed on the VM
#  The Oracle VM's Instance Principal must have IAM policy:
#    Allow dynamic-group <your-group> to read secret-bundles in compartment <your-compartment>
# =============================================================

set -e

echo "[entrypoint] Fetching secrets from OCI Vault..."

fetch_secret() {
  local SECRET_OCID=$1
  local VALUE
  VALUE=$(oci secrets secret-bundle get \
    --auth instance_principal \
    --secret-id "$SECRET_OCID" \
    --query "data.\"secret-bundle-content\".content" \
    --raw-output | base64 --decode)
  echo "$VALUE"
}

# Each secret is stored separately in OCI Vault
# Set OCIDs as environment variables in docker-compose.yml
export PORT=5214
export NODE_ENV=production
export MONGO_URI=$(fetch_secret "$SECRET_OCID_MONGO_URI")
export JWT_SECRET=$(fetch_secret "$SECRET_OCID_JWT_SECRET")
export CLIENT_URI=$(fetch_secret "$SECRET_OCID_CLIENT_URI")
export ARGON2_PEPPER=$(fetch_secret "$SECRET_OCID_ARGON2_PEPPER")
export GEMINI_KEY=$(fetch_secret "$SECRET_OCID_GEMINI_KEY")

echo "[entrypoint] Secrets loaded. Starting app..."

exec node dist/server.js