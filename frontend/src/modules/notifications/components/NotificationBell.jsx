import { useState } from "react";
import { acceptProjectInvitation, rejectProjectInvitation } from "../../kanban/services/kanban.service";
import { useProjects } from "../../projects/context/ProjectContext";
import { useNotifications } from "../context/NotificationContext";

function formatDate(value) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function NotificationCard({
  notification,
  onMarkAsRead,
  onInvitationDecision,
  busyInvitationId,
}) {
  const isPendingInvitation =
    notification.type === "PROJECT_INVITATION" &&
    notification.meta?.invitationId &&
    notification.meta?.invitationStatus === "INVITED";

  return (
    <div
      className="rounded-2xl border px-4 py-3 text-left"
      style={{
        borderColor: notification.read
          ? "var(--app-border)"
          : "color-mix(in srgb, var(--app-primary) 35%, transparent)",
        backgroundColor: notification.read
          ? "var(--app-shell)"
          : "color-mix(in srgb, var(--app-primary) 12%, var(--app-surface))",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {notification.title ? (
            <p
              className="text-xs uppercase tracking-[0.18em]"
              style={{ color: "var(--app-primary)" }}
            >
              {notification.title}
            </p>
          ) : null}
          <p className="text-sm" style={{ color: "var(--app-text)" }}>
            {notification.message}
          </p>
        </div>
        {!notification.read ? (
          <button
            onClick={() => onMarkAsRead(notification._id)}
            className="shrink-0 rounded-xl border px-3 py-1 text-[11px] font-medium"
            style={{
              borderColor: "var(--app-border)",
              color: "var(--app-text-soft)",
            }}
          >
            Marcar
          </button>
        ) : null}
      </div>

      {notification.meta?.taskTitle || notification.meta?.projectName ? (
        <p className="mt-2 text-xs" style={{ color: "var(--app-text-soft)" }}>
          {[notification.meta?.taskTitle, notification.meta?.projectName]
            .filter(Boolean)
            .join(" | ")}
        </p>
      ) : null}

      {isPendingInvitation ? (
        <div className="mt-3 flex gap-2">
          <button
            onClick={() =>
              onInvitationDecision(notification.meta.invitationId, "accept")
            }
            disabled={busyInvitationId === notification.meta.invitationId}
            className="rounded-xl px-3 py-2 text-xs font-semibold text-white"
            style={{ backgroundColor: "var(--app-success)" }}
          >
            {busyInvitationId === notification.meta.invitationId
              ? "Procesando..."
              : "Aceptar"}
          </button>
          <button
            onClick={() =>
              onInvitationDecision(notification.meta.invitationId, "reject")
            }
            disabled={busyInvitationId === notification.meta.invitationId}
            className="rounded-xl border px-3 py-2 text-xs font-semibold"
            style={{
              borderColor: "var(--app-danger)",
              color: "var(--app-danger)",
            }}
          >
            Rechazar
          </button>
        </div>
      ) : null}

      <p
        className="mt-2 text-[11px] uppercase tracking-[0.18em]"
        style={{ color: "var(--app-text-muted)" }}
      >
        {notification.type}
      </p>
      <p className="mt-1 text-xs" style={{ color: "var(--app-text-soft)" }}>
        {formatDate(notification.createdAt)}
      </p>
    </div>
  );
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [busyInvitationId, setBusyInvitationId] = useState(null);
  const {
    notifications,
    unreadCount,
    markOneAsRead,
    markEverythingAsRead,
    refreshNotifications,
  } = useNotifications();
  const { refreshProjects } = useProjects();

  const handleInvitationDecision = async (invitationId, decision) => {
    setBusyInvitationId(invitationId);

    try {
      if (decision === "accept") {
        await acceptProjectInvitation(invitationId);
      } else {
        await rejectProjectInvitation(invitationId);
      }

      await Promise.all([refreshNotifications(), refreshProjects()]);
      window.dispatchEvent(new CustomEvent("taskflow:projects-sync"));
    } finally {
      setBusyInvitationId(null);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative rounded-2xl border px-4 py-3 text-sm font-medium"
        style={{
          borderColor: "var(--app-border)",
          backgroundColor: "var(--app-surface)",
          color: "var(--app-text)",
        }}
      >
        Notificaciones
        {unreadCount ? (
          <span
            className="absolute -right-2 -top-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-[11px] font-semibold text-white"
            style={{ backgroundColor: "var(--app-danger)" }}
          >
            {unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className="absolute right-0 z-40 mt-3 w-[360px] rounded-[24px] border p-4 shadow-2xl"
          style={{
            borderColor: "var(--app-border)",
            backgroundColor: "var(--app-surface)",
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold" style={{ color: "var(--app-text)" }}>
              Notificaciones
            </p>
            <button
              onClick={() => markEverythingAsRead()}
              className="text-xs font-medium"
              style={{ color: "var(--app-primary)" }}
            >
              Marcar todas
            </button>
          </div>

          <div className="app-scrollbar mt-4 grid max-h-[420px] gap-3 overflow-y-auto">
            {notifications.length ? (
              notifications.map((notification) => (
                <NotificationCard
                  key={notification._id}
                  notification={notification}
                  onMarkAsRead={markOneAsRead}
                  onInvitationDecision={handleInvitationDecision}
                  busyInvitationId={busyInvitationId}
                />
              ))
            ) : (
              <div
                className="rounded-2xl border border-dashed px-4 py-8 text-center text-sm"
                style={{
                  borderColor: "var(--app-border)",
                  color: "var(--app-text-soft)",
                }}
              >
                Sin notificaciones por ahora.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
