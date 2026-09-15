import type { ReactNode } from 'react';
import { AppShell } from '../../components/app-shell';
import { requireSession } from '../../features/auth/session';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const { username } = await requireSession();
  return <AppShell username={username}>{children}</AppShell>;
}
