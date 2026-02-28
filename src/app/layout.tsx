import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/app/_components/Header";
import { ThemeProvider } from "@/app/_components/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kshstools.co.kr";

const seoKeywords = [
  "강원과학고", "강원과학고등학교", "강원과학고 심화기자재", "강원과학고등학교 심화기자재",
  "KSHS", "KSHS 심화기자재", "강원과학고 오퍼레이터", "강원과학고 원재인", "KSHS 원재인", "32기 원재인",
  "심화기자재", "기자재", "실험", "SEM", "FT-IR", "NMR", "기자재 사용법", "실험 노하우", "기자재 Q&A",
];

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: "KSHS 심화기자재 | 강원과학고등학교 심화기자재",
  description: "강원과학고등학교(KSHS) 심화기자재 사용법, 실험 노하우, 기자재 Q&A를 공유하는 플랫폼. 강원과학고 오퍼레이터·원재인(32기)이 운영하며, SEM, FT-IR, NMR 등 다양한 심화 기자재의 체계적인 사용 정보와 커뮤니티를 제공합니다.",
  keywords: seoKeywords,
  authors: [{ name: "KSHS 심화기자재 운영팀" }, { name: "강원과학고등학교 원재인" }],
  alternates: {
    canonical: baseUrl,
  },
  openGraph: {
    title: "KSHS 심화기자재 | 강원과학고등학교 심화기자재",
    description: "강원과학고등학교(KSHS) 심화기자재 사용법, 실험 노하우, 기자재 Q&A. 강원과학고 오퍼레이터·원재인 운영.",
    type: "website",
    locale: "ko_KR",
    url: baseUrl,
    siteName: "KSHS 심화기자재",
  },
  twitter: {
    card: "summary_large_image",
    title: "KSHS 심화기자재 | 강원과학고등학교 심화기자재",
    description: "강원과학고등학교 심화기자재 사용 정보 및 실험 경험 공유 플랫폼",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  other: process.env.NAVER_SITE_VERIFICATION
    ? { "naver-site-verification": process.env.NAVER_SITE_VERIFICATION }
    : undefined,
};

const themeScript = `
(function() {
  var key = 'kshs-theme';
  var stored = localStorage.getItem(key);
  var dark = stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches);
  if (dark) document.documentElement.classList.add('dark');
  else document.documentElement.classList.remove('dark');
})();
`;

const baseUrlStructured = process.env.NEXT_PUBLIC_SITE_URL || "https://kshstools.co.kr";

const webSiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "KSHS 심화기자재",
  alternateName: ["강원과학고등학교 심화기자재", "강원과학고 심화기자재", "강원과학고 기자재", "KSHS 기자재"],
  description: "강원과학고등학교(KSHS) 심화기자재 사용법, 실험 노하우, 기자재 Q&A를 공유하는 플랫폼. 강원과학고 오퍼레이터·원재인(32기) 운영.",
  url: baseUrlStructured,
  inLanguage: "ko-KR",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${baseUrlStructured}/community?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "KSHS 심화기자재",
  alternateName: ["강원과학고등학교 심화기자재", "강원과학고 심화기자재", "KSHS"],
  url: baseUrlStructured,
  description: "강원과학고등학교 심화기자재 사용법·실험 노하우·기자재 Q&A 공유 플랫폼. 강원과학고 오퍼레이터·원재인(32기)이 운영합니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <ThemeProvider>
          <div className="min-h-dvh bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 overflow-x-hidden">
            <Header />
            <main className="mx-auto w-full max-w-5xl px-6 py-8">{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
