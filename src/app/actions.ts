"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createGarmentRecord,
  deleteGarmentRecord,
  saveUpload,
  updateGarmentRecord,
} from "@/lib/data-store";
import { clearSession, createPresetSession, requireSession } from "@/lib/session";

function getFormValue(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw.trim() : "";
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

function sanitizeRedirectTarget(target: string) {
  if (!target || !target.startsWith("/")) {
    return "/wardrobe";
  }

  return target;
}

export async function deleteGarmentAction(garmentId: string, formData: FormData) {
  const session = await requireSession();
  const redirectTarget = sanitizeRedirectTarget(getFormValue(formData, "redirectTo"));

  const deleted = await deleteGarmentRecord(session.userId, garmentId);

  if (!deleted) {
    redirect("/wardrobe?error=delete-not-found");
  }

  revalidatePath("/wardrobe");
  revalidatePath(`/garment/${garmentId}`);
  redirect(`${redirectTarget.includes("?") ? `${redirectTarget}&` : `${redirectTarget}?`}deleted=1`);
}
