import { auth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';
export const runtime = 'nodejs';
const handlers = toNextJsHandler(auth);
export const POST = handlers.POST;
export async function GET(request:Request) {
  const response = await handlers.GET(request);
  // A rejected Google profile should return to the game with a helpful message.
  if (new URL(request.url).pathname === '/api/auth/callback/google' && response.status >= 400) {
    return Response.redirect(new URL('/login?authError=1',process.env.BETTER_AUTH_URL??request.url),303);
  }
  return response;
}
