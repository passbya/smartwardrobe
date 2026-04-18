import path from "node:path";
import { NextResponse } from "next/server";
import { loadUpload } from "@/lib/data-store";
import { isSafePathSegment } from "@/lib/storage-paths";

type RouteProps = {
  params: Promise<{
    userId: string;
    fileName: string;
  }>;
};

function getContentType(fileName: string) {
  const extension = path.extname(fileName).toLowerCase();

  switch (extension) {
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".jpg":
    case ".jpeg":
    default:
      return "image/jpeg";
  }
}

export async function GET(_: Request, { params }: RouteProps) {
  const { userId, fileName } = await params;

  if (!isSafePathSegment(userId) || !isSafePathSegment(fileName)) {
    return new NextResponse("Invalid path", { status: 400 });
  }

  try {
    const file = await loadUpload(userId, fileName);

    if (!file) {
      return new NextResponse("Not found", { status: 404 });
    }

    return new NextResponse(Buffer.from(file), {
      headers: {
        "Content-Type": getContentType(fileName),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Unable to load upload", { status: 500 });
  }
}
