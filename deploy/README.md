# LODGEFLIX — self-host deploy (card #1629)

Self-hosted StreamRoll fork for the Lodge media servers. Dual-provider: **Runway** (BYOK,
in-browser) **and direct Google** (Gemini image + Veo 3.1 video, server key). Server-side
ffmpeg mux; finished pre-rolls written straight into `/media/Pre-Rolls` for Jellyfin/Plex/Emby.

## What the fork adds over upstream
- `lib/providers.ts` — dual-provider seam; model → provider routing (image + video chosen
  independently, so *Gemini image + Runway gen4.5* keeps working). Google path uses `@google/genai`.
- `lib/runway.ts` — new `styleMotionVeo` map (Veo wants flowing prose, not gen4.5's `[00:00]`
  timestamps) + Veo-aware `buildPrompts`.
- `lib/media.ts` — server-side ffmpeg mux + write into the media library (real ffmpeg, not wasm).
- `app/api/{image,video/start,video/poll}` — dispatch by provider; `app/api/save` (mux→media);
  `app/api/tmp/[id]` (serve finished Veo bytes).
- `Dockerfile` (+ `output: "standalone"`), `deploy/` — container + estate wiring.

## Build
```
docker build -t lodge/streamroll:0.1.0 .
```

## Run (on lodge-bad-boy)
```
cd deploy && cp .env.example .env   # fill GOOGLE_AI_API_KEY from Vaultwarden
docker compose up -d                 # container: lodge-lodgeflix, own address on lodge-macvlan101, no published port
```
Reachable at `https://lodgeflix.thelodge.network` (Authelia) or directly at
`http://10.0.101.108:3000` — moved off the original bridge+`:3939`-published-port setup onto
its own macvlan address 2026-09-08 (then .119), and re-addressed to **10.0.101.108** on
2026-09-21 by the #2454 IPTV re-IP. Prefer the name `lodge-lodgeflix.thelodge.network`, which
is what the live Traefik backend now uses and what survives the next renumber. Runway users enter their key at `/setup`; the
Google path uses `GOOGLE_AI_API_KEY` server-side.

## CUTOVER — DONE 2026-09-07 (card #1629)

All four steps executed by B.A. at Hannibal's direction ("lodgeflix make it happen", which
settled the standing live-DNS gate). LIVE at **https://lodgeflix.thelodge.network**.

1. **Google key** — RESOLVED. The working key is the `API Token` field on Vaultwarden item
   **`69985760` "Google AI Studio"**, verified against `GET /v1beta/models` before wiring:
   `gemini-3-pro-image-preview`, `veo-3.1-generate-preview`, `gemini-2.5-flash-image` all
   available. *** The keys this README used to name as blockers (`253793b5` free-tier,
   `8fe59ed3` expired) NO LONGER EXIST — deleted from the vault and deleted upstream on the
   AI Studio side. Do not go looking for them. ***
2. **DNS** — `lodgeflix.thelodge.network` CNAME -> `lodge-traefik.thelodge.network`, TTL 3600,
   via `lodge-lib/technitium.add_record`. DNSSEC signed on write.
3. **Traefik** — `deploy/traefik-lodgeflix.yml` originally deployed to CT203 as
   `/opt/traefik/config/route-lodgeflix.yml` via `lodge-lib/traefik.add_route`. Behind Authelia.
   CT203 was retired 2026-09-10 (#1849) — Traefik now runs dockerized on lodge-bad-boy itself
   and the route carried over to `/srv/traefik/config/route-lodgeflix.yml`; backend URL
   corrected 2026-09-19 (#2281) from the stale `10.0.101.91:3939` to the macvlan address.
   **The copy in this directory is NO LONGER a mirror of live** — live
   `/srv/traefik/config/route-lodgeflix.yml` addresses `lodge-lodgeflix.thelodge.network:3000`
   by name (#2454). Treat `/srv/traefik/config/` as authoritative, not this file.
4. **Register IaC** — DONE 2026-09-19 (#2281): `stacks/lodgeflix/` in the `thelodge` repo
   (renamed from `stacks/streamroll/`, which had already been captured 2026-09-19 under
   #2224 before the canonical name was settled). Live container renamed `streamroll` ->
   `lodge-lodgeflix` to match at the same time; Nautobot `dns_name` (now on 10.0.101.108) set to
   `lodge-lodgeflix`. `deploy-targets.yml` row added (`stack: lodgeflix`, compose image-pin
   coverage, `project: deploy`) so reconcile.py's nightly `c_deploy_drift()` covers it.

### Where output goes — two directories on purpose
`PREROLL_DIR=/media/Pre-Rolls` is the WORKSHOP: it holds `netflix.wav` (the sting the ffmpeg
mux needs) and every prior render. Jellyfin's Local Intros plugin plays from `/media/intros` —
copy the keeper across to promote it. Do not point generation straight at `intros`: the mux
loses its sting and every experiment becomes a pre-roll.

## Acceptance (card #1629)
Generate one LODGEFLIX intro end-to-end through the **Google** path (prestige / minimal /
`#E50914` / Gemini Image 3 Pro / Veo 3.1 / netflix.wav) and confirm the mp4 lands in
`/media/Pre-Rolls` matching `lodgeflix_prestige_with_audio.mp4` (h264 1280x720, aac 44100
stereo). **Blocked** until step 1 (paid key) — Veo + gemini-3-pro-image are paid-tier only.
