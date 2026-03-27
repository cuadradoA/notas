import { useState } from "react";
import { useNotifications } from "../context/NotificationContext";

function formatDate(value) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markOneAsRead, markEverythingAsRead } = useNotifications();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative rounded-2xl border px-4 py-3 text-sm font-medium"
        style={{ borderColor: "var(--app-border)", backgroundColor: "var(--app-surface)", color: "var(--app-text)" }}
      >
        Notificaciones
        {unreadCount ? (
          <span className="absolute -right-2 -top-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-[11px] font-semibold text-white" style={{ backgroundColor: "var(--app-danger)" }}>
            {unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-40 mt-3 w-[360px] rounded-[24px] border p-4 shadow-2xl" style={{ borderColor: "var(--app-border)", backgroundColor: "var(--app-surface)" }}>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold" style={{ color: "var(--app-text)" }}>Notificaciones</p>
            <button onClick={() => markEverythingAsRead()} className="text-xs font-medium" style={{ color: "var(--app-primary)" }}>
              Marcar todas
            </button>
          </div>

          <div className="app-scrollbar mt-4 grid max-h-[420px] gap-3 overflow-y-auto">
            {notifications.length ? notifications.map((notification) => (
              <button
                key={notification._id}
                onClick={() => markOneAsRead(notification._id)}
                className="rounded-2xl border px-4 py-3 text-left"
                style={{
                  borderColor: notification.read ? "var(--app-border)" : "color-mix(in srgb, var(--app-primary) 35%, transparent)",
                  backgroundColor: notification.read ? "var(--app-shell)" : "color-mix(in srgb, var(--app-primary) 12%, var(--app-surface))",
                }}
              >
                {notification.title ? (
                  <p className="text-xs uppercase tracking-[0.18em]" style={{ color: "var(--app-primary)" }}>{notification.title}</p>
                ) : null}
                <p className="text-sm" style={{ color: "var(--app-text)" }}>{notification.message}</p>
                {notification.meta?.taskTitle || notification.meta?.projectName ? (
                  <p className="mt-2 text-xs" style={{ color: "var(--app-text-soft)" }}>
                    {[notification.meta?.taskTitle, notification.meta?.projectName].filter(Boolean).join(" • ")}
                  </p>
                ) : null}
                <p className="mt-2 text-[11px] uppercase tracking-[0.18em]" style={{ color: "var(--app-text-muted)" }}>{notification.type}</p>
                <p className="mt-1 text-xs" style={{ color: "var(--app-text-soft)" }}>{formatDate(notification.createdAt)}</p>
              </button>
            )) : (
              <div className="rounded-2xl border border-dashed px-4 py-8 text-center text-sm" style={{ borderColor: "var(--app-border)", color: "var(--app-text-soft)" }}>
                Sin notificaciones por ahora.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
