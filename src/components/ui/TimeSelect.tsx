'use client';

import { formatHHMM12, timeSlots } from '@/lib/utils/time';

const SLOTS = timeSlots();

interface TimeSelectProps {
  id: string;
  /** `HH:mm` (24-hour) */
  value: string;
  onChange: (hhmm: string) => void;
  /** Only offer times strictly after this `HH:mm` */
  after?: string;
  /** Only offer times up to and including this `HH:mm` */
  until?: string;
  className?: string;
}

/**
 * Time picker in 5-minute steps. A plain select, so phones show their own
 * wheel or list; native time inputs ignore minute steps on most phones.
 */
export function TimeSelect({ id, value, onChange, after, until, className }: TimeSelectProps) {
  const slots = SLOTS.filter((t) => (!after || t > after) && (!until || t <= until));
  // Keep a saved time that isn't on the 5-minute grid selectable
  if (value && !slots.includes(value)) slots.unshift(value);

  return (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={className}>
      {slots.map((t) => (
        <option key={t} value={t}>
          {formatHHMM12(t)}
        </option>
      ))}
    </select>
  );
}
