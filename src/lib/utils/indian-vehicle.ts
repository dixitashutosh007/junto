/**
 * Indian Vehicle Standard Validation and Formatting Utility
 * Follows MoRTH (Ministry of Road Transport and Highways) standard formats:
 * - Standard State Format: State Code (2 letters) + District/RTO Code (2 digits) + Optional Series (1-3 letters) + 4 Digits
 *   Examples: KA-01-AB-1234, DL-03-C-5678, MH-12-DE-9012, KA-04-1234
 * - BH (Bharat Series) Format: YY (2 digits) + BH + 4 Digits + 1-2 letters
 *   Examples: 22-BH-1234-AA, 23-BH-5678-B
 */

export const INDIAN_STATE_CODES = [
  'AN', 'AP', 'AR', 'AS', 'BR', 'CH', 'CG', 'DD', 'DL', 'DN',
  'GA', 'GJ', 'HP', 'HR', 'JH', 'JK', 'KA', 'KL', 'LA', 'LD',
  'MH', 'ML', 'MN', 'MP', 'MZ', 'NL', 'OD', 'PB', 'PY', 'RJ',
  'SK', 'TN', 'TR', 'TS', 'UK', 'UP', 'WB'
];

/**
 * Standard Indian State pattern: e.g. KA01AB1234 or KA-01-AB-1234
 * Bharat Series pattern: e.g. 22BH1234AA or 22-BH-1234-AA
 */

export function formatIndianRegistration(input: string): string {
  const clean = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
  
  // Check Bharat Series (e.g. 22BH1234AA -> 22 BH 1234 AA)
  const bhMatch = clean.match(/^([0-9]{2})(BH)([0-9]{4})([A-Z]{1,2})$/);
  if (bhMatch) {
    return `${bhMatch[1]} BH ${bhMatch[3]} ${bhMatch[4]}`;
  }

  // Check Standard Series (e.g. KA04MB1234 -> KA 04 MB 1234)
  const stdMatch = clean.match(/^([A-Z]{2})([0-9]{2})([A-Z]{1,3})?([0-9]{4})$/);
  if (stdMatch) {
    const parts = [stdMatch[1], stdMatch[2], stdMatch[3], stdMatch[4]].filter(Boolean);
    return parts.join(' ');
  }

  return input.toUpperCase().trim();
}

export function validateIndianRegistration(input: string): { isValid: boolean; error?: string } {
  if (!input || !input.trim()) {
    return { isValid: false, error: 'Registration number is required' };
  }

  const clean = input.toUpperCase().replace(/[^A-Z0-9]/g, '');

  if (clean.length < 8 || clean.length > 11) {
    return {
      isValid: false,
      error: 'Invalid length. Indian registration numbers must follow format like KA-01-AB-1234 or 22-BH-1234-AA',
    };
  }

  // Check Bharat Series
  const bhMatch = clean.match(/^([0-9]{2})(BH)([0-9]{4})([A-Z]{1,2})$/);
  if (bhMatch) {
    return { isValid: true };
  }

  // Check Standard State Series
  const stdMatch = clean.match(/^([A-Z]{2})([0-9]{1,2})([A-Z]{0,3})([0-9]{4})$/);
  if (stdMatch) {
    const stateCode = stdMatch[1];
    if (!INDIAN_STATE_CODES.includes(stateCode)) {
      return {
        isValid: false,
        error: `"${stateCode}" is not a recognized Indian State / UT code (e.g. KA, MH, DL, TS, TN, AP, etc.)`,
      };
    }
    return { isValid: true };
  }

  return {
    isValid: false,
    error: 'Please enter a valid Indian vehicle number (e.g. KA-04-MB-1234 or 22-BH-1234-AA)',
  };
}
