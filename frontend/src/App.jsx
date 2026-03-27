import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import React from "react";
import { useState } from "react";
import Login from "./modules/auth/pages/Login";
import ProjectsPage from "./modules/projects/pages/ProjectsPage";
import { ProjectProvider } from "./modules/projects/context/ProjectContext";
import { NotificationProvider } from "./modules/notifications/context/NotificationContext";
import { ThemeProvider } from "./theme/ThemeContext";

function readStoredUser() {
  const storedUser = localStorage.getItem("user");

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch (error) {
    console.error("Invalid stored user session:", error);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    return null;
  }
}

function getStoredSession() {
  const token = localStorage.getItem("token");
  const user = readStoredUser();

  return {
    token: user ? token : null,
    user
  };
}

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || "La aplicacion encontro un error inesperado."
    };
  }

  componentDidCatch(error, info) {
    console.error("App render error:", error, info);
  }

  handleReset = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#090b12] px-6 text-white">
          <div className="w-full max-w-xl rounded-[28px] border border-rose-500/20 bg-rose-500/10 p-8">
            <p className="text-xs uppercase tracking-[0.3em] text-rose-200">Frontend Error</p>
            <h1 className="mt-3 text-2xl font-semibold">No pudimos renderizar la aplicacion</h1>
            <p className="mt-3 text-sm text-rose-100/90">{this.state.message}</p>
            <button
              onClick={this.handleReset}
              className="mt-6 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium text-white"
            >
              Reiniciar sesion
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function ProtectedApp({ user, onLogout, onUserUpdate }) {
  return (
    <NotificationProvider user={user}>
      <ProjectProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/projects" replace />} />
          <Route path="/projects" element={<ProjectsPage user={user} onLogout={onLogout} onUserUpdate={onUserUpdate} />} />
          <Route path="/projects/:projectId" element={<ProjectsPage user={user} onLogout={onLogout} onUserUpdate={onUserUpdate} />} />
          <Route path="*" element={<Navigate to="/projects" replace />} />
        </Routes>
      </ProjectProvider>
    </NotificationProvider>
  );
}

export default function App() {
  const [session, setSession] = useState(getStoredSession);

  const handleLoginSuccess = ({ token, user }) => {
    setSession({ token, user });
  };

  const handleUserUpdate = (user) => {
    localStorage.setItem("user", JSON.stringify(user));
    setSession((prev) => ({ ...prev, user }));
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setSession({ token: null, user: null });
  };

  return (
    <BrowserRouter>
      <AppErrorBoundary>
        <ThemeProvider>
          {session.token ? (
            <ProtectedApp user={session.user} onLogout={handleLogout} onUserUpdate={handleUserUpdate} />
          ) : (
            <Login onLoginSuccess={handleLoginSuccess} />
          )}
        </ThemeProvider>
      </AppErrorBoundary>
    </BrowserRouter>
  );
}
