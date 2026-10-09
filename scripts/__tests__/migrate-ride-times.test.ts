import { describe, it, expect } from 'vitest';
import { planRideTimeFix } from '../migrate-ride-times';

describe('planRideTimeFix', () => {
  it('rewrites legacy UTC-stamped times to the same wall-clock time in India', () => {
    expect(
      planRideTimeFix({
        journeyDate: '2026-10-10',
        departureWindowStart: '2026-10-10T08:30:00.000Z',
        departureWindowEnd: '2026-10-10T08:45:00.000Z',
      })
    ).toEqual({
      action: 'fix',
      updates: {
        departureWindowStart: '2026-10-10T08:30:00+05:30',
        departureWindowEnd: '2026-10-10T08:45:00+05:30',
      },
    });
  });

  it('accepts the shorter Z form too', () => {
    const plan = planRideTimeFix({
      journeyDate: '2026-10-10',
      departureWindowStart: '2026-10-10T18:05:00Z',
      departureWindowEnd: '2026-10-10T18:20:00Z',
    });
    expect(plan.action === 'fix' && plan.updates.departureWindowStart).toBe('2026-10-10T18:05:00+05:30');
  });

  it('leaves rides already stored in India time alone (safe to re-run)', () => {
    expect(
      planRideTimeFix({
        journeyDate: '2026-10-10',
        departureWindowStart: '2026-10-10T08:30:00+05:30',
        departureWindowEnd: '2026-10-10T08:45:00+05:30',
      })
    ).toEqual({ action: 'skip', reason: 'already-ist' });
  });

  it('fixes a ride where only one of the two times is legacy', () => {
    const plan = planRideTimeFix({
      journeyDate: '2026-10-10',
      departureWindowStart: '2026-10-10T08:30:00+05:30',
      departureWindowEnd: '2026-10-10T08:45:00.000Z',
    });
    expect(plan).toEqual({
      action: 'fix',
      updates: {
        departureWindowStart: '2026-10-10T08:30:00+05:30',
        departureWindowEnd: '2026-10-10T08:45:00+05:30',
      },
    });
  });

  it('does not touch times in an unexpected format', () => {
    expect(
      planRideTimeFix({
        journeyDate: '2026-10-10',
        departureWindowStart: '2026-10-10T03:00:12.345Z',
        departureWindowEnd: '2026-10-10T03:15:00.000Z',
      })
    ).toEqual({ action: 'skip', reason: 'unrecognised-format' });
  });

  it('does not touch times whose date differs from the journey date', () => {
    expect(
      planRideTimeFix({
        journeyDate: '2026-10-11',
        departureWindowStart: '2026-10-10T20:00:00.000Z',
        departureWindowEnd: '2026-10-10T20:15:00.000Z',
      })
    ).toEqual({ action: 'skip', reason: 'date-mismatch' });
  });
});
