import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

type SubscriptionKeys = {
  p256dh: string;
  auth: string;
};

type SubscriptionJSON = {
  endpoint: string;
  keys: SubscriptionKeys;
  expirationTime?: number | null;
};

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { subscription?: SubscriptionJSON };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const sub = body.subscription;
  if (
    !sub ||
    typeof sub.endpoint !== "string" ||
    !sub.keys ||
    typeof sub.keys.p256dh !== "string" ||
    typeof sub.keys.auth !== "string"
  ) {
    return NextResponse.json(
      { error: "Missing or invalid subscription (endpoint, keys.p256dh, keys.auth)" },
      { status: 400 }
    );
  }

  try {
    await prisma.pushSubscription.upsert({
      where: { endpoint: sub.endpoint },
      create: {
        userId: user.id,
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
      },
      update: {
        userId: user.id, // 같은 브라우저/기기로 다른 사용자가 푸시 켤 때 현재 로그인 사용자로 재할당
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
      },
    });
  } catch (e) {
    console.error("Push subscription save error:", e);
    return NextResponse.json(
      { error: "Failed to save subscription" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
