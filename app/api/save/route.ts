import { NextRequest, NextResponse } from "next/server";
import { muxAndSave } from "@/lib/media";

export const maxDuration = 120;

// The point of self-hosting: mux the sting server-side (real ffmpeg, not browser wasm) and
// write the finished pre-roll STRAIGHT INTO THE MEDIA LIBRARY so Jellyfin/Plex/Emby read it
// from disk — no browser download, no hand-carry to the NAS.
export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.videoUrl) {
    return NextResponse.json({ error: "videoUrl is required" }, { status: 400 });
  }
  try {
    const result = await muxAndSave({
      videoSource: body.videoUrl,
      name: body.name ?? "lodgeflix",
      audio: body.audio,
      stingPath: body.stingPath,
    });
    return NextResponse.json({ saved: true, ...result });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Save failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
