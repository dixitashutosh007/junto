import { describe, it, expect } from 'vitest';
import { phoneVariants, planGrant } from '../grant-app-admin';
import type { SocietyMembership, User } from '../../src/types';

const user = { id: 'uid-1', fullName: 'Asha', mobile: '+919876543210' } as User;
const member = (societyId: string, extra: Partial<SocietyMembership> = {}) =>
  ({
    id: `mem-${societyId}`,
    societyId,
    userId: 'uid-1',
    flatNumber: 'A-101',
    role: 'RESIDENT',
    status: 'PENDING_APPROVAL',
    createdAt: '',
    updatedAt: '',
    ...extra,
  }) as SocietyMembership;

describe('phoneVariants', () => {
  it('matches both stored forms of an Indian mobile number', () => {
    expect(phoneVariants('9876543210')).toEqual(['+919876543210', '9876543210']);
    expect(phoneVariants('+91 98765 43210')).toEqual(['+919876543210', '9876543210']);
    expect(phoneVariants('919876543210')).toEqual(['+919876543210', '9876543210']);
  });

  it('rejects anything that is not a 10-digit number', () => {
    expect(() => phoneVariants('12345')).toThrow();
  });
});

describe('planGrant', () => {
  it('promotes the only membership of the only matching user', () => {
    const plan = planGrant([user], { 'uid-1': [member('soc-a')] });
    expect(plan.action).toBe('grant');
    expect(plan.action === 'grant' && plan.membership.societyId).toBe('soc-a');
  });

  it('refuses when no user has the number', () => {
    expect(planGrant([], {}).action).toBe('error');
  });

  it('refuses duplicate users instead of guessing', () => {
    expect(planGrant([user, { ...user, id: 'uid-2' }], {}).action).toBe('error');
  });

  it('asks for --society when there are several memberships, and uses it when given', () => {
    const memberships = { 'uid-1': [member('soc-a'), member('soc-b')] };
    expect(planGrant([user], memberships).action).toBe('error');
    const plan = planGrant([user], memberships, 'soc-b');
    expect(plan.action === 'grant' && plan.membership.societyId).toBe('soc-b');
  });

  it('refuses a --society the user does not belong to', () => {
    expect(planGrant([user], { 'uid-1': [member('soc-a')] }, 'soc-z').action).toBe('error');
  });

  it('does nothing for an existing active App Admin', () => {
    const plan = planGrant([user], { 'uid-1': [member('soc-a', { role: 'SUPER_ADMIN', status: 'ACTIVE' })] });
    expect(plan.action).toBe('already-admin');
  });
});
