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
docker compose up -d                 # publishes :3939, mounts /mnt/media -> /media
```
Reachable at `http://10.0.101.91:3939` (or `http://lodge-bad-boy:3939`). Runway users enter
their key at `/setup`; the Google path uses `GOOGLE_AI_API_KEY` server-side.

## CUTOVER (Hannibal-gated — live DNS + IP are standing pause items)
1. **Google key** — put a *billing-enabled* Google AI Studio key in `deploy/.env` and Vault
   (the current vault key `253793b5` is free-tier: image quota 0, no Veo; `8fe59ed3` is expired).
2. **DNS** — create `streamroll.thelodge.network` CNAME → `lodge-traefik.thelodge.network`
   (Technitium; his call).
3. **Traefik** — add `deploy/traefik-streamroll.yml` as `route-streamroll.yml` on CT203
   (in a monorepo worktree; `stacks/traefik/config` is a filetree deploy target).
4. **Register IaC** — add a `stacks/streamroll/` entry + a `deploy-targets.yml` row (compose
   shape, host bare-metal `local`, project `streamroll`) so reconcile.py covers it.

## Acceptance (card #1629)
Generate one LODGEFLIX intro end-to-end through the **Google** path (prestige / minimal /
`#E50914` / Gemini Image 3 Pro / Veo 3.1 / netflix.wav) and confirm the mp4 lands in
`/media/Pre-Rolls` matching `lodgeflix_prestige_with_audio.mp4` (h264 1280x720, aac 44100
stereo). **Blocked** until step 1 (paid key) — Veo + gemini-3-pro-image are paid-tier only.
