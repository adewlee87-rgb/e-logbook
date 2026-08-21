import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { roleHomeRoute, type UserRole } from "@/lib/roles";

const protectedPrefixes = ["/student", "/supervisor", "/admin"];
const authPages = ["/login", "/signup"];

export async function middleware(request: NextRequest) {
  try {
    const { response, supabase, user } = await updateSession(request);
    const { pathname } = request.nextUrl;

    const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
    const isAuthPage = authPages.includes(pathname);

    if (!user || !supabase) {
      if (isProtected) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        return NextResponse.redirect(url);
      }
      return response;
    }

    if (user && !user.email_confirmed_at) {
      if (isProtected || pathname === "/signup") {
        const url = request.nextUrl.clone();
        url.pathname = "/verify-email";
        if (user.email) {
          url.searchParams.set("email", user.email);
        }
        return NextResponse.redirect(url);
      }
    }

    if (isProtected || isAuthPage) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      const role = profile?.role as UserRole | undefined;
      const homeRoute = role ? roleHomeRoute[role] : undefined;

      if (isAuthPage && homeRoute) {
        const url = request.nextUrl.clone();
        url.pathname = homeRoute;
        return NextResponse.redirect(url);
      }

      if (isProtected && homeRoute && !pathname.startsWith(homeRoute)) {
        const url = request.nextUrl.clone();
        url.pathname = homeRoute;
        return NextResponse.redirect(url);
      }
    }

    return response;
  } catch (err) {
    console.error("Middleware execution error:", err);
    return NextResponse.next({ request });
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|auth/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
