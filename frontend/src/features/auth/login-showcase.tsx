import { Logo } from '../../components/brand/logo';

const HIGHLIGHTS = [
  { title: 'Voice intake, done right', body: 'Patients register by phone in a natural conversation, no forms.' },
  { title: 'Everything in one place', body: 'Records, appointments and call transcripts, together and searchable.' },
  { title: 'Staff in control', body: 'Open or close bookable times and see every booking as it happens.' },
];

// The panel is a deliberate brand surface, so its gradient is a fixed brand
// asset rather than a theme-following token. It is decorative and desktop-only.
const PANEL_GRADIENT = 'linear-gradient(150deg, #4c98fd 0%, #3f7fd6 55%, #3bb6a6 100%)';

export function LoginShowcase() {
  return (
    <aside
      className="relative hidden flex-col justify-between overflow-hidden p-12 text-surface lg:flex"
      style={{ background: PANEL_GRADIENT }}
    >
      <div className="absolute -right-24 -top-24 size-80 rounded-full bg-white/10" aria-hidden />
      <div className="absolute -bottom-32 -left-16 size-96 rounded-full bg-white/5" aria-hidden />

      <div className="relative">
        <Logo inverted />
      </div>

      <div className="relative max-w-md">
        <h2 className="text-3xl font-semibold leading-tight tracking-tight">
          The front desk that never puts a patient on hold.
        </h2>
        <p className="mt-3 text-sm text-surface/80">
          CareCloud answers the call, registers the patient, and hands your team a clean record.
        </p>

        <ul className="mt-9 flex flex-col gap-5">
          {HIGHLIGHTS.map((item) => (
            <li className="flex gap-3" key={item.title}>
              <span className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-white/20">
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
                  <path d="M2.5 6.5 5 9l4.5-5.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span>
                <span className="block text-sm font-medium">{item.title}</span>
                <span className="block text-sm text-surface/75">{item.body}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="relative text-xs text-surface/70">Staff console · CareCloud Clinic</p>
    </aside>
  );
}
