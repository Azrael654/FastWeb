import type { APIRoute } from 'astro';
import prisma from '../../../lib/prisma';
import { getSessionUser, hashPassword } from '../../../lib/auth';
import { logActivity } from '../../../lib/logger';

export const PUT: APIRoute = async ({ request, cookies }) => {
  const user = getSessionUser(cookies);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const data = await request.json();
    
    // Validate inputs (basic validation)
    if (!data.name || typeof data.name !== 'string') {
      return new Response(JSON.stringify({ error: 'Nama wajib diisi' }), { status: 400 });
    }

    const updateData: any = {
      name: data.name.trim(),
      phone: data.phone?.trim() || null,
      address: data.address?.trim() || null,
      city: data.city?.trim() || null,
      province: data.province?.trim() || null,
      postalCode: data.postalCode?.trim() || null,
      avatar: data.avatar || null,
    };

    if (data.password && data.password.trim() !== '') {
      updateData.password = await hashPassword(data.password);
    }

    const updatedUser = await prisma.appUser.update({
      where: { id: user.id },
      data: updateData
    });

    await logActivity(request, {
      userId: user.id,
      userName: user.name,
      action: 'UPDATE',
      module: 'users',
      details: 'Pengguna memperbarui profilnya sendiri',
    });

    // Update the session cookie if name changed
    const userPayload = { 
      id: updatedUser.id, 
      name: updatedUser.name, 
      email: updatedUser.email, 
      role: updatedUser.role 
    };
    
    // Encode to base64
    const cookieValue = Buffer.from(JSON.stringify(userPayload)).toString('base64');
    
    // Set updated cookie
    cookies.set('user_session', cookieValue, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });

    return new Response(JSON.stringify(updatedUser), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: 'Gagal memperbarui profil: ' + error.message }), { status: 500 });
  }
};
