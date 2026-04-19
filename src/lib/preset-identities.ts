import type { PresetIdentity, UserSession } from "@/lib/types";

const PRESET_IDENTITIES: PresetIdentity[] = [
  {
    userId: "0d7cb4f8-814e-4dd2-8df4-3ed9d2d1f111",
    displayName: "Luna",
    slug: "luna",
    description: "整理日常通勤与极简冷色系单品。",
    themeKey: "moonlight",
  },
  {
    userId: "2a2aa818-54a8-4b2b-a2c8-7c0ccf20f222",
    displayName: "Nova",
    slug: "nova",
    description: "偏好锋利轮廓和夜晚场景的衣橱。",
    themeKey: "starlit",
  },
  {
    userId: "9a9ea8cc-8dca-4c31-a7fc-f64ecb15d333",
    displayName: "Iris",
    slug: "iris",
    description: "管理轻盈层次与周末出行穿搭。",
    themeKey: "aurora",
  },
];

export function getPresetIdentities() {
  return PRESET_IDENTITIES;
}

export function getPresetIdentityBySlug(slug: string) {
  return PRESET_IDENTITIES.find((identity) => identity.slug === slug) ?? null;
}

export function getPresetIdentityByUserId(userId: string) {
  return PRESET_IDENTITIES.find((identity) => identity.userId === userId) ?? null;
}

export function toUserSession(identity: PresetIdentity): UserSession {
  return {
    userId: identity.userId,
    displayName: identity.displayName,
    slug: identity.slug,
  };
}
