import type { APIRoute } from 'astro';
import { clearSessionCookie, getSessionUser } from '../../../lib/auth';
import { logActivity } from '../../../lib/logger';

export const POST: APIRoute = async ({ request, cookies }) => {
  const user = getSessionUser(cookies);
  if (user) {
    await logActivity(request, {
      userId: user.id,
      userName: user.name,
      action: 'LOGOUT',
      module: 'auth',
      details: 'Pengguna keluar (logout) dari sistem',
    });
  }

  clearSessionCookie(cookies);
  return new Response(null, { status: 302, headers: { Location: '/' } });
};
