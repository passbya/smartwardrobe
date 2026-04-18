import { NextResponse } from "next/server";
import { getRuntimeDiagnostics } from "@/lib/runtime-diagnostics";

export const dynamic = "force-dynamic";

export function GET() {
  const runtime = getRuntimeDiagnostics();

  return NextResponse.json(runtime, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
