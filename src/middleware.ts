import { defineMiddleware } from 'astro:middleware';
import { getSessionUser } from './lib/auth';

export const onRequest = defineMiddleware((context, next) => {
  // Protect admin routes
  if (context.url.pathname.startsWith('/admin')) {
    const user = getSessionUser(context.cookies);
    if (!user || user.role !== 'admin') {
      return context.redirect('/login?redirect=/admin');
    }
    // Share user data with Astro.locals
    context.locals.user = user;
  }
  
  return next();
});
