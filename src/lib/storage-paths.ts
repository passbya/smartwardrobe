import path from "node:path";

const DATA_DIR_ENV = "SMARTWARDROBE_DATA_DIR";

export function getAppDataDir() {
  const configured = process.env[DATA_DIR_ENV]?.trim();

  if (configured) {
    return path.resolve(configured);
  }

  return path.join(process.cwd(), ".smartwardrobe-data");
}

export function getJsonDataDir() {
  return path.join(getAppDataDir(), "json");
}

export function getUploadsDir() {
  return path.join(getAppDataDir(), "uploads");
}

export function getProfilesPath() {
  return path.join(getJsonDataDir(), "profiles.json");
}

export function getGarmentsPath() {
  return path.join(getJsonDataDir(), "garments.json");
}

export function isPathInside(parentPath: string, childPath: string) {
  const relativePath = path.relative(parentPath, childPath);

  return (
    relativePath === "" ||
    (!relativePath.startsWith("..") && !path.isAbsolute(relativePath))
  );
}

export function resolveUploadFilePath(
  userId: string,
  fileName: string,
  rootDir = getUploadsDir(),
) {
  if (!isSafePathSegment(userId) || !isSafePathSegment(fileName)) {
    throw new Error("Invalid upload path");
  }

  const absolutePath = path.resolve(rootDir, userId, fileName);

  if (!isPathInside(rootDir, absolutePath)) {
    throw new Error("Invalid upload path");
  }

  return absolutePath;
}

export function getUploadObjectKey(userId: string, fileName: string) {
  if (!isSafePathSegment(userId) || !isSafePathSegment(fileName)) {
    throw new Error("Invalid upload path");
  }

  return `${userId}/${fileName}`;
}

export function extractUploadReference(
  imageUrl: string,
): { userId: string; fileName: string } | null {
  const matched = imageUrl.match(/^\/api\/uploads\/([^/]+)\/([^/]+)$/);

  if (!matched) {
    return null;
  }

  const [, userId, fileName] = matched;

  if (!isSafePathSegment(userId) || !isSafePathSegment(fileName)) {
    return null;
  }

  return {
    userId,
    fileName,
  };
}

export function sanitizeUploadFileName(filename: string) {
  const extension = path.extname(filename) || ".jpg";
  const basename = path
    .basename(filename, extension)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);

  return `${basename || "garment"}${extension}`;
}

export function isSafePathSegment(segment: string) {
  return (
    segment.length > 0 &&
    segment !== "." &&
    segment !== ".." &&
    path.basename(segment) === segment &&
    !path.isAbsolute(segment)
  );
}
