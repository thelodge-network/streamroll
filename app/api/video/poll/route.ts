import { NextRequest, NextResponse } from "next/server";
import RunwayML from "@runwayml/sdk";
import { isGoogleVideoOp, pollGoogleVideo, downloadGoogleVideo } from "@/lib/providers";
import { stashTempVideo } from "@/lib/media";

export const maxDuration = 90;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get("id");

  if (!taskId) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  // Direct Google/Veo poll — the taskId is the operation name. On success we download the
  // video bytes server-side (its uri needs the API key) and serve them from /api/tmp.
  if (isGoogleVideoOp(taskId)) {
    try {
      const r = await pollGoogleVideo(taskId);
      if (r.status === "RUNNING") return NextResponse.json({ status: "RUNNING", progress: null });
      if (r.status === "FAILED") return NextResponse.json({ status: "FAILED", failure: r.error });
      const bytes = await downloadGoogleVideo(r.video!);
      const id = taskId.split("/").pop() ?? `veo-${Date.now()}`;
      await stashTempVideo(id, bytes);
      return NextResponse.json({ status: "SUCCEEDED", output: `/api/tmp/${id}.mp4`, provider: "google", creditsAfter: null });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Status check failed";
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  // Runway poll (BYOK, unchanged).
  const apiKey = req.headers.get("x-runway-key") ?? process.env.RUNWAYML_API_SECRET ?? "";
  if (!apiKey) {
    return NextResponse.json({ error: "No Runway API key provided." }, { status: 401 });
  }

  try {
    const client = new RunwayML({ apiKey, timeout: 25_000 });
    const task = await client.tasks.retrieve(taskId);

    if (task.status === "SUCCEEDED") {
      const creditsAfter = await client.organization.retrieve().then((r) => r.creditBalance).catch(() => null);
      return NextResponse.json({ status: "SUCCEEDED", output: task.output[0], creditsAfter });
    }
    if (task.status === "FAILED") {
      return NextResponse.json({ status: "FAILED", failure: task.failure });
    }
    if (task.status === "RUNNING") {
      return NextResponse.json({ status: "RUNNING", progress: task.progress ?? null });
    }
    return NextResponse.json({ status: task.status });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Status check failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
