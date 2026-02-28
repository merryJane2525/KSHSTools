import { NextResponse } from "next/server";
import { syncAllSearchDocuments } from "@/lib/search-index";

/** 검색 인덱스 전체 동기화. (배포 후 한 번 호출하거나, 관리자 기능으로 노출) */
export async function GET() {
  try {
    await syncAllSearchDocuments();
    return NextResponse.json({ ok: true, message: "검색 인덱스 동기화 완료" });
  } catch (e) {
    console.error("Search sync error:", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "SYNC_FAILED" },
      { status: 500 }
    );
  }
}
