import { NextRequest, NextResponse } from "next/server";
import RunwayML from "@runwayml/sdk";
import { buildPrompts, type GenerationParams } from "@/lib/runway";
import { videoProvider, startGoogleVideo } from "@/lib/providers";

export const maxDuration = 90;

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.imageUrl) {
    return NextResponse.json({ error: "imageUrl is required" }, { status: 400 });
  }

  const params: GenerationParams = {
    name: body.name ?? "MY SERVICE",
    style: body.style ?? "cinematic",
    tagline: body.tagline,
    duration: body.duration ?? 5,
    videoModel: body.videoModel,
    treatment: body.treatment,
    primaryColor: body.primaryColor,
    customNotes: body.customNotes,
    audio: body.audio,
  };

  // Direct Google/Veo path — returns the long-running operation *name* as the taskId. The name
  // is self-describing, so poll needs no server-side state.
  if (videoProvider(params.videoModel) === "google") {
    try {
      const opName = await startGoogleVideo(body.imageUrl, params);
      return NextResponse.json({ taskId: opName, provider: "google", creditsBefore: null });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to start video generation";
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  // Runway path (BYOK, unchanged).
  const apiKey = req.headers.get("x-runway-key") ?? process.env.RUNWAYML_API_SECRET ?? "";
  if (!apiKey) {
    return NextResponse.json(
      { error: "No Runway API key provided. Visit /setup to add yours." },
      { status: 401 }
    );
  }

  const { videoPrompt: generatedVideoPrompt } = buildPrompts(params);
  const videoPrompt = body.videoPromptOverride ?? generatedVideoPrompt;
  const model = params.videoModel ?? "gen4_turbo";
  const isVeoModel = model === "veo3" || model === "veo3.1" || model === "veo3.1_fast";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createParams: Record<string, any> = {
    model,
    promptImage: body.imageUrl,
    promptText: videoPrompt,
    ratio: "1280:720",
    duration: params.duration,
  };
  if (isVeoModel && params.audio) createParams.audio = true;

  try {
    const client = new RunwayML({ apiKey, timeout: 25_000 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const task = await client.imageToVideo.create(createParams as any);
    const creditsBefore = await client.organization.retrieve().then((r) => r.creditBalance).catch(() => null);
    return NextResponse.json({ taskId: task.id, provider: "runway", creditsBefore });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to start video generation";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
