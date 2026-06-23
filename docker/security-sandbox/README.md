# Security Sandbox (Docker)

Isolated Docker profiles for ION DEX scraping/security testing.

## Profiles

- `sast-audit`: static analysis against project code (read-only mount).
- `scraping-lab`: scraping integration experiments (Scrapling/Firecrawl).
- `offsec-lab`: strict isolated lab for offensive/recon tooling validation.
- `sentinel-lab`: controlled outbound profile for AI Sentinel runners (`Sublist3r`, `Clickjacking-Tester`, `Cr3dOv3r`).
- `pentagi`: local-only Pentagi audit sandbox (`pentagi`, `pentagi-agent`, `pentagi-pgvector`, `pentagi-scraper`).

## Usage

From repo root:

```powershell
docker compose -f docker/security-sandbox/docker-compose.yml --profile sast-audit run --build --rm sast-audit
docker compose -f docker/security-sandbox/docker-compose.yml --profile scraping-lab run --rm scraping-lab
docker compose -f docker/security-sandbox/docker-compose.yml --profile offsec-lab up -d offsec-lab
docker compose -f docker/security-sandbox/docker-compose.yml --profile sentinel-lab run --rm sentinel-lab bash /scripts/run-sublist3r.sh example.com
scripts\run-pentagi-audit.cmd
```

`sast-audit` now uses a local prebuilt image (`ion-dex/sast-audit:local`) so Semgrep and Bandit do not need to be reinstalled on every run. Keep `--build` in automation/CI commands so the image is refreshed when the Dockerfile changes.

## Pentagi audit sandbox

Pentagi is bound to localhost by default and is not a production service. Keep provider keys in environment variables only.

```powershell
# Local-only web UI/API
$env:PENTAGI_LISTEN_IP = "127.0.0.1"
$env:PENTAGI_LISTEN_PORT = "18443"

# Optional: pull images before start
$env:PENTAGI_AUDIT_PULL = "1"

scripts\run-pentagi-audit.cmd
```

The `pentagi` profile starts:

- `pentagi`: Pentagi web/API service, default `https://127.0.0.1:18443`.
- `pentagi-agent`: controlled audit execution image placeholder / default pentest image target. It is not a second Pentagi backend and does not expose web/API ports; Pentagi can use the same image name via `DOCKER_DEFAULT_IMAGE_FOR_PENTEST` when scheduling controlled Docker-socket pentest containers.
- `pentagi-pgvector`: local pgvector database, default bound to `127.0.0.1:15432`.
- `pentagi-scraper`: local scraper service, default bound to `127.0.0.1:19443`.

Register a daily Windows scheduled task:

```powershell
.\scripts\register-pentagi-audit-task.ps1 -Time 02:30
schtasks /Run /TN ION-DEX-Pentagi-Audit
```

Remove it:

```powershell
.\scripts\register-pentagi-audit-task.ps1 -Unregister
```

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
docker compose -f docker/security-sandbox/docker-compose.yml --profile pentagi down
```

## Safety defaults

- Project mount is read-only.
- `cap_drop: ALL` where compatible with the service role.
- `no-new-privileges` where compatible with the service role.
- `offsec-lab` has `network_mode: none`.
- Pentagi ports default to `127.0.0.1` bindings.

## Policy

- Offensive repositories are sandbox-only, never linked to business request path.
- No production secrets in sandbox.
- Use dedicated test datasets and synthetic endpoints for security tests.
