import { describe, expect, it } from "vitest";
import {
  getPresetIdentities,
  getPresetIdentityBySlug,
  getPresetIdentityByUserId,
  toUserSession,
} from "@/lib/preset-identities";

describe("preset identities", () => {
  it("exposes the three stable login identities", () => {
    const identities = getPresetIdentities();

    expect(identities).toHaveLength(3);
    expect(identities.map((identity) => identity.slug)).toEqual([
      "luna",
      "nova",
      "iris",
    ]);
    expect(new Set(identities.map((identity) => identity.userId)).size).toBe(3);
    expect(identities.map((identity) => identity.displayName)).toEqual([
      "Luna",
      "Nova",
      "Iris",
    ]);
  });

  it("resolves identities by slug and user id and normalizes sessions", () => {
    const [luna, nova, iris] = getPresetIdentities();

    expect(getPresetIdentityBySlug("luna")).toEqual(luna);
    expect(getPresetIdentityByUserId(nova.userId)).toEqual(nova);
    expect(getPresetIdentityBySlug("missing")).toBeNull();
    expect(getPresetIdentityByUserId("missing")).toBeNull();
    expect(toUserSession(iris)).toEqual({
      userId: iris.userId,
      displayName: iris.displayName,
      slug: iris.slug,
    });
  });
});
