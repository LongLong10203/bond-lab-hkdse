const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const domainPattern = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

// Server-only configuration. Empty or malformed entries never grant access.
// Use exact domains; wildcard and subdomain matching are intentionally unsupported.
export function schoolDomains(): string[] {
  return [...new Set((process.env.AUTH_SCHOOL_DOMAINS ?? '').split(',')
    .map(domain => domain.trim().toLowerCase())
    .filter(domain => domain.length <= 253 && domainPattern.test(domain)))];
}

export function schoolEmail(email: unknown): email is string {
  return typeof email === 'string' && emailPattern.test(email) &&
    schoolDomains().includes(email.split('@')[1].toLowerCase());
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
