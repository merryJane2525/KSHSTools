import Link from "next/link";
import Image from "next/image";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";
import { ThemeToggle } from "@/app/_components/ThemeToggle";
import { SearchBar } from "@/app/_components/SearchBar";

export async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="relative z-50 border-b border-primary/10 bg-white/90 dark:bg-[#15191d]/90 dark:border-primary/20 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 sm:max-w-6xl sm:px-6 lg:max-w-7xl lg:flex-nowrap lg:gap-x-6 lg:px-8">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1 lg:flex-nowrap lg:gap-3">
          <Link href="/" className="flex shrink-0 items-center gap-2 whitespace-nowrap text-sm font-bold tracking-tight text-primary hover:opacity-90 transition-opacity">
            <Image
              src="/favicon.ico"
              alt="KSHS 심화기자재"
              width={20}
              height={20}
              className="shrink-0"
            />
            <span>KSHS 심화기자재</span>
          </Link>
          <nav className="flex min-w-0 flex-wrap items-center gap-x-0 gap-y-1 sm:gap-x-1 lg:flex-1 lg:gap-1">
            <Link className="whitespace-nowrap rounded-lg px-2 py-2 text-sm text-primary/60 hover:bg-primary/5 hover:text-primary transition-colors sm:px-3" href="/community">
              커뮤니티
            </Link>
            <Link className="whitespace-nowrap rounded-lg px-2 py-2 text-sm text-primary/60 hover:bg-primary/5 hover:text-primary transition-colors sm:px-3" href="/equipments">
              기자재
            </Link>
            <Link className="whitespace-nowrap rounded-lg px-2 py-2 text-sm text-primary/60 hover:bg-primary/5 hover:text-primary transition-colors lg:hidden sm:px-3" href="/search">
              검색
            </Link>
            {user && (
              <Link className="whitespace-nowrap rounded-lg px-2 py-2 text-sm text-primary/60 hover:bg-primary/5 hover:text-primary transition-colors sm:px-3" href="/reservations">
                예약
              </Link>
            )}
            <Link className="whitespace-nowrap rounded-lg px-2 py-2 text-sm text-primary/60 hover:bg-primary/5 hover:text-primary transition-colors sm:px-3" href="/notifications">
              알림
            </Link>
            {user && (user.role === "OPERATOR" || user.role === "ADMIN") && (
              <Link className="whitespace-nowrap rounded-lg px-2 py-2 text-sm text-primary/60 hover:bg-primary/5 hover:text-primary transition-colors sm:px-3" href="/operator">
                오퍼레이터
              </Link>
            )}
            {user && user.role === "ADMIN" && (
              <>
                <Link className="whitespace-nowrap rounded-lg px-2 py-2 text-sm text-primary/60 hover:bg-primary/5 hover:text-primary transition-colors sm:px-3" href="/admin/users">
                  사용자 관리
                </Link>
                <Link className="whitespace-nowrap rounded-lg px-2 py-2 text-sm text-primary/60 hover:bg-primary/5 hover:text-primary transition-colors sm:px-3" href="/admin/posts">
                  게시글 관리
                </Link>
              </>
            )}
            {user && (
              <Link className="whitespace-nowrap rounded-lg px-2 py-2 text-sm text-primary/60 hover:bg-primary/5 hover:text-primary transition-colors sm:px-3" href="/posts/new">
                게시글 작성
              </Link>
            )}
          </nav>
          <div className="hidden shrink-0 lg:block">
            <SearchBar expandable />
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 sm:gap-3 text-sm">
          <ThemeToggle />
          {user ? (
            <>
              <div className="hidden items-center gap-2 text-primary/70 sm:flex">
                <span className="font-medium text-primary">@{user.username}</span>
                <span className="rounded-md border border-primary/10 bg-primary/5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-primary/70">
                  {user.role}
                </span>
              </div>
              <form action={logoutAction}>
                <button type="submit" className="rounded-lg border border-primary/20 bg-white px-4 py-2 text-sm font-bold text-primary hover:bg-primary/5 dark:bg-primary/10 dark:border-primary/20 dark:hover:bg-primary/20">
                  로그아웃
                </button>
              </form>
            </>
          ) : (
            <>
              <Link className="rounded-lg border border-primary/20 bg-white px-4 py-2 text-sm font-bold text-primary hover:bg-primary/5 dark:bg-primary/10 dark:border-primary/20 dark:hover:bg-primary/20" href="/login">
                로그인
              </Link>
              <Link className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:opacity-90 dark:bg-primary dark:text-[#15191d]" href="/signup">
                회원가입
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

