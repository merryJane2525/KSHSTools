declare module "web-push" {
  interface PushSubscription {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  }

  interface SendNotificationOptions {
    TTL?: number;
  }

  function setVapidDetails(
    subject: string,
    publicKey: string,
    privateKey: string
  ): void;

  function sendNotification(
    subscription: PushSubscription,
    payload?: string | Buffer | null,
    options?: SendNotificationOptions
  ): Promise<{ statusCode: number }>;

  function generateVAPIDKeys(): {
    publicKey: string;
    privateKey: string;
  };
}
