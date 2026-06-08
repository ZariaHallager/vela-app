import { ShieldCheckIcon, LockClosedIcon, TrashIcon } from '@heroicons/react/24/outline';

const BADGES = [
  {
    icon: ShieldCheckIcon,
    label: 'Private by design',
  },
  {
    icon: LockClosedIcon,
    label: 'Never stored',
  },
  {
    icon: TrashIcon,
    label: 'Deleted after use',
  },
] as const;

export default function TrustBar() {
  return (
    <footer className="w-full py-3 px-4">
      <div className="max-w-2xl mx-auto flex flex-wrap items-center justify-center gap-4 text-xs text-mauve/50">
        {BADGES.map(({ icon: Icon, label }) => (
          <span key={label} className="flex items-center gap-1.5">
            <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            {label}
          </span>
        ))}
        <span className="hidden sm:inline text-mauve/30">·</span>
        <span className="text-mauve/40">
          Not medical advice — for informational purposes only
        </span>
      </div>
    </footer>
  );
}
