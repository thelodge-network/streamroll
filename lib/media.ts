// Server-side media handling (Lodge fork / LODGEFLIX, card #1629).
//
// Upstream muxes audio in the BROWSER with @ffmpeg/ffmpeg (wasm) and hands the user a
// download — both are workarounds for Vercel's serverless limits. Self-hosted, we run REAL
// ffmpeg in the container and write the finished mp4 STRAIGHT INTO THE MEDIA LIBRARY, so
// Jellyfin/Plex/Emby read the pre-roll from disk with no browser download or hand-carry.
//
// Acceptance target (his hand-made lodgeflix_prestige_with_audio.mp4): h264 1280x720 @24fps,
// aac 44100 stereo. We match that container exactly rather than "improving" an untested encode.

import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

// Where finished pre-rolls land. In the container the media share is mounted at /media, so the
// pre-roll dir is /media/Pre-Rolls (host: /mnt/user/media/Pre-Rolls, verified on disk #1629).
export const PREROLL_DIR = process.env.PREROLL_DIR ?? "/media/Pre-Rolls";
// His sting, already on the NAS — referenced in place, never re-uploaded (#1629).
export const DEFAULT_STING = process.env.STING_PATH ?? path.join(PREROLL_DIR, "netflix.wav");

const TMP_DIR = path.join(os.tmpdir(), "streamroll");

export function slugify(name: string): string {
  return (
    name
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase() || "lodgeflix"
  );
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

// --- temp store for finished Veo bytes (its uri needs the API key; browser can't fetch it) --
export async function stashTempVideo(id: string, bytes: Buffer): Promise<string> {
  await ensureDir(TMP_DIR);
  const p = path.join(TMP_DIR, `${id}.mp4`);
  await fs.writeFile(p, bytes);
  return p;
}
export function tempVideoPath(id: string): string {
  return path.join(TMP_DIR, `${path.basename(id)}.mp4`);
}

// Resolve any of {local tmp path, /api/tmp URL, http(s) URL, data: URL} to a real file on disk.
async function materializeVideo(source: string): Promise<{ file: string; cleanup: boolean }> {
  if (source.startsWith("data:")) {
    const b64 = source.split(",")[1] ?? "";
    await ensureDir(TMP_DIR);
    const p = path.join(TMP_DIR, `mux-${Date.now()}.mp4`);
    await fs.writeFile(p, Buffer.from(b64, "base64"));
    return { file: p, cleanup: true };
  }
  // Our own temp handle served at /api/tmp/<id>
  const m = source.match(/\/api\/tmp\/([\w.-]+?)(?:\.mp4)?$/);
  if (m) return { file: tempVideoPath(m[1]), cleanup: false };
  if (source.startsWith("http")) {
    const res = await fetch(source);
    if (!res.ok) throw new Error(`Failed to fetch video (${res.status})`);
    await ensureDir(TMP_DIR);
    const p = path.join(TMP_DIR, `mux-${Date.now()}.mp4`);
    await fs.writeFile(p, Buffer.from(await res.arrayBuffer()));
    return { file: p, cleanup: true };
  }
  // Absolute path already on disk.
  return { file: source, cleanup: false };
}

function run(cmd: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args);
    let stderr = "";
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("error", reject);
    child.on("close", (code) =>
      code === 0 ? resolve(stderr) : reject(new Error(`${cmd} exited ${code}: ${stderr.slice(-500)}`))
    );
  });
}

export async function ffprobeDuration(file: string): Promise<number> {
  const out = await new Promise<string>((resolve, reject) => {
    const child = spawn("ffprobe", [
      "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", file,
    ]);
    let o = "";
    child.stdout.on("data", (d) => (o += d.toString()));
    child.on("error", reject);
    child.on("close", () => resolve(o.trim()));
  });
  return parseFloat(out) || 0;
}

export interface SaveResult {
  path: string; // absolute path inside the container (/media/Pre-Rolls/<slug>.mp4)
  hostPath: string; // human-facing host path
  filename: string;
  durationSec: number;
}

// Mux the sting onto the rendered video and write the finished pre-roll into the media library.
export async function muxAndSave(opts: {
  videoSource: string;
  name: string;
  audio?: boolean; // mux the sting? (default true)
  stingPath?: string;
}): Promise<SaveResult> {
  await ensureDir(PREROLL_DIR);
  const { file: videoFile, cleanup } = await materializeVideo(opts.videoSource);
  const filename = `LODGEFLIX-${slugify(opts.name)}.mp4`;
  const outPath = path.join(PREROLL_DIR, filename);
  const sting = opts.stingPath ?? DEFAULT_STING;

  const wantAudio = opts.audio !== false;
  const hasSting = wantAudio && (await fs.stat(sting).then(() => true).catch(() => false));

  const args = ["-y", "-i", videoFile];
  if (hasSting) args.push("-i", sting);
  args.push(
    "-map", "0:v:0",
    ...(hasSting ? ["-map", "1:a:0"] : []),
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "24",
    ...(hasSting ? ["-c:a", "aac", "-ar", "44100", "-ac", "2", "-shortest"] : ["-an"]),
    "-movflags", "+faststart",
    outPath
  );
  await run("ffmpeg", args);

  if (cleanup) await fs.unlink(videoFile).catch(() => {});
  const durationSec = await ffprobeDuration(outPath);
  return {
    path: outPath,
    hostPath: outPath.replace(/^\/media\b/, "/mnt/user/media"),
    filename,
    durationSec,
  };
}
