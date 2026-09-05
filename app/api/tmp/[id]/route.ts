import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import { tempVideoPath } from "@/lib/media";

export const maxDuration = 30;

// Serves a finished Veo video that was downloaded server-side (its Google uri needs the API
// key, so the browser cannot fetch it directly). Ephemeral — consumed by preview + /api/save.
export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const file = tempVideoPath(id.replace(/\.mp4$/, ""));
  try {
    const bytes = await fs.readFile(file);
    return new NextResponse(new Uint8Array(bytes), {
      headers: { "Content-Type": "video/mp4", "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
