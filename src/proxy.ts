import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth-session";

/** 비로그인 사용자 허용 경로 */
function isPublicPath(pathname: string): boolean {
  if (pathname === "/" || pathname === "/login" || pathname === "/signup") return true;
  if (pathname === "/about") return true;
  if (pathname === "/community") return true;
  if (pathname === "/equipments") return true;
  if (pathname === "/reservations") return true;

  if (pathname === "/robots.txt" || pathname === "/sitemap.xml") return true;

  if (pathname.startsWith("/search")) return true;
  if (pathname.startsWith("/api")) return true;
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) return true;

  // 게시글 상세(눈팅). 질문 작성(/posts/new)은 로그인 필요
  if (pathname === "/posts/new") return false;
  if (/^\/posts\/[^/]+$/.test(pathname)) return true;

  // 예약: /reservations/[slug] 달력·현황. 내 예약·신청 폼은 로그인 필요
  if (pathname.startsWith("/reservations/my")) return false;
  if (/^\/reservations\/[^/]+\/new/.test(pathname)) return false;
  if (/^\/reservations\/[^/]+$/.test(pathname)) return true;

  // 매뉴얼 편집(ADMIN) — 페이지에서 권한 처리, 미들웨어에서는 비공개
  if (/^\/equipments\/[^/]+\/manual\/edit/.test(pathname)) return false;

  // 기자재 매뉴얼 열람: /equipments/[slug]/manual
  if (/^\/equipments\/[^/]+\/manual\/?$/.test(pathname)) return true;
  // 기자재 상세: /equipments/[slug]
  if (/^\/equipments\/[^/]+$/.test(pathname)) return true;

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
