export const SCHOOL_DOMAINS = ['syss.edu.hk', 'singyin.edu.hk'];
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function schoolEmail(email: unknown): email is string {
  return typeof email === 'string' && emailPattern.test(email) &&
    SCHOOL_DOMAINS.includes(email.split('@')[1].toLowerCase());
}

// Server configuration only. Never expose this list through public environment variables.
export function privateAllowedEmails(): string[] {
  return [...new Set((process.env.AUTH_ALLOWED_EMAILS ?? '').split(',')
    .map(email => email.trim().toLowerCase())
    .filter(email => emailPattern.test(email)))];
}

export function allowedEmail(email: unknown): email is string {
  return schoolEmail(email) || (typeof email === 'string' && emailPattern.test(email) &&
    privateAllowedEmails().includes(email.toLowerCase()));
}

export function allowedGoogleProfile(profile: { email?: unknown; email_verified?: unknown; hd?: unknown }) {
  if (profile.email_verified !== true || !allowedEmail(profile.email)) return false;
  if (privateAllowedEmails().includes(profile.email.toLowerCase())) return true;
  return schoolEmail(profile.email) && typeof profile.hd === 'string' &&
    profile.hd.toLowerCase() === profile.email.split('@')[1].toLowerCase();
}
