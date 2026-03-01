import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth-session";

/** 비로그인 사용자 허용 경로: 매뉴얼, 검색, 로그인/회원가입, 홈, 정적/API */
function isPublicPath(pathname: string): boolean {
  if (pathname === "/" || pathname === "/login" || pathname === "/signup") return true;
  if (pathname.startsWith("/search")) return true;
  if (pathname.startsWith("/api")) return true;
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) return true;
  // 기자재 매뉴얼: /equipments/[slug]/manual
  const manualMatch = pathname.match(/^\/equipments\/[^/]+\/manual\/?$/);
  if (manualMatch) return true;
  // 기자재 상세(이번 주 가용 시간·예약 버튼 보기): /equipments/[slug]
  const equipmentDetailMatch = pathname.match(/^\/equipments\/[^/]+$/);
  if (equipmentDetailMatch) return true;
  return false;
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (session) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("returnUrl", pathname + request.nextUrl.search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files and image optimization.
     */
    "/((?!_next/static|_next/image|.*\\.(?:ico|png|jpg|jpeg|gif|webp|svg)$).*)",
  ],
};
