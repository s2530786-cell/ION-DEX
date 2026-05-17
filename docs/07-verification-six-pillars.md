# Verification checklist

Use this file as a short entry point for the six-pillar verification process.

## Current automated baseline

- Encoding: `scripts\check-encoding.ps1`
- Frontend build: `npm run build`
- Frontend E2E smoke: `playwright test`
- Dependency audit: `npm run audit:high`

## Current manual or future baseline

- Pixel review for UI details and screenshots.
- Smart contract unit, integration, fuzz, gas, and security tests.
- Backend API, database, and load tests.
- Testnet deployment and rollback drills.

See `docs/verification-six-pillars.md` for the full checklist.
