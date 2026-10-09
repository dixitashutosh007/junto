/** The Club House mark: a house with three neighbours inside */
export function ClubHouseLogo({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" fill="none">
      <path
        d="M10 30 L32 12 L54 30"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 27 V50 a3 3 0 0 0 3 3 H45 a3 3 0 0 0 3-3 V27"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="23" cy="36" r="3.5" fill="currentColor" />
      <circle cx="32" cy="34" r="4" fill="currentColor" />
      <circle cx="41" cy="36" r="3.5" fill="currentColor" />
      <path d="M17.5 47 a5.5 5 0 0 1 11 0 M25.5 47 a6.5 6 0 0 1 13 0 M35.5 47 a5.5 5 0 0 1 11 0" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}
