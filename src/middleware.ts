import { defineMiddleware } from 'astro:middleware';
import { getSessionUser } from './lib/auth';
import prisma from './lib/prisma';

export const onRequest = defineMiddleware(async (context, next) => {
  // Protect admin routes
  if (context.url.pathname.startsWith('/admin')) {
    const user = getSessionUser(context.cookies);
    if (!user || user.role === 'customer') {
      return context.redirect('/login?redirect=/admin');
    }

    // Fetch role permissions
    const roleData = await prisma.role.findUnique({ where: { name: user.role } });
    const isSystem = user.role === 'admin' || roleData?.isSystem;
    const permissions = (roleData?.permissions || {}) as Record<string, Record<string, boolean>>;

    // Basic module mapping based on URL path
    const path = context.url.pathname;
    let moduleKey = '';
    
    if (path.startsWith('/admin/orders')) moduleKey = 'orders';
    else if (path.startsWith('/admin/products') || path.startsWith('/admin/categories')) moduleKey = 'products';
    else if (path.startsWith('/admin/inventory')) moduleKey = 'inventory';
    else if (path.startsWith('/admin/finance')) moduleKey = 'finance';
    else if (path.startsWith('/admin/blog')) moduleKey = 'blog';
    else if (path.startsWith('/admin/coupons')) moduleKey = 'coupons';
    else if (path.startsWith('/admin/crm')) moduleKey = 'crm';
    else if (path.startsWith('/admin/users') || path.startsWith('/admin/roles')) moduleKey = 'users';
    else if (path.startsWith('/admin/popups')) moduleKey = 'popups';
    else if (path.startsWith('/admin/config')) moduleKey = 'config';

    // If it's a known module and the user is not system admin, enforce 'view'
    if (moduleKey && !isSystem) {
      const hasView = permissions?.[moduleKey]?.['view'];
      if (!hasView && context.request.method === 'GET') {
        // Redirect to admin overview if they lack view access to this module
        return context.redirect('/admin');
      }
    }

    // Share user data (including permissions) with Astro.locals
    context.locals.user = { ...user, isSystem, permissions };
  }

  
  return next();
});
