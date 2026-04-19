"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createGarmentRecord,
  createOutfitRecord,
  deleteGarmentRecord,
  deleteOutfitRecord,
  saveUpload,
  updateGarmentRecord,
  updateOutfitRecord,
} from "@/lib/data-store";
import { clearSession, createPresetSession, requireSession } from "@/lib/session";

function getFormValue(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw.trim() : "";
}

function getMultiFormValues(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);
}

function sanitizeRedirectTarget(target: string, fallback = "/wardrobe") {
  if (!target || !target.startsWith("/")) {
    return fallback;
  }

  return target;
}

function appendStatusQuery(target: string, param: string) {
  return `${target}${target.includes("?") ? "&" : "?"}${param}`;
}

export async function selectPresetSessionAction(slug: string) {
  try {
    await createPresetSession(slug);
  } catch {
    redirect("/login?error=identity");
  }

  redirect("/wardrobe");
}

export async function clearSessionAction() {
  await clearSession();
  redirect("/login");
}

export async function createGarmentAction(formData: FormData) {
  const session = await requireSession();
  const imageFile = formData.get("image");

  if (!(imageFile instanceof File) || imageFile.size === 0) {
    redirect("/import?error=missing-image");
  }

  const name = getFormValue(formData, "name");
  const subcategory = getFormValue(formData, "subcategory");

  if (!name || !subcategory) {
    redirect("/import?error=missing-required");
  }

  const garmentId = randomUUID();
  const imageUrl = await saveUpload(session.userId, garmentId, imageFile);

  const garment = await createGarmentRecord(
    session.userId,
    garmentId,
    {
      name,
      subcategory,
      color: getFormValue(formData, "color"),
      season: getFormValue(formData, "season"),
      brand: getFormValue(formData, "brand"),
      notes: getFormValue(formData, "notes"),
    },
    imageUrl,
  );

  revalidatePath("/wardrobe");
  redirect(`/garment/${garment.id}?created=1`);
}

export async function updateGarmentAction(garmentId: string, formData: FormData) {
  const session = await requireSession();

  const updated = await updateGarmentRecord(session.userId, garmentId, {
    category: getFormValue(formData, "category"),
    subcategory: getFormValue(formData, "subcategory"),
    color: getFormValue(formData, "color"),
    season: getFormValue(formData, "season"),
    brand: getFormValue(formData, "brand"),
    notes: getFormValue(formData, "notes"),
  });

  if (!updated) {
    redirect(`/garment/${garmentId}?error=not-found`);
  }

  revalidatePath("/wardrobe");
  revalidatePath(`/garment/${garmentId}`);
  redirect(`/garment/${garmentId}?saved=1`);
}

export async function deleteGarmentAction(garmentId: string, formData: FormData) {
  const session = await requireSession();
  const redirectTarget = sanitizeRedirectTarget(
    getFormValue(formData, "redirectTo"),
    "/wardrobe",
  );

  const deleted = await deleteGarmentRecord(session.userId, garmentId);

  if (!deleted) {
    redirect("/wardrobe?error=delete-not-found");
  }

  revalidatePath("/wardrobe");
  revalidatePath("/outfits");
  revalidatePath(`/garment/${garmentId}`);
  redirect(appendStatusQuery(redirectTarget, "deleted=1"));
}

function getOutfitInput(formData: FormData) {
  return {
    name: getFormValue(formData, "name"),
    topGarmentId: getFormValue(formData, "topGarmentId"),
    bottomGarmentId: getFormValue(formData, "bottomGarmentId"),
    dressGarmentId: getFormValue(formData, "dressGarmentId"),
    outerwearGarmentId: getFormValue(formData, "outerwearGarmentId"),
    shoesGarmentId: getFormValue(formData, "shoesGarmentId"),
    accessoryGarmentIds: getMultiFormValues(formData, "accessoryGarmentIds"),
  };
}

export async function createOutfitAction(formData: FormData) {
  const session = await requireSession();
  const outfit = await createOutfitRecord(session.userId, getOutfitInput(formData));

  revalidatePath("/outfits");
  redirect(`/outfits/${outfit.id}?created=1`);
}

export async function updateOutfitAction(outfitId: string, formData: FormData) {
  const session = await requireSession();
  const updated = await updateOutfitRecord(
    session.userId,
    outfitId,
    getOutfitInput(formData),
  );

  if (!updated) {
    redirect(`/outfits/${outfitId}?error=not-found`);
  }

  revalidatePath("/outfits");
  revalidatePath(`/outfits/${outfitId}`);
  redirect(`/outfits/${outfitId}?saved=1`);
}

export async function deleteOutfitAction(outfitId: string, formData: FormData) {
  const session = await requireSession();
  const redirectTarget = sanitizeRedirectTarget(
    getFormValue(formData, "redirectTo"),
    "/outfits",
  );
  const deleted = await deleteOutfitRecord(session.userId, outfitId);

  if (!deleted) {
    redirect("/outfits?error=delete-not-found");
  }

  revalidatePath("/outfits");
  revalidatePath(`/outfits/${outfitId}`);
  redirect(appendStatusQuery(redirectTarget, "deleted=1"));
}
