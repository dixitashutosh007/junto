import { istDateOf, istDateString, addDays } from '@/lib/utils/time';
import { GenderPreference, User } from '@/types';

// Rides can be offered up to this many days ahead
export const MAX_DAYS_AHEAD = 7;

/**
 * Checks a ride's departure window. Returns an error message, or null when
 * the window is valid: both times on `journeyDate` in IST, end not before
 * start, start in the future and within the booking horizon.
 */
export function validateDepartureWindow(
  journeyDate: string,
  start: string,
  end: string,
  now: Date = new Date()
): string | null {
  if (istDateOf(start) !== journeyDate || istDateOf(end) !== journeyDate) {
    return 'Departure times must be on the journey date (India time)';
  }
  if (Date.parse(end) < Date.parse(start)) {
    return 'The departure window must end after it starts';
  }
  if (Date.parse(start) <= now.getTime()) {
    return 'The departure time has already passed';
  }
  if (journeyDate > addDays(istDateString(now), MAX_DAYS_AHEAD)) {
    return `Rides can be offered up to ${MAX_DAYS_AHEAD} days ahead`;
  }
  return null;
}

/** Whether a resident may join a ride with the given gender preference */
export function meetsGenderPreference(preference: GenderPreference, seeker: Pick<User, 'gender'>): boolean {
  if (preference === 'FEMALE_ONLY') return seeker.gender === 'FEMALE';
  if (preference === 'MALE_ONLY') return seeker.gender === 'MALE';
  return true;
}
