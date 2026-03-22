import Link from "next/link";
import Image from "next/image";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";
import { ThemeToggle } from "@/app/_components/ThemeToggle";
import { SearchBar } from "@/app/_components/SearchBar";
import { HeaderNavLinks } from "@/app/_components/HeaderNavLinks";
import { MobileNavShell } from "@/app/_components/MobileNavShell";

export async function Header() {
  const user = await getCurrentUser();
  const navUser = user
    ? { username: user.username, role: user.role, email: user.email }
    : null;

  return (
    <header className="relative z-50 border-b border-primary/10 bg-white/90 pt-[env(safe-area-inset-top)] dark:bg-[#15191d]/90 dark:border-primary/20 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-3 sm:max-w-6xl sm:px-6 lg:max-w-7xl lg:flex-nowrap lg:gap-x-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-2 lg:gap-4">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 whitespace-nowrap text-sm font-bold tracking-tight text-primary hover:opacity-90 transition-opacity"
          >
            <Image
              src="/favicon.ico"
              alt="KSHS 심화기자재"
              width={20}
              height={20}
              className="shrink-0"
            />
            <span className="max-w-[9rem] truncate sm:max-w-none">KSHS 심화기자재</span>
          </Link>

          <nav className="hidden min-w-0 flex-1 flex-nowrap items-center gap-x-0 gap-y-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-x-1 lg:flex lg:gap-1 [&::-webkit-scrollbar]:hidden">
            <HeaderNavLinks user={navUser} />
          </nav>

          <div className="hidden min-w-0 shrink lg:block lg:max-w-xs xl:max-w-md">
            <SearchBar expandable />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 lg:gap-3">
          <MobileNavShell>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-0.5 [&_a]:flex [&_a]:min-h-11 [&_a]:items-center [&_a]:rounded-xl [&_a]:px-3 [&_a]:py-3 [&_a]:text-base">
                <HeaderNavLinks user={navUser} />
              </div>
              <div className="border-t border-primary/10 pt-4">
                <p className="mb-2 text-xs font-medium text-primary/50">검색</p>
                <SearchBar />
              </div>
            </div>
          </MobileNavShell>

          <ThemeToggle />
          {user ? (
            <>
              <div className="hidden items-center gap-2 text-primary/70 sm:flex">
                <span className="max-w-[6rem] truncate font-medium text-primary lg:max-w-[10rem]">
                  @{user.username}
                </span>
                <span className="shrink-0 rounded-md border border-primary/10 bg-primary/5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-primary/70">
                  {user.role}
                </span>
              </div>
              <form action={logoutAction} className="shrink-0">
                <button
                  type="submit"
                  className="touch-manipulation rounded-lg border border-primary/20 bg-white px-3 py-2 text-sm font-bold text-primary hover:bg-primary/5 sm:px-4 dark:bg-primary/10 dark:border-primary/20 dark:hover:bg-primary/20"
                >
                  로그아웃
                </button>
              </form>
            </>
          ) : (
            <Link
              className="touch-manipulation shrink-0 rounded-lg border border-primary/20 bg-white px-3 py-2 text-sm font-bold text-primary hover:bg-primary/5 sm:px-4 dark:bg-primary/10 dark:border-primary/20 dark:hover:bg-primary/20"
              href="/login"
            >
              로그인
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
