#!/bin/bash
# SessionStart: bootstrap a Claude Code cloud session (fresh clone, no
# node_modules). A no-op on local machines — CLAUDE_CODE_REMOTE is only set
# in cloud sessions. Idempotent; safe on resume.
[ "$CLAUDE_CODE_REMOTE" = "true" ] || exit 0
cd "$CLAUDE_PROJECT_DIR/frontend" || exit 0

if [ ! -d node_modules ]; then
  # --ignore-scripts: node-sass (unused; Vite uses `sass`) fails its native
  # build on current Node and would abort the whole install.
  npm ci --ignore-scripts --no-audit --no-fund >/tmp/holocron-npm-ci.log 2>&1 \
    || { echo "cloud-setup: npm ci failed (see /tmp/holocron-npm-ci.log)"; exit 0; }
fi

# Playwright for UI screenshots (scripts/ui/shot.mjs). Not a project
# dependency, so --no-save keeps package-lock.json untouched. The browser
# download can be blocked by the environment's network policy — then UI
# checks are unavailable and typecheck + vite build are the gate.
if [ ! -d node_modules/playwright ]; then
  npm i --no-save --ignore-scripts --no-audit --no-fund playwright >/tmp/holocron-playwright.log 2>&1
fi
if npx playwright install chromium >>/tmp/holocron-playwright.log 2>&1; then
  echo "cloud-setup: deps installed; Playwright Chromium ready for scripts/ui/shot.mjs"
else
  echo "cloud-setup: deps installed; Playwright browser unavailable (network policy?) — verify with npm run typecheck + npx vite build"
fi
exit 0
