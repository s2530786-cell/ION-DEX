#!/bin/sh
set -e
if [ -n "$DATABASE_URL" ]; then
  host=$(echo "$DATABASE_URL" | sed -E 's#.*@([^:/]+).*#\1#')
  user=$(echo "$DATABASE_URL" | sed -E 's#postgresql://([^:]+):.*#\1#')
  db=$(echo "$DATABASE_URL" | sed -E 's#.*/([^/?]+).*#\1#')
  until pg_isready -h "$host" -U "$user" -d "$db"; do
    echo "waiting for postgres..."
    sleep 1
  done
  PGPASSWORD=$(echo "$DATABASE_URL" | sed -E 's#postgresql://[^:]+:([^@]+)@.*#\1#') \
    psql -h "$host" -U "$user" -d "$db" -f /app/src/db/init.sql || true
fi
exec uvicorn src.main:app --host 0.0.0.0 --port 8000
