// Provider abstraction (Lodge fork / LODGEFLIX, card #1629).
//
// Upstream StreamRoll is Runway-only: "Gemini Image 3 Pro" and "Veo 3.x" in the UI are
// Runway *catalog* names — every call is brokered through the Runway SDK. This module adds a
// second, DIRECT provider that talks to Google's Gemini API (image) and Veo (video) with no
// Runway in the middle. It is a dual-provider seam, NOT a rip-and-replace: the provider is
// chosen PER STEP from the selected model, so his hero combo — Gemini image + Runway gen4.5
// video — keeps working, and he can also run fully-Google to stop paying Runway credits to
// broker a Google call.
//
// Credentials: Runway stays BYOK (x-runway-key header, browser). Google is a SERVER secret
// (GOOGLE_AI_API_KEY in .env, sourced from Vaultwarden) — never sent to the browser.
//
// API shapes here were verified against @google/genai 2.21.0 type defs + Google's Veo /
// image-generation docs on 2026-09-05, not guessed.

import { GoogleGenAI } from "@google/genai";
import type { GenerationParams, ImageModel, VideoModel } from "./runway";
import { buildPrompts } from "./runway";

export type Provider = "runway" | "google";

// ---- model → provider routing -------------------------------------------------------------
const GOOGLE_IMAGE_MODELS: ReadonlySet<ImageModel> = new Set<ImageModel>([
  "gemini_image3_pro",
  "gemini_2.5_flash",
]);
const GOOGLE_VIDEO_MODELS: ReadonlySet<VideoModel> = new Set<VideoModel>([
  "veo3",
  "veo3.1",
  "veo3.1_fast",
]);

export function imageProvider(model: ImageModel | undefined): Provider {
  return model && GOOGLE_IMAGE_MODELS.has(model) ? "google" : "runway";
}
export function videoProvider(model: VideoModel | undefined): Provider {
  return model && GOOGLE_VIDEO_MODELS.has(model) ? "google" : "runway";
}

// ---- app model id → real Google model id --------------------------------------------------
const GOOGLE_IMAGE_ID: Record<string, string> = {
  gemini_image3_pro: "gemini-3-pro-image",
  "gemini_2.5_flash": "gemini-2.5-flash-image",
};
const GOOGLE_VIDEO_ID: Record<string, string> = {
  "veo3.1": "veo-3.1-generate-preview",
  "veo3.1_fast": "veo-3.1-fast-generate-preview",
  veo3: "veo-3.1-generate-preview", // no veo-3.0 on the Gemini API; fall through to 3.1
};

// Veo 3.1 accepts ONLY 4, 6 or 8 seconds. Several styles are choreographed to 5 — 6 is the
// natural fit (task #1629 trap b). Clamp any requested duration to the nearest legal value.
export function veoDuration(requested: number | undefined): number {
  const allowed = [4, 6, 8];
  const d = requested ?? 6;
  if (allowed.includes(d)) return d;
  return allowed.reduce((best, v) => (Math.abs(v - d) < Math.abs(best - d) ? v : best), 6);
}

// ---- pricing (for the "cost per intro vs Runway" report the card asks for) -----------------
// USD, verified against Google AI pricing 2026-09-05. Veo 3.1 bills per output second.
export const GOOGLE_PRICING = {
  veoPerSecondUSD: { "veo-3.1-generate-preview": 0.4, "veo-3.1-fast-generate-preview": 0.15 } as Record<string, number>,
  imagePerCallUSD: { "gemini-3-pro-image": 0.134, "gemini-2.5-flash-image": 0.039 } as Record<string, number>,
};

function googleClient(): GoogleGenAI {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GOOGLE_AI_API_KEY is not set. Add a billing-enabled Google AI Studio key to .env " +
        "(gemini-3-pro-image and Veo 3.1 are paid-tier models)."
    );
  }
  return new GoogleGenAI({ apiKey });
}

// Accepts a data: URL or an http(s) URL; returns raw base64 bytes + mime for Veo's image input.
async function toImageBytes(imageUrl: string): Promise<{ imageBytes: string; mimeType: string }> {
  if (imageUrl.startsWith("data:")) {
    const m = imageUrl.match(/^data:([^;]+);base64,([\s\S]*)$/);
    if (!m) throw new Error("Malformed data URL for image input");
    return { mimeType: m[1], imageBytes: m[2] };
  }
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error(`Failed to fetch image (${res.status})`);
  const mimeType = res.headers.get("content-type") ?? "image/png";
  const buf = Buffer.from(await res.arrayBuffer());
  return { mimeType, imageBytes: buf.toString("base64") };
}

// ---- image (Gemini generateContent) -------------------------------------------------------
export interface GoogleImageResult {
  dataUrl: string; // data:image/...;base64,... — usable directly in <img> AND as Veo/Runway input
  costUSD: number;
}

export async function generateGoogleImage(
  params: GenerationParams,
  imagePromptOverride?: string
): Promise<GoogleImageResult> {
  const model = GOOGLE_IMAGE_ID[params.imageModel ?? "gemini_image3_pro"];
  const { imagePrompt } = buildPrompts(params);
  const prompt = imagePromptOverride ?? imagePrompt;

  const resp = await googleClient().models.generateContent({
    model,
    contents: prompt,
    config: {
      responseModalities: ["IMAGE"],
      // App renders/animates at 1280x720 → 16:9. 2K keeps the title card crisp.
      imageConfig: { aspectRatio: "16:9", imageSize: "2K" },
    },
  });

  const parts = resp.candidates?.[0]?.content?.parts ?? [];
  const img = parts.find((p) => p.inlineData?.data);
  if (!img?.inlineData?.data) {
    const text = parts.find((p) => p.text)?.text;
    throw new Error(text ? `Image generation refused: ${text.slice(0, 200)}` : "Image generation produced no output");
  }
  const mime = img.inlineData.mimeType ?? "image/png";
  return {
    dataUrl: `data:${mime};base64,${img.inlineData.data}`,
    costUSD: GOOGLE_PRICING.imagePerCallUSD[model] ?? 0,
  };
}

// ---- video (Veo generateVideos → long-running operation) ----------------------------------
// Self-hosted has no serverless execution limit, but we still split start/poll to keep the
// existing UI's progress + cancel affordances. A Google op id is its operation *name*
// ("models/veo-.../operations/..."), which is self-describing — poll needs no server state.

export async function startGoogleVideo(imageUrl: string, params: GenerationParams): Promise<string> {
  const model = GOOGLE_VIDEO_ID[params.videoModel ?? "veo3.1"];
  const { videoPrompt } = buildPrompts(params);
  const image = await toImageBytes(imageUrl);

  const op = await googleClient().models.generateVideos({
    model,
    prompt: videoPrompt,
    image,
    config: {
      numberOfVideos: 1,
      aspectRatio: "16:9",
      resolution: "720p",
      durationSeconds: veoDuration(params.duration),
      // NOTE: do NOT set generateAudio here. The Gemini *Developer* API (the key path) rejects
      // it outright ("generateAudio is only supported in Gemini Enterprise Agent Platform
      // mode") — verified live 2026-09-05, card #1629. Veo's own audio is harmless because the
      // save step muxes his sting and maps only Veo's video stream (-map 0:v:0), dropping it.
    },
  });
  if (!op.name) throw new Error("Veo did not return an operation name");
  return op.name;
}

export function isGoogleVideoOp(id: string): boolean {
  return id.includes("/operations/") || id.startsWith("operations/");
}

export interface GooglePollResult {
  status: "RUNNING" | "SUCCEEDED" | "FAILED";
  video?: { imageBytes?: never; videoBytes?: string; uri?: string; mimeType?: string };
  error?: string;
}

export async function pollGoogleVideo(opName: string): Promise<GooglePollResult> {
  // Poll the long-running operation via the REST endpoint directly, NOT the SDK.
  // ai.operations.getVideosOperation() needs the ORIGINAL GenerateVideosOperation instance —
  // it calls operation._fromAPIResponse() internally, so a stateless { name } object throws
  // "_fromAPIResponse is not a function" (verified live 2026-09-05, #1629). The operation name
  // IS a REST path, so a plain keyed GET is both correct and genuinely stateless across polls.
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_AI_API_KEY is not set.");
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/${opName}?key=${apiKey}`);
  if (!res.ok) return { status: "FAILED", error: `Operation poll HTTP ${res.status}` };
  const op = await res.json();
  if (!op.done) return { status: "RUNNING" };
  if (op.error) return { status: "FAILED", error: String(op.error.message ?? JSON.stringify(op.error)) };
  // mldev (Developer API) Veo shape: response.generateVideoResponse.generatedSamples[].video.uri
  // Tolerate the SDK-normalized shape (response.generatedVideos[].video) too.
  const video =
    op.response?.generateVideoResponse?.generatedSamples?.[0]?.video ??
    op.response?.generatedVideos?.[0]?.video;
  if (!video?.uri && !video?.videoBytes) {
    return { status: "FAILED", error: "Operation done but no video in response" };
  }
  return { status: "SUCCEEDED", video };
}

// Download a finished Veo video's bytes (its uri needs the API key; the browser can't fetch it).
export async function downloadGoogleVideo(video: { videoBytes?: string; uri?: string }): Promise<Buffer> {
  if (video.videoBytes) return Buffer.from(video.videoBytes, "base64");
  if (!video.uri) throw new Error("Veo video has neither bytes nor uri");
  const apiKey = process.env.GOOGLE_AI_API_KEY!;
  const sep = video.uri.includes("?") ? "&" : "?";
  const res = await fetch(`${video.uri}${sep}key=${apiKey}`);
  if (!res.ok) throw new Error(`Failed to download Veo video (${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}
