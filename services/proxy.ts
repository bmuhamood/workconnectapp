// proxy.ts — Supabase session refresh + the same route-protection
// rules the app already had, now keyed off a real Supabase session instead
// of a hand-rolled access_token cookie.
//
// Renamed from middleware.ts per the Next.js 16 convention (the file
// convention and exported function name both changed from "middleware" to
// "proxy" — see https://nextjs.org/docs/messages/middleware-to-proxy).
// Behavior is unchanged; this still runs on the Node.js runtime, which is
// what the Supabase SSR cookie-sync pattern below requires.
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED_ROUTES = [
  '/dashboard',
  '/profile',
  '/settings',
  '/documents',
  '/contracts',
  '/payments',
  '/messages',
  '/notifications',
  '/applications',
  '/saved-jobs',
  '/post-job',
];

// '/admin' alone is sufficient — startsWith below covers every /admin/* sub-route.
const ADMIN_ROUTES = ['/admin'];
const AUTH_ROUTES = ['/login', '/register', '/register/worker', '/register/employer'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value }: { name: string; value: string }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options?: any }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refreshes the session if it's expired — required for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtectedRoute = PROTECTED_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`));
  const isAdminRoute = ADMIN_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`));
  const isAuthRoute = AUTH_ROUTES.includes(pathname);

  if ((isProtectedRoute || isAdminRoute) && !user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    loginUrl.searchParams.set('reason', 'authentication_required');
    return NextResponse.redirect(loginUrl);
  }

  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public/).*)'],
};
