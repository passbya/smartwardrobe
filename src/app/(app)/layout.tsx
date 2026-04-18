import { AppShell } from "@/components/app-shell";
import { requireDemoSession } from "@/lib/session";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await requireDemoSession();

  return <AppShell session={session}>{children}</AppShell>;
}
