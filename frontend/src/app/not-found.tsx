import Link from 'next/link';
import { EmptyState } from '../components/empty-state';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-4">
      <EmptyState title="That page does not exist." detail="The record may have been removed." />
      <Link className="text-sm text-ink-muted hover:text-brand" href="/patients">
        Back to patients
      </Link>
    </div>
  );
}
