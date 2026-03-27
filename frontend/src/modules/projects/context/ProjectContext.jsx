import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getProjects } from "../../kanban/services/kanban.service";

const ProjectContext = createContext(null);

export function ProjectProvider({ children }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshProjects = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getProjects();
      setProjects(data);
      return data;
    } catch (err) {
      const nextError = err.response?.data?.error || "No se pudieron cargar los proyectos";
      setError(nextError);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshProjects().catch(() => {});
  }, []);

  const value = useMemo(() => ({
    projects,
    loading,
    error,
    setError,
    refreshProjects,
  }), [projects, loading, error]);

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProjects() {
  const context = useContext(ProjectContext);

  if (!context) {
    throw new Error("useProjects must be used inside ProjectProvider");
  }

  return context;
}
