import Link from "next/link";

type NavUser = {
  username: string;
  role: string;
  email: string | null;
} | null;

const linkClass =
  "whitespace-nowrap rounded-lg px-2 py-2 text-sm text-primary/60 hover:bg-primary/5 hover:text-primary transition-colors sm:px-3";

/** 데스크톱 가로 나열 / 모바일 드로어 세로 나열 공통 */
export function HeaderNavLinks({ user }: { user: NavUser }) {
  return (
    <>
      <Link className={linkClass} href="/community">
        커뮤니티
      </Link>
      <Link className={linkClass} href="/equipments">
        기자재
      </Link>
      <Link className={linkClass} href="/reservations">
        예약
      </Link>
      <Link className={`${linkClass} lg:hidden`} href="/search">
        검색
      </Link>
      {user && (
        <>
          <Link className={linkClass} href="/notifications">
            알림
          </Link>
          {!user.email && (
            <Link
              className="whitespace-nowrap rounded-lg px-2 py-2 text-sm font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 transition-colors sm:px-3"
              href="/account"
            >
              이메일 등록
            </Link>
          )}
          {user.email && (
            <Link className={linkClass} href="/account">
              계정
            </Link>
          )}
          {(user.role === "OPERATOR" || user.role === "ADMIN") && (
            <Link className={linkClass} href="/operator">
              오퍼레이터
            </Link>
          )}
          {user.role === "ADMIN" && (
            <>
              <Link className={linkClass} href="/admin/users">
                사용자 관리
              </Link>
              <Link className={linkClass} href="/admin/posts">
                게시글 관리
              </Link>
            </>
          )}
          <Link className={linkClass} href="/posts/new">
            게시글 작성
          </Link>
        </>
      )}
    </>
  );
}
