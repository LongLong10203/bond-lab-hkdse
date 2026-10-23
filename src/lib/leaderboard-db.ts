import type { Prisma } from '@/generated/prisma/client';
export const eligiblePlayer:Prisma.PlayerProgressWhereInput={user:{emailVerified:true,email:{endsWith:'@syss.edu.hk',mode:'insensitive'}}};
export const leaderboardSelect={userId:true,displayName:true,xp:true,completed:true} satisfies Prisma.PlayerProgressSelect;
