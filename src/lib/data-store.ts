import type { GarmentInput, OutfitInput } from "@/lib/types";
import { getRepository } from "@/lib/data-repository";
import type { GarmentUpdates } from "@/lib/data-repository";

export async function getOrCreatePresetProfile(slug: string) {
  return getRepository().getOrCreatePresetProfile(slug);
}

export async function listGarments(userId: string) {
  return getRepository().listGarments(userId);
}

export async function getGarmentById(userId: string, garmentId: string) {
  return getRepository().getGarmentById(userId, garmentId);
}

export async function saveUpload(userId: string, garmentId: string, file: File) {
  return getRepository().saveUpload(userId, garmentId, file);
}

export async function loadUpload(userId: string, fileName: string) {
  return getRepository().loadUpload(userId, fileName);
}

export async function createGarmentRecord(
  userId: string,
  garmentId: string,
  input: GarmentInput,
  imageUrl: string,
) {
  return getRepository().createGarmentRecord(userId, garmentId, input, imageUrl);
}

export async function updateGarmentRecord(
  userId: string,
  garmentId: string,
  updates: GarmentUpdates,
) {
  return getRepository().updateGarmentRecord(userId, garmentId, updates);
}

export async function deleteGarmentRecord(userId: string, garmentId: string) {
  return getRepository().deleteGarmentRecord(userId, garmentId);
}

export async function listOutfits(userId: string) {
  return getRepository().listOutfits(userId);
}

export async function getOutfitById(userId: string, outfitId: string) {
  return getRepository().getOutfitById(userId, outfitId);
}

export async function createOutfitRecord(userId: string, input: OutfitInput) {
  return getRepository().createOutfitRecord(userId, input);
}

export async function updateOutfitRecord(
  userId: string,
  outfitId: string,
  input: OutfitInput,
) {
  return getRepository().updateOutfitRecord(userId, outfitId, input);
}

export async function deleteOutfitRecord(userId: string, outfitId: string) {
  return getRepository().deleteOutfitRecord(userId, outfitId);
}
