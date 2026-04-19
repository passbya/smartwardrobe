import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  getAppDataDir,
  isPathInside,
  isSafePathSegment,
  resolveUploadFilePath,
} from "@/lib/storage-paths";

describe("storage path selection", () => {
  const originalDataDir = process.env.SMARTWARDROBE_DATA_DIR;

  afterEach(() => {
    if (originalDataDir !== undefined) {
      process.env.SMARTWARDROBE_DATA_DIR = originalDataDir;
    } else {
      delete process.env.SMARTWARDROBE_DATA_DIR;
    }
  });

  it("falls back to the default local data directory when the env var is unset", () => {
    delete process.env.SMARTWARDROBE_DATA_DIR;

    expect(getAppDataDir()).toBe(
      path.join(process.cwd(), ".smartwardrobe-data"),
    );
  });

  it("resolves a configured local data directory before repository code runs", () => {
    process.env.SMARTWARDROBE_DATA_DIR = "  ./tmp/smartwardrobe-data  ";

    expect(getAppDataDir()).toBe(path.resolve("./tmp/smartwardrobe-data"));
  });

  it("keeps upload paths inside the resolved data root", () => {
    const uploadRoot = path.resolve("/tmp/uploads");

    expect(resolveUploadFilePath("demo-user", "garment.png", uploadRoot)).toBe(
      path.resolve(uploadRoot, "demo-user", "garment.png"),
    );
    expect(() =>
      resolveUploadFilePath("../escape", "garment.png", uploadRoot),
    ).toThrow("Invalid upload path");
    expect(() =>
      resolveUploadFilePath("demo-user", "../escape.png", uploadRoot),
    ).toThrow("Invalid upload path");
  });

  it("recognizes safe path segments and nested path containment", () => {
    const root = path.resolve("/tmp/uploads");
    const nested = path.resolve(root, "demo-user", "garment.png");

    expect(isSafePathSegment("demo-user")).toBe(true);
    expect(isSafePathSegment("..")).toBe(false);
    expect(isSafePathSegment("/absolute")).toBe(false);
    expect(isPathInside(root, nested)).toBe(true);
    expect(isPathInside(root, path.resolve("/tmp/elsewhere"))).toBe(false);
  });
});
