import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Logo } from '../../components/brand/logo';
import { LoginShowcase } from '../../features/auth/login-showcase';
import { verifySession } from '../../features/auth/session';
import { LoginForm } from './login-form';

export const metadata: Metadata = { title: 'Sign in · CareCloud' };

export default async function LoginPage() {
  if (await verifySession()) redirect('/');

  return (
    <main className="grid min-h-dvh bg-surface text-ink lg:grid-cols-[1fr_1.05fr]">
      <div className="flex flex-col px-6 py-8 sm:px-10 lg:px-14">
        <div className="lg:hidden">
          <Logo />
        </div>

        <div className="flex flex-1 flex-col justify-center py-10">
          <div className="mx-auto w-full max-w-sm">
            <div className="mb-8 hidden lg:block">
              <Logo />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
            <p className="mt-1.5 text-sm text-ink-muted">Sign in to the CareCloud staff console.</p>

            <div className="mt-8">
              <LoginForm />
            </div>
          </div>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-subtle">
          <span>© {new Date().getFullYear()} CareCloud Clinic</span>
          <span>Staff access only</span>
        </footer>
      </div>

      <LoginShowcase />
    </main>
  );
}
