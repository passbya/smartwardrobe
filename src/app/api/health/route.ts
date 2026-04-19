import { NextResponse } from "next/server";
import { getHealthDiagnostics } from "@/lib/runtime-diagnostics";

export const dynamic = "force-dynamic";

export function GET() {
  const health = getHealthDiagnostics();

  return NextResponse.json(health, {
    status: health.ready ? 200 : 503,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
