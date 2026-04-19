import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getOrCreatePresetProfile } from "@/lib/data-store";
import {
  getPresetIdentityBySlug,
  getPresetIdentityByUserId,
} from "@/lib/preset-identities";
import type { UserSession } from "@/lib/types";

const SESSION_COOKIE = "smartwardrobe-session";

function normalizeSession(session: UserSession | null) {
  if (!session) {
    return null;
  }

  const bySlug = getPresetIdentityBySlug(session.slug);
  const byUserId = getPresetIdentityByUserId(session.userId);

  if (!bySlug || !byUserId || bySlug.userId !== byUserId.userId) {
    return null;
  }

  return {
    userId: bySlug.userId,
    displayName: bySlug.displayName,
    slug: bySlug.slug,
  } satisfies UserSession;
}

export async function getCurrentSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;

  if (!raw) {
    return null;
  }

  try {
    return normalizeSession(JSON.parse(raw) as UserSession);
  } catch {
    return null;
  }
}

export async function requireSession() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}

export async function createPresetSession(slug: string) {
  const identity = getPresetIdentityBySlug(slug);

  if (!identity) {
    throw new Error(`Unknown preset identity: ${slug}`);
  }

  const session = await getOrCreatePresetProfile(slug);
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return session;
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
