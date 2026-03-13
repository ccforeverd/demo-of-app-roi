#!/bin/sh

set -eu

export NODE_ENV="${NODE_ENV:-production}"
export DB_HOST="${DB_HOST:-mysql}"
export DB_PORT="${DB_PORT:-3306}"

PORT=3001 pnpm --filter @demo-of-app-roi/express start &
EXPRESS_PID=$!

PORT=3000 pnpm --filter @demo-of-app-roi/nextjs start &
NEXT_PID=$!

trap 'kill $EXPRESS_PID $NEXT_PID 2>/dev/null || true' INT TERM

wait $EXPRESS_PID $NEXT_PID
