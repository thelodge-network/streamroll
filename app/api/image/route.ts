import { NextRequest, NextResponse } from "next/server";
import RunwayML from "@runwayml/sdk";
import { generateLogoImage, type GenerationParams } from "@/lib/runway";
import { imageProvider, generateGoogleImage } from "@/lib/providers";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const params: GenerationParams = {
    name: body.name.trim(),
    style: body.style ?? "cinematic",
    tagline: body.tagline,
    duration: body.duration ?? 5,
    imageModel: body.imageModel,
    treatment: body.treatment,
    primaryColor: body.primaryColor,
    customNotes: body.customNotes,
  };

  // Direct Google path — server-side key, no Runway broker. Returns a data URL, which the
  // browser renders directly and which the video step accepts as-is (Veo bytes / Runway data URI).
  if (imageProvider(params.imageModel) === "google") {
    try {
      const { dataUrl, costUSD } = await generateGoogleImage(params, body.imagePromptOverride ?? undefined);
      return NextResponse.json({ imageUrl: dataUrl, provider: "google", costUSD, creditCost: 0 });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Image generation failed";
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

  try {
    const client = new RunwayML({ apiKey, timeout: 25_000 });
    const [{ creditBalance: before }, imageUrl] = await Promise.all([
      client.organization.retrieve(),
      generateLogoImage(params, apiKey, body.imagePromptOverride ?? undefined),
    ]);
    const { creditBalance: after } = await client.organization.retrieve();
    return NextResponse.json({ imageUrl, provider: "runway", creditCost: Math.max(0, before - after) });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Image generation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
