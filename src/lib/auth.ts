import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { AstroCookies } from 'astro';
import prisma from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'fastprint_secret_key';
const COOKIE_NAME = 'fp_session';

export interface TokenPayload {
  id: string;
  email: string;
  name: string;
  role: string;
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function setSessionCookie(cookies: AstroCookies, token: string) {
  cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

export function clearSessionCookie(cookies: AstroCookies) {
  cookies.delete(COOKIE_NAME, { path: '/' });
}

export function getSessionUser(cookies: AstroCookies): TokenPayload | null {
  const token = cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function requireAuth(cookies: AstroCookies) {
  const user = getSessionUser(cookies);
  if (!user) {
    return null;
  }
  return user;
}

export function requireAdmin(cookies: AstroCookies) {
  const user = getSessionUser(cookies);
  // Allow access to admin area for any role except "customer"
  if (!user || user.role === 'customer') {
    return null;
  }
  return user;
}

export async function checkPermission(cookies: AstroCookies, module: string, action: string) {
  const user = requireAdmin(cookies);
  if (!user) return false;
  if (user.role === 'admin') return true;

  const role = await prisma.role.findUnique({ where: { name: user.role } });
  if (!role) return false;
  if (role.isSystem) return true;

  const perms = (role.permissions || {}) as Record<string, Record<string, boolean>>;
  return perms?.[module]?.[action] === true;
}
