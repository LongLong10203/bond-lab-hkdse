import type { Prisma } from '@/generated/prisma/client';
import { schoolDomains, privateAllowedEmails } from './account-policy';

export const eligiblePlayer: Prisma.PlayerProgressWhereInput = {
  displayName: { not: null },
  user: {
    emailVerified: true,
    OR: [
      ...schoolDomains().map(domain => ({
        email: { endsWith: `@${domain}`, mode: 'insensitive' as const },
      })),
      { email: { in: privateAllowedEmails(), mode: 'insensitive' } },
    ],
  },
};
export const leaderboardSelect={userId:true,displayName:true,xp:true,completed:true} satisfies Prisma.PlayerProgressSelect;
