export const SCHOOL_DOMAIN = 'syss.edu.hk';
export function schoolEmail(email: unknown): email is string {
  return typeof email === 'string' && /^[^\s@]+@syss\.edu\.hk$/i.test(email);
}
export function allowedGoogleProfile(profile: { email?: unknown; email_verified?: unknown; hd?: unknown }) {
  return schoolEmail(profile.email) && profile.email_verified === true && profile.hd === SCHOOL_DOMAIN;
}
