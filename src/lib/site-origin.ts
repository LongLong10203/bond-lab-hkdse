export const LIVE_ORIGIN='https://bond-lab-hkdse.vercel.app';
export const LEGACY_ORIGIN='https://bond-lab-hkdse-longs-projects-0240e8f8.vercel.app';
export function trustedSiteOrigins(baseURL:string|undefined){
  if(!baseURL)return [];
  const origin=new URL(baseURL).origin;
  return [LIVE_ORIGIN,LEGACY_ORIGIN].includes(origin)?[LIVE_ORIGIN,LEGACY_ORIGIN]:[origin];
}
