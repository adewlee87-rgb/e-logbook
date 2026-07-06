import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { roleHomeRoute, type UserRole } from "@/lib/roles";

const protectedPrefixes = ["/student", "/supervisor", "/itf", "/admin"];
const authPages = ["/login", "/signup"];

export async function middleware(request: NextRequest) {
  const { response, supabase, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
  const isAuthPage = authPages.includes(pathname);

  if (!user) {
    if (isProtected) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    return response;
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
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|auth/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
