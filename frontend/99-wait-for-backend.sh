#!/bin/sh
set -e
if ! getent hosts backend >/dev/null 2>&1; then
  echo "ion-dex-frontend: waiting for Docker DNS name 'backend'..."
  i=0
  while [ "$i" -lt 90 ]; do
    if getent hosts backend >/dev/null 2>&1; then
      echo "ion-dex-frontend: backend resolved"
      exit 0
    fi
    i=$((i + 1))
    sleep 1
  done
  echo "ion-dex-frontend: backend not found after 90s (start: docker compose up -d backend)" >&2
  exit 1
fi
