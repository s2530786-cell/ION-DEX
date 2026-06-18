# Security Sandbox (Docker)

Isolated Docker profiles for ION DEX scraping/security testing.

## Profiles

- `sast-audit`: static analysis against project code (read-only mount).
- `scraping-lab`: scraping integration experiments (Scrapling/Firecrawl).
- `offsec-lab`: strict isolated lab for offensive/recon tooling validation.
- `sentinel-lab`: controlled outbound profile for AI Sentinel runners (`Sublist3r`, `Clickjacking-Tester`, `Cr3dOv3r`).

## Usage

From repo root:

```powershell
docker compose -f docker/security-sandbox/docker-compose.yml --profile sast-audit run --build --rm sast-audit
docker compose -f docker/security-sandbox/docker-compose.yml --profile scraping-lab run --rm scraping-lab
docker compose -f docker/security-sandbox/docker-compose.yml --profile offsec-lab up -d offsec-lab
docker compose -f docker/security-sandbox/docker-compose.yml --profile sentinel-lab run --rm sentinel-lab bash /scripts/run-sublist3r.sh example.com
```

`sast-audit` now uses a local prebuilt image (`ion-dex/sast-audit:local`) so Semgrep and Bandit do not need to be reinstalled on every run. Keep `--build` in automation/CI commands so the image is refreshed when the Dockerfile changes.

Enable backend docker runners:

```powershell
$env:ION_SENTINEL_DOCKER = "1"
$env:ION_SENTINEL_VENDOR_ROOT = "d:\vendor-ion-discovery\D4Vinci"
```

Optional P0/P1 webhook:

```powershell
$env:ION_SENTINEL_ALERT_WEBHOOK_URL = "https://hooks.example.com/ion-sentinel"
```

Slack incoming webhook (recommended):

```powershell
$env:ION_SENTINEL_ALERT_CHANNEL = "slack"
$env:ION_SENTINEL_SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/T000/B000/XXXX"
```

Alert delivery tuning:

```powershell
$env:ION_SENTINEL_ALERT_TIMEOUT_MS = "8000"  # 2000..15000
$env:ION_SENTINEL_ALERT_RETRIES = "2"        # 0..5
```

One-click connectivity check (backend must be running on port 8787):

```powershell
curl -X POST http://127.0.0.1:8787/api/sentinel/alert-test -H "Content-Type: application/json" -d "{}"
```

- `200` — test message delivered
- `503` — no webhook/Slack URL configured
- `502` — configured but delivery failed (check URL, network, Slack app)

Stop isolated lab:

```powershell
docker compose -f docker/security-sandbox/docker-compose.yml --profile offsec-lab down
```

## Safety defaults

- Project mount is read-only.
- `cap_drop: ALL`.
- `no-new-privileges`.
- `offsec-lab` has `network_mode: none`.

## Policy

- Offensive repositories are sandbox-only, never linked to business request path.
- No production secrets in sandbox.
- Use dedicated test datasets and synthetic endpoints for security tests.

