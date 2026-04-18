"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createGarmentRecord,
  saveUpload,
  updateGarmentRecord,
} from "@/lib/data-store";
import { createDemoSession, requireDemoSession } from "@/lib/session";

function getFormValue(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw.trim() : "";
}

export async function startDemoSessionAction() {
  await createDemoSession();
  redirect("/wardrobe");
}

export async function createGarmentAction(formData: FormData) {
  const session = await requireDemoSession();
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
  const session = await requireDemoSession();

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
