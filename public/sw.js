/* eslint-disable no-restricted-globals */
self.addEventListener("push", function (event) {
  var payload = { title: "알림", body: "새 알림이 있습니다.", linkUrl: "/" };
  if (event.data) {
    try {
      var parsed = event.data.json();
      if (parsed && typeof parsed === "object") {
        if (parsed.title) payload.title = parsed.title;
        if (parsed.body != null) payload.body = parsed.body;
        if (parsed.linkUrl) payload.linkUrl = parsed.linkUrl;
      }
    } catch (_) {
      try {
        payload.body = event.data.text() || payload.body;
      } catch (_) {}
    }
  }
  var options = {
    body: payload.body,
    data: { linkUrl: payload.linkUrl || "/" },
    tag: "eq-" + Date.now(),
    renotify: true,
    requireInteraction: false,
  };
  event.waitUntil(
    self.registration.showNotification(payload.title, options)
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const path = event.notification.data?.linkUrl || "/";
  const url = path.startsWith("http") ? path : self.location.origin + path;
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        if (clientList[i].url && "focus" in clientList[i]) {
          clientList[i].navigate(url);
          return clientList[i].focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
