import { defineMiddleware } from 'astro:middleware';
import { readSession, validateNext } from './server/auth.mjs';

function redirect(location, setCookie) {
  const headers = new Headers({ Location: location, 'Cache-Control': 'no-store' });
  if (setCookie) headers.append('Set-Cookie', setCookie);
  return new Response(null, { status: 302, headers });
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { session, setCookie } = await readSession(context.request);
  context.locals.user = session ? { login: session.login } : null;

  const pathname = context.url.pathname;
  if (pathname === '/' && session) {
    const requested = context.url.searchParams.get('next');
    const destination = validateNext(requested, '');
    if (destination) return redirect(destination, setCookie);
  }

  if (pathname !== '/' && !session) {
    const requested = validateNext(pathname);
    return redirect(`/?next=${encodeURIComponent(requested)}`, setCookie);
  }

  const response = await next();
  response.headers.set('Cache-Control', 'no-store');
  if (setCookie) response.headers.append('Set-Cookie', setCookie);
  return response;
});
