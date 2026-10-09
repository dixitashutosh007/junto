import { describe, it, expect } from 'vitest';
import { smsSendErrorMessage } from '../sms-errors';

describe('smsSendErrorMessage', () => {
  it('explains known Firebase errors and keeps the code', () => {
    expect(smsSendErrorMessage({ code: 'auth/billing-not-enabled' })).toBe(
      'SMS sign-in is not set up yet. Please contact your society admin. (auth/billing-not-enabled)'
    );
    expect(smsSendErrorMessage({ code: 'auth/too-many-requests' })).toMatch(/^Too many attempts/);
  });

  it('falls back to a general message, still showing an unknown code', () => {
    expect(smsSendErrorMessage({ code: 'auth/internal-error' })).toBe(
      'Unable to send the SMS code. Please check the number and try again. (auth/internal-error)'
    );
    expect(smsSendErrorMessage(new Error('boom'))).toBe(
      'Unable to send the SMS code. Please check the number and try again.'
    );
  });
});
