---
name: kurmah-netbird-infra
description: "DO context kurmah — droplet netbird (vpn.kurmah.studio, NetBird only) + droplet slur (slur.kurmah.studio, Traefik + compose); key ~/.ssh/kurmah_ed25519"
metadata:
  node_type: memory
  type: reference
  originSessionId: a973c217-4688-4d45-bc0e-b2a405c47087
  modified: 2026-09-28T09:30:30.084Z
---

- doctl context `kurmah` (not the current default `versante`) — always pass `--context kurmah`. Region blr1. Created 2026-09-28.
- SSH to both as root with `~/.ssh/kurmah_ed25519` (DO key `kurmah-admin`, ID 59644142).
- DNS: Cloudflare zone `kurmah.studio`, all records DNS-only (grey cloud).

**netbird** — OWNER RULE: dedicated to NetBird only, never co-host other services.
- ID 604292766, s-1vcpu-2gb, 134.209.152.230, tag/firewall `netbird`/`netbird-fw` (22, 80, 443/tcp, 3478/udp).
- Official getting-started.sh (Traefik + embedded Dex) in `/opt/netbird`; dashboard https://vpn.kurmah.studio. DNS `vpn` A + `*.vpn` CNAME.

**slur** — issue #336.
- ID 604296442, s-1vcpu-1gb + 1 GB swap, 168.144.186.50, tag/firewall `slur`/`slur-fw` (22, 80, 443/tcp). DNS `slur` A.
- Traefik v3.6 at `/opt/traefik` (network `web`, entrypoints web/websecure, resolver `letsencrypt` TLS-ALPN, no timeouts).
- App compose `/opt/slur/docker-compose.yml`: service `slur`, image `slur:latest` (pull_policy never), port 2567, `/healthz` healthcheck via node fetch.
- Deploy: `scripts/deploy.sh` (since dc2af77) — builds linux/amd64, `docker save | gzip | ssh … docker load`, recreates `slur`, polls `https://slur.kurmah.studio/healthz`. Override host/key/dir via `SLUR_HOST`/`SLUR_KEY`/`SLUR_DIR`.
