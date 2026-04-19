import { getPresetIdentities, toUserSession } from "@/lib/preset-identities";

export const presetIdentities = getPresetIdentities();

if (presetIdentities.length !== 3) {
  throw new Error("Expected exactly three preset identities");
}

export const [lunaIdentity, novaIdentity, irisIdentity] = presetIdentities;

if (!lunaIdentity || !novaIdentity || !irisIdentity) {
  throw new Error("Preset identity fixtures are incomplete");
}

export const lunaSession = toUserSession(lunaIdentity);
export const novaSession = toUserSession(novaIdentity);
export const irisSession = toUserSession(irisIdentity);
