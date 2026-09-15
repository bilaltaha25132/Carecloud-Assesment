'use client';
import { useActionState } from 'react';
import { loginAction } from '../../features/auth/actions';

const INPUT_CLASS =
  'h-11 w-full rounded-xl border-0 bg-control px-3.5 text-base text-ink placeholder:text-ink-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 sm:text-sm';
const LABEL_CLASS = 'text-xs font-medium text-ink-muted';

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, {});

  return (
    <form className="flex flex-col gap-4" action={action}>
      <div className="flex flex-col gap-1.5">
        <label className={LABEL_CLASS} htmlFor="email">
          Email address
        </label>
        <input
          className={INPUT_CLASS}
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          placeholder="you@carecloud.com"
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={LABEL_CLASS} htmlFor="password">
          Password
        </label>
        <input
          className={INPUT_CLASS}
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required
        />
      </div>
      {state.error ? (
        <p className="rounded-lg bg-card-rose px-3 py-2 text-xs font-medium text-card-ink">{state.error}</p>
      ) : null}
      <button
        className="mt-1 h-11 rounded-xl bg-ink px-4 text-sm font-medium text-surface transition-opacity hover:opacity-90 disabled:opacity-60"
        type="submit"
        disabled={pending}
      >
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
