import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getOrCreateDemoProfile } from "@/lib/data-store";
import type { DemoSession } from "@/lib/types";

const SESSION_COOKIE = "smartwardrobe-demo-session";

export async function getCurrentSession(): Promise<DemoSession | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as DemoSession;
  } catch {
    return null;
  }
}

export async function requireDemoSession() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}

export async function createDemoSession() {
  const session = await getOrCreateDemoProfile();
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return session;
}
