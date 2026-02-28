"use client";

import { useState, useEffect } from "react";

const SW_PATH = "/sw.js";

export function PushEnable() {
  const [status, setStatus] = useState<"loading" | "unsupported" | "granted" | "denied" | "prompt">("loading");
  const [error, setError] = useState<string | null>(null);
  const [vapidPublic, setVapidPublic] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
      setStatus("unsupported");
      return;
    }
    navigator.serviceWorker.register(SW_PATH).catch(() => {});

    if (Notification.permission === "granted") {
      setStatus("granted");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }
    setStatus("prompt");

    fetch("/api/push-vapid-public")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data?.publicKey && setVapidPublic(data.publicKey))
      .catch(() => {});
  }, []);

  const enablePush = async () => {
    setError(null);
    if (!vapidPublic) {
      setError("푸시 설정을 불러올 수 없습니다.");
      return;
    }
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublic) as BufferSource,
      });
      const res = await fetch("/api/push-subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON() }),
        credentials: "same-origin", // 세션 쿠키 포함 (비관리자 포함 모든 로그인 사용자)
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "등록에 실패했습니다.");
      }
      setStatus("granted");
    } catch (e) {
      setError(e instanceof Error ? e.message : "푸시 알림 등록에 실패했습니다.");
    }
  };

  if (status === "loading" || status === "unsupported") return null;

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-medium text-zinc-900 dark:text-zinc-100">
            {status === "granted" ? "푸시 알림이 켜져 있습니다" : "브라우저 푸시 알림"}
          </div>
          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {status === "granted"
              ? "멘션·댓글·담당 지정 시 브라우저로 알림을 받습니다."
              : status === "denied"
                ? "알림이 차단되었습니다. 브라우저 설정에서 허용해 주세요."
                : "멘션·댓글·담당 지정 시 브라우저로 알림을 받을 수 있습니다."}
          </div>
          {error && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
        </div>
        {status === "prompt" && vapidPublic && (
          <button
            type="button"
            onClick={enablePush}
            className="shrink-0 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200"
          >
            푸시 알림 켜기
          </button>
        )}
      </div>
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}
