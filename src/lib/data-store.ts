import type { DemoSession, GarmentInput } from "@/lib/types";
import { getRepository } from "@/lib/data-repository";
import type { GarmentUpdates } from "@/lib/data-repository";

export async function getOrCreateDemoProfile(): Promise<DemoSession> {
  return getRepository().getOrCreateDemoProfile();
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
