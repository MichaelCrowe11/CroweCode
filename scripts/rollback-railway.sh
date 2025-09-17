#!/usr/bin/env bash
set -euo pipefail

# Simple rollback helper for Railway deployments.
# Usage:
#  ./scripts/rollback-railway.sh            # interactive selection
#  RAILWAY_DEPLOY_ID=xxxxx ./scripts/rollback-railway.sh   # non-interactive
#  RAILWAY_SERVICE=web ./scripts/rollback-railway.sh       # specify service

if ! command -v railway &>/dev/null; then
  echo "Railway CLI not installed. Install with: npm i -g @railway/cli" >&2
  exit 1
fi

SERVICE_NAME=${RAILWAY_SERVICE:-web}

echo "🔍 Fetching recent deployments for service: $SERVICE_NAME" >&2

echo "(You may need to run 'railway link' first if not linked)" >&2

# Capture JSON with deployments (limit 10)
DEPLOY_JSON=$(railway deployments --json 2>/dev/null | jq --arg svc "$SERVICE_NAME" '[.[] | select(.serviceName==$svc)] | sort_by(.createdAt) | reverse | .[:10]')
if [[ -z "$DEPLOY_JSON" || "$DEPLOY_JSON" == "null" ]]; then
  echo "No deployments found for service $SERVICE_NAME" >&2
  exit 1
fi

echo "Recent deployments:" >&2
echo "$DEPLOY_JSON" | jq -r '.[] | "- ID: \(.id)  Status: \(.status)  Created: \(.createdAt)  Commit: \(.meta.sourceVersion | .[0:7])"' >&2

TARGET_ID=${RAILWAY_DEPLOY_ID:-}
if [[ -z "$TARGET_ID" ]]; then
  echo -n "Enter deployment ID to roll back to: " >&2
  read -r TARGET_ID
fi

if ! echo "$DEPLOY_JSON" | jq -e --arg id "$TARGET_ID" '.[] | select(.id==$id)' >/dev/null; then
  echo "Deployment ID $TARGET_ID not in recent list; aborting." >&2
  exit 1
fi

echo "⚠️  Confirm rollback to deployment $TARGET_ID (y/N)? " >&2
read -r CONFIRM
if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
  echo "Aborted." >&2
  exit 0
fi

# Railway currently does not have a direct 'rollback' command; we can redeploy the image if available.
# Placeholder: attempt redeploy by re-running from commit SHA if accessible.
COMMIT_SHA=$(echo "$DEPLOY_JSON" | jq -r --arg id "$TARGET_ID" '.[] | select(.id==$id) | .meta.sourceVersion')
if [[ -z "$COMMIT_SHA" || "$COMMIT_SHA" == "null" ]]; then
  echo "Cannot determine commit SHA for deployment; manual rollback required." >&2
  exit 1
fi

echo "🔁 Attempting to redeploy commit $COMMIT_SHA ..." >&2

git fetch --all --quiet || true
if git cat-file -e "$COMMIT_SHA" 2>/dev/null; then
  git checkout "$COMMIT_SHA"
  echo "Building and pushing new deployment from commit $COMMIT_SHA" >&2
  railway up
  echo "✅ Rollback triggered. Remember to git checkout your previous working branch." >&2
else
  echo "Commit $COMMIT_SHA not found locally. Perform manual rollback via Railway dashboard or fetch the repo state." >&2
  exit 1
fi
