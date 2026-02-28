/**
 * Web Push 알림 전송.
 * VAPID 키: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY 환경 변수 필요.
 * 없으면 푸시 전송을 건너뜁니다.
 *
 * 키 생성: npx web-push generate-vapid-keys
 */
import webpush from "web-push";
import { prisma } from "@/lib/db";

let vapidConfigured = false;

function configureVapid() {
  if (vapidConfigured) return true;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(
    "mailto:support@example.com",
    publicKey,
    privateKey
  );
  vapidConfigured = true;
  return true;
}

export type PushPayload = {
  title: string;
  body: string;
  linkUrl: string;
};

/**
 * 해당 사용자의 모든 구독에 푸시 알림 전송.
 * 실패한 구독(만료 등)은 DB에서 제거합니다.
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<void> {
  if (!configureVapid()) return;

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
    select: { id: true, endpoint: true, p256dh: true, auth: true },
  });

  if (subscriptions.length === 0) return;

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    linkUrl: payload.linkUrl,
  });

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        body,
        {
          TTL: 60 * 60 * 24,
        }
      );
    } catch (err) {
      // 410 Gone, 404 Not Found 등은 구독 무효 → 삭제
      const statusCode =
        err && typeof err === "object" && "statusCode" in err
          ? (err as { statusCode?: number }).statusCode
          : 0;
      if (statusCode === 410 || statusCode === 404 || statusCode === 403) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
      }
    }
  }
}
