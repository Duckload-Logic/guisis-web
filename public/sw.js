self.addEventListener("push", (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: "New Notification", message: event.data.text() };
    }
  }

  const title = data.title || "Notification";
  const options = {
    body: data.message || "",
    icon: "/logo.svg",
    badge: "/logo.svg",
    data: {
      targetId: data.targetId,
      type: data.type,
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const notificationData = event.notification.data || {};
  const type = (notificationData.type || "").toLowerCase();

  let targetUrl = "/";
  if (type.includes("appointment")) {
    targetUrl = "/student/appointments";
  } else if (type.includes("slip")) {
    targetUrl = "/student/slips";
  }

  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        const clientUrlObj = new URL(client.url);
        if (clientUrlObj.pathname === targetUrl && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
