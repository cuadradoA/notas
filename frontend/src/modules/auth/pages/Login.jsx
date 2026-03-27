import { useState } from "react";
import { api } from "../../../core/api/axios";
import { useTheme } from "../../../theme/ThemeContext";

export default function Login({ onLoginSuccess }) {
  const { theme, toggleTheme } = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const resetForm = () => {
    setUsername("");
    setEmail("");
    setPassword("");
  };

  const handleModeChange = (nextMode) => {
    setIsLogin(nextMode);
    setError("");
    setSuccess("");
    resetForm();
  };

  const handleSubmit = async () => {
    if (!email || !password || (!isLogin && !username)) {
      setError("Completa los campos requeridos");
      setSuccess("");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register";
      const payload = isLogin ? { email, password } : { username, email, password };
      const res = await api.post(endpoint, payload);

      if (isLogin) {
        localStorage.setItem("token", res.data.token);
        const user = res.data.user || { email };
        localStorage.setItem("user", JSON.stringify(user));
        onLoginSuccess?.({ token: res.data.token, user });
      } else {
        setSuccess("Usuario creado correctamente. Ahora puedes iniciar sesion.");
        setIsLogin(true);
      }

      resetForm();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Error al procesar la solicitud");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-8"
      style={{
        background:
          "radial-gradient(circle at top left, var(--app-primary-soft), transparent 28%), radial-gradient(circle at bottom right, rgba(255, 199, 87, 0.16), transparent 24%), linear-gradient(180deg, var(--app-bg) 0%, color-mix(in srgb, var(--app-bg) 88%, white 12%) 100%)",
      }}
    >
      <div className="app-panel w-full max-w-[1080px] overflow-hidden rounded-[36px]">
        <div className="grid min-h-[680px] lg:grid-cols-[1.1fr_0.9fr]">
          <section
            className="hidden p-10 lg:flex lg:items-center lg:justify-center"
            style={{ background: "linear-gradient(180deg, var(--app-shell-strong), var(--app-shell))" }}
          >
            <div>
              <div className="inline-flex items-center gap-3 rounded-full px-4 py-2" style={{ backgroundColor: "var(--app-primary-soft)", color: "var(--app-primary)" }}>
                <span className="inline-flex h-3 w-3 rounded-full" style={{ backgroundColor: "var(--app-primary)" }} />
                <span className="text-xs font-semibold uppercase tracking-[0.35em]">TaskFlow</span>
              </div>
              <h1 className="mt-8 max-w-md text-5xl font-semibold leading-tight" style={{ color: "var(--app-text)" }}>
                Organiza proyectos con una interfaz mas limpia y enfocada.
              </h1>
              <p className="mt-5 max-w-lg text-base leading-7" style={{ color: "var(--app-text-soft)" }}>
                Accede a tus tableros, administra miembros y mueve tareas desde un solo espacio de trabajo inspirado en un escritorio moderno de notas.
              </p>
            </div>
          </section>

          <section className="p-6 sm:p-10" style={{ backgroundColor: "var(--app-surface)" }}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em]" style={{ color: "var(--app-text-muted)" }}>Bienvenido</p>
                <h2 className="mt-2 text-3xl font-semibold" style={{ color: "var(--app-text)" }}>Tu espacio de trabajo</h2>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className="rounded-full border px-4 py-2 text-sm font-medium transition"
                style={{ borderColor: "var(--app-border)", color: "var(--app-text)" }}
              >
                {theme.label}
              </button>
            </div>

            <div className="mt-10 max-w-[420px]">
              <div className="mb-6">
                <h3 className="text-2xl font-semibold" style={{ color: "var(--app-text)" }}>TaskFlow</h3>
                <p className="mt-2 text-sm" style={{ color: "var(--app-text-soft)" }}>Gestion de proyectos agil y eficiente</p>
              </div>

              <div className="mb-6 flex rounded-[20px] p-1" style={{ backgroundColor: "var(--app-shell)" }}>
                <button
                  onClick={() => handleModeChange(true)}
                  className="flex-1 rounded-2xl py-3 text-sm font-medium transition"
                  style={isLogin ? { backgroundColor: "var(--app-surface)", color: "var(--app-text)" } : { color: "var(--app-text-soft)" }}
                >
                  Iniciar sesion
                </button>
                <button
                  onClick={() => handleModeChange(false)}
                  className="flex-1 rounded-2xl py-3 text-sm font-medium transition"
                  style={!isLogin ? { backgroundColor: "var(--app-surface)", color: "var(--app-text)" } : { color: "var(--app-text-soft)" }}
                >
                  Registrarse
                </button>
              </div>

              {error && <div className="mb-4 rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: "color-mix(in srgb, var(--app-danger) 35%, transparent)", backgroundColor: "color-mix(in srgb, var(--app-danger) 16%, transparent)", color: "var(--app-danger)" }}>{error}</div>}
              {success && <div className="mb-4 rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: "color-mix(in srgb, var(--app-success) 35%, transparent)", backgroundColor: "color-mix(in srgb, var(--app-success) 16%, transparent)", color: "var(--app-success)" }}>{success}</div>}

              {!isLogin && (
                <label className="mb-4 block text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--app-text-muted)" }}>
                  Nombre de usuario
                  <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="usuario123" className="app-input mt-3 w-full rounded-2xl px-4 py-3" />
                </label>
              )}

              <label className="mb-4 block text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--app-text-muted)" }}>
                Correo electronico
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo@empresa.com" className="app-input mt-3 w-full rounded-2xl px-4 py-3" />
              </label>

              <label className="mb-4 block text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--app-text-muted)" }}>
                Contrasena
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="********" className="app-input mt-3 w-full rounded-2xl px-4 py-3" />
              </label>

              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="mt-4 w-full rounded-2xl py-3 text-sm font-semibold text-white transition disabled:opacity-70"
                style={{ background: "linear-gradient(135deg, var(--app-primary), color-mix(in srgb, var(--app-primary) 70%, var(--app-accent) 30%))" }}
              >
                {isSubmitting ? "Procesando..." : isLogin ? "Entrar" : "Crear cuenta"}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
