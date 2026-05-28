# AI Sentinel Security Test Matrix v1

This matrix defines executable and auditable tests for sandbox-only security tools:
- `One-Lin3r`
- `QRLJacking`
- `XOE`

These tests are never part of production request path.

## 1) Environment boundary

- Run only in `docker/security-sandbox` profile `offsec-lab`.
- No production secrets.
- No direct outbound access unless test requires a controlled target.
- Use synthetic fixtures and internal test endpoints.

## 2) Test matrix

| Tool | Test target | Preconditions | Pass criteria | False-positive handling |
|---|---|---|---|---|
| One-Lin3r | Command/rule intelligence coverage | Curated safe command dictionary loaded | Parser classifies command intent into allowed categories and blocks destructive commands | Unknown command -> tag as `needs_review`, never auto-execute |
| QRLJacking | QR login anti-hijack controls | Mock QR login flow with expiring nonce and binding checks | Session cannot be established when nonce/session/device mismatch | If replay blocked by generic auth failure, label as `inconclusive`, require trace replay |
| XOE | XXE parser defense | XML ingestion endpoint in local mock service | External entity resolution blocked; no file/metadata exfiltration path | If endpoint rejects malformed XML before parser, rerun with valid structured payload |

## 3) Sentinel event mapping

- `subdomain_scan` -> recon drift, asset visibility
- `clickjacking_scan` -> web embedding and frame policy
- `credential_exposure_scan` -> leaked credentials intelligence

Risk grade guidance:
- `P0`: confirmed exploitable with business impact
- `P1`: high confidence weakness with likely exploitability
- `P2`: suspicious finding requiring validation
- `P3`: informational or hygiene improvement

## 4) Pipeline integration

Recommended CI stages:
1. `sast-audit` profile
2. `offsec-lab` profile smoke scenarios
3. Sentinel event normalization (`sentinel_event` schema)
4. Report artifact upload and triage gate

## 5) Reporting template

Each test emits:
- test id
- tool
- target
- scenario
- result (`pass|fail|inconclusive`)
- evidence path
- normalized sentinel event (optional)

