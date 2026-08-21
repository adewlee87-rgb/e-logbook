/**
 * Utility functions for password and date range validations across Y'ello Log.
 */

export interface PasswordValidationResult {
  isValid: boolean;
  error?: string;
  checks: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
}

export function validatePasswordStrength(password: string): PasswordValidationResult {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  let error: string | undefined;

  if (!checks.length) {
    error = "Password must be at least 8 characters long.";
  } else if (!checks.uppercase) {
    error = "Password must contain at least one uppercase letter (A-Z).";
  } else if (!checks.lowercase) {
    error = "Password must contain at least one lowercase letter (a-z).";
  } else if (!checks.number) {
    error = "Password must contain at least one number (0-9).";
  } else if (!checks.special) {
    error = "Password must contain at least one special character (e.g. !@#$%^&*).";
  }

  const isValid = checks.length && checks.uppercase && checks.lowercase && checks.number && checks.special;

  return { isValid, error, checks };
}

export interface DateRangeValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateDateRange(startDateStr: string, endDateStr: string): DateRangeValidationResult {
  if (!startDateStr || !endDateStr) {
    return { isValid: true };
  }

  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { isValid: false, error: "Invalid date format." };
  }

  if (end < start) {
    return { isValid: false, error: "End date cannot be earlier than start date." };
  }

  // Enforce minimum gap of 1 month (at least 28 days / 1 full calendar month)
  const minEndDate = new Date(start);
  minEndDate.setMonth(minEndDate.getMonth() + 1);

  if (end < minEndDate) {
    return {
      isValid: false,
      error: "End date must be at least 1 month after start date.",
    };
  }

  return { isValid: true };
}
