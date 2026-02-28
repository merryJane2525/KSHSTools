import Link from "next/link";
import Image from "next/image";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";
import { ThemeToggle } from "@/app/_components/ThemeToggle";

export async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="relative z-50 border-b border-zinc-200/80 bg-white/85 dark:border-zinc-800/80 dark:bg-zinc-900/85 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 hover:opacity-80 transition-opacity">
            <Image
              src="/favicon.ico"
              alt="KSHS 심화기자재"
              width={20}
              height={20}
              className="shrink-0"
            />
            <span>KSHS 심화기자재</span>
          </Link>
          <nav className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-300">
            <Link className="hover:text-zinc-900 dark:hover:text-zinc-100" href="/community">
              커뮤니티
            </Link>
            <Link className="hover:text-zinc-900 dark:hover:text-zinc-100" href="/equipments">
              기자재
            </Link>
            {user && (
              <Link className="hover:text-zinc-900 dark:hover:text-zinc-100" href="/reservations">
                예약
              </Link>
            )}
            <Link className="hover:text-zinc-900 dark:hover:text-zinc-100" href="/notifications">
              알림
            </Link>
            {user && (user.role === "OPERATOR" || user.role === "ADMIN") && (
              <Link className="hover:text-zinc-900 dark:hover:text-zinc-100" href="/operator">
                오퍼레이터
              </Link>
            )}
            {user && user.role === "ADMIN" && (
              <>
                <Link className="hover:text-zinc-900 dark:hover:text-zinc-100" href="/admin/users">
                  사용자 관리
                </Link>
                <Link className="hover:text-zinc-900 dark:hover:text-zinc-100" href="/admin/posts">
                  게시글 관리
                </Link>
              </>
            )}
            {user && (
              <Link className="hover:text-zinc-900 dark:hover:text-zinc-100" href="/posts/new">
                게시글 작성
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <ThemeToggle />
          {user ? (
            <>
              <div className="hidden items-center gap-2 text-zinc-700 dark:text-zinc-300 sm:flex">
                <span className="font-medium text-zinc-900 dark:text-zinc-100">@{user.username}</span>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  {user.role}
                </span>
              </div>
              <form action={logoutAction}>
                <button className="rounded-xl border border-zinc-200 px-3 py-1.5 text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800">
                  로그아웃
                </button>
              </form>
            </>
          ) : (
            <>
              <Link className="rounded-xl border border-zinc-200 px-3 py-1.5 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800" href="/login">
                로그인
              </Link>
              <Link className="rounded-xl bg-zinc-900 px-3 py-1.5 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200" href="/signup">
                회원가입
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

