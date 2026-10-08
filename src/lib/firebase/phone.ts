'use client';

import { RecaptchaVerifier } from 'firebase/auth';
import { firebaseAuth } from '@/lib/firebase/config';

/**
 * Client helpers for Firebase phone verification.
 */

// Development builds may skip real SMS and use the fixed test OTP
export const DEV_OTP_BYPASS_ENABLED = process.env.NODE_ENV !== 'production';
export const DEV_TEST_OTP = '123456';

// Minimum wait before another SMS can be requested from the same screen
export const OTP_RESEND_COOLDOWN_SECONDS = 30;

const verifiers = new Map<string, RecaptchaVerifier>();

/** Invisible reCAPTCHA bound to the element with the given id */
export function getRecaptchaVerifier(containerId: string): RecaptchaVerifier {
  let verifier = verifiers.get(containerId);
  if (!verifier) {
    verifier = new RecaptchaVerifier(firebaseAuth, containerId, { size: 'invisible' });
    verifiers.set(containerId, verifier);
  }
  return verifier;
}

/** Discards a verifier after a failed send so the next attempt gets a fresh challenge */
export function resetRecaptchaVerifier(containerId: string): void {
  verifiers.get(containerId)?.clear();
  verifiers.delete(containerId);
}

/** Normalises Indian mobile input ("98111 22233", "+91 98111-22233") to E.164 */
export function toE164IndianMobile(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  const local = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
  return /^[6-9]\d{9}$/.test(local) ? `+91${local}` : null;
}
