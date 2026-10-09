import { describe, it, expect } from 'vitest';
import {
  addDays,
  formatIstTime,
  istDateOf,
  istDateString,
  istDateTime,
  istTimeHHMM,
  relativeDayLabel,
  upcomingIstDays,
} from '../time';

describe('IST time helpers', () => {
  it('keeps a time entered as 08:30 at 08:30 IST', () => {
    const iso = istDateTime('2026-10-10', '08:30');
    expect(iso).toBe('2026-10-10T08:30:00+05:30');
    expect(istTimeHHMM(iso)).toBe('08:30');
    expect(formatIstTime(iso).toLowerCase()).toBe('08:30 am');
  });

  it('uses the IST date just after midnight, when UTC is still the previous day', () => {
    // 00:30 IST on 10 Oct is 19:00 UTC on 9 Oct
    const justAfterMidnight = new Date('2026-10-09T19:00:00Z');
    expect(istDateString(justAfterMidnight)).toBe('2026-10-10');
    expect(relativeDayLabel('2026-10-10', justAfterMidnight)).toBe('Today');
    expect(relativeDayLabel('2026-10-11', justAfterMidnight)).toBe('Tomorrow');
  });

  it('reads the IST date of a stored time', () => {
    expect(istDateOf('2026-10-10T23:30:00+05:30')).toBe('2026-10-10');
    expect(istDateOf('2026-10-10T20:00:00Z')).toBe('2026-10-11');
  });

  it('adds days across month ends', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
  });

  it('builds day options starting today in IST', () => {
    const days = upcomingIstDays(2, new Date('2026-10-09T19:00:00Z'));
    expect(days.map((d) => d.dateStr)).toEqual(['2026-10-10', '2026-10-11', '2026-10-12']);
    expect(days[0].weekday).toBe('Today');
    expect(days[2].weekday).toBe('Mon');
  });
});
