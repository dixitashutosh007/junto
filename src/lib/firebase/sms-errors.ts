/**
 * Turns a Firebase phone-auth error from sending an SMS code into a message
 * that says what went wrong. The Firebase code is appended so a resident can
 * report it and an admin can look it up.
 */
export function smsSendErrorMessage(err: unknown): string {
  const code = typeof err === 'object' && err && 'code' in err ? String((err as { code: unknown }).code) : '';
  const reason = SMS_ERROR_REASONS[code] ?? 'Unable to send the SMS code. Please check the number and try again.';
  return code ? `${reason} (${code})` : reason;
}

const SMS_ERROR_REASONS: Record<string, string> = {
  'auth/invalid-phone-number': 'That mobile number is not valid. Please check it and try again.',
  'auth/too-many-requests': 'Too many attempts from this device. Please wait a while and try again.',
  'auth/quota-exceeded': 'SMS sending is paused for today. Please try again later or contact your society admin.',
  'auth/billing-not-enabled': 'SMS sign-in is not set up yet. Please contact your society admin.',
  'auth/operation-not-allowed': 'SMS sign-in is not set up for this number. Please contact your society admin.',
  'auth/unauthorized-domain': 'Sign-in is not enabled on this web address. Please contact your society admin.',
  'auth/captcha-check-failed': 'The security check failed. Please refresh the page and try again.',
  'auth/invalid-app-credential': 'The security check failed. Please refresh the page and try again.',
  'auth/network-request-failed': 'Connection problem. Check your internet and try again.',
};
