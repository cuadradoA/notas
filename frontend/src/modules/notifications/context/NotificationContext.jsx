/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  getMySettings,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  updateMySettings,
} from "../../kanban/services/kanban.service";

const NotificationContext = createContext(null);
const SOCKET_SCRIPT_URL = "http://localhost:3000/socket.io/socket.io.js";

function loadSocketClient() {
  if (window.io) {
    return Promise.resolve(window.io);
  }

  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[data-socket-client="true"]`);
    let timeoutId;

    const cleanupTimeout = () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };

    const fail = () => {
      cleanupTimeout();

      if (existingScript && !window.io) {
        existingScript.remove();
      }

      reject(new Error("Socket client unavailable"));
    };

    if (existingScript) {
      if (window.io) {
        resolve(window.io);
        return;
      }

      timeoutId = window.setTimeout(fail, 3000);
      existingScript.addEventListener("load", () => {
        cleanupTimeout();
        resolve(window.io);
      }, { once: true });
      existingScript.addEventListener("error", fail, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = SOCKET_SCRIPT_URL;
    script.async = true;
    script.dataset.socketClient = "true";
    timeoutId = window.setTimeout(() => {
      script.remove();
      reject(new Error("Socket client timeout"));
    }, 3000);
    script.onload = () => {
      cleanupTimeout();
      resolve(window.io);
    };
    script.onerror = () => {
      cleanupTimeout();
      script.remove();
      reject(new Error("Socket client failed to load"));
    };
    document.body.appendChild(script);
  });
}

export function NotificationProvider({ children, user }) {
  const [notifications, setNotifications] = useState([]);
  const [settings, setSettings] = useState(null);

  const refreshNotifications = async () => {
    const data = await getNotifications();
    setNotifications(data);
    return data;
  };

  const refreshSettings = async () => {
    const data = await getMySettings();
    setSettings(data);
    return data;
  };

  useEffect(() => {
    getNotifications().then(setNotifications).catch(() => {});
    getMySettings().then(setSettings).catch(() => {});

    const interval = setInterval(() => {
      refreshNotifications().catch(() => {});
    }, 15000);

    return () => {
      clearInterval(interval);
    };
  }, [user?.id, user?._id]);

  useEffect(() => {
    const userId = user?.id || user?._id;

    if (!userId) {
      return undefined;
    }

    let socket;
    let cancelled = false;

    loadSocketClient()
      .then((io) => {
        if (cancelled || !io) {
          return;
        }

        socket = io("http://localhost:3000", {
          transports: ["websocket", "polling"]
        });

        socket.on("connect", () => {
          socket.emit("register", userId);
        });

        socket.on("notification", (notification) => {
          setNotifications((prev) => {
            const alreadyExists = prev.some((item) => item._id === notification._id);

            if (alreadyExists) {
              return prev.map((item) => item._id === notification._id ? notification : item);
            }

            return [notification, ...prev];
          });
        });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      socket?.disconnect();
    };
  }, [user?.id, user?._id]);

  const markOneAsRead = async (notificationId) => {
    const updated = await markNotificationAsRead(notificationId);
    setNotifications((prev) => prev.map((item) => item._id === notificationId ? updated : item));
    return updated;
  };

  const markEverythingAsRead = async () => {
    await markAllNotificationsAsRead();
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  const updateSettings = async (payload) => {
    const updated = await updateMySettings(payload);
    setSettings(updated);
    return updated;
  };

  const value = useMemo(() => ({
    notifications,
    unreadCount: notifications.filter((item) => !item.read).length,
    settings,
    refreshNotifications,
    refreshSettings,
    markOneAsRead,
    markEverythingAsRead,
    updateSettings,
  }), [notifications, settings]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error("useNotifications must be used inside NotificationProvider");
  }

  return context;
}
