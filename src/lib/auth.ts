import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { APIError } from 'better-auth/api';
import { db } from './db';
import { allowedGoogleProfile, schoolEmail } from './account-policy';
import { trustedSiteOrigins } from './site-origin';

export const googleConfigured = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: trustedSiteOrigins(process.env.BETTER_AUTH_URL),
  secret: process.env.BETTER_AUTH_SECRET,
  ...(process.env.BETTER_AUTH_URL ? {onAPIError:{errorURL:new URL('/login?authError=1',process.env.BETTER_AUTH_URL).href}} : {}),
  database: prismaAdapter(db, {provider:'postgresql'}),
  emailAndPassword: {enabled:false},
  socialProviders: googleConfigured ? {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      prompt: 'select_account',
      // Let the player choose a different Google account on every attempt.
      // Check Google's authenticated profile on every login, including returning users.
      mapProfileToUser(profile) {
        if (!allowedGoogleProfile(profile)) throw new APIError('FORBIDDEN', {message:'Use your verified syss.edu.hk school Google account.'});
        return {email:profile.email.toLowerCase(), emailVerified:true};
      },
    },
  } : {},
  account: {accountLinking:{enabled:false}, storeAccountCookie:false},
  session: {expiresIn:60*60*24*7, updateAge:60*60*24, cookieCache:{enabled:false}},
  user: {changeEmail:{enabled:false},deleteUser:{enabled:true,beforeDelete:async(user,request)=>{
    if(!user.emailVerified||!schoolEmail(user.email))throw new APIError('FORBIDDEN');
    const expected=request?.headers.get('X-Bond-Lab-Account');
    if(expected&&expected!==user.id)throw new APIError('FORBIDDEN');
  }}},
  databaseHooks: {
    user: {create:{before:async user => {
      if (!schoolEmail(user.email) || !user.emailVerified) throw new APIError('FORBIDDEN', {message:'School Google accounts only.'});
      return {data:user};
    }}},
    session: {create:{before:async session => {
      const user = await db.user.findUnique({where:{id:session.userId}});
      if (!user?.emailVerified || !schoolEmail(user.email)) throw new APIError('FORBIDDEN', {message:'School Google accounts only.'});
      return {data:session};
    }}},
  },
});

export async function accountSession(request: Request) {
  const session = await auth.api.getSession({headers:request.headers});
  if(request.headers.has('X-Bond-Lab-Account') && request.headers.get('X-Bond-Lab-Account')!==session?.user.id)return null;
  return session?.user.emailVerified && schoolEmail(session.user.email) ? session : null;
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  return Boolean(origin && trustedSiteOrigins(process.env.BETTER_AUTH_URL??request.url).includes(origin));
}
