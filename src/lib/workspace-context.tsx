// Workspace UI state. The theme and default horizon live on the backend (/preferences); the
// sidebar and mobile menu are local layout state.
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { ApiHorizon } from "./api";
import { usePreferences, useUpdatePreferences } from "./queries";

type WorkspaceState = {
  theme: "dark" | "light";
  toggleTheme: () => void;
  defaultHorizon: ApiHorizon;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  mobileMenu: boolean;
  setMobileMenu: (v: boolean) => void;
};

const Context = createContext<WorkspaceState | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const preferences = usePreferences();
  const update = useUpdatePreferences();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const stored = preferences.data?.theme;
  useEffect(() => {
    if (stored) setTheme(stored);
  }, [stored]);
  return (
    <Context.Provider
      value={{
        theme,
        toggleTheme: () => {
          const next = theme === "dark" ? "light" : "dark";
          setTheme(next);
          update.mutate({ theme: next });
        },
        defaultHorizon: preferences.data?.default_horizon ?? "1m",
        sidebarCollapsed,
        toggleSidebar: () => setSidebarCollapsed((v) => !v),
        mobileMenu,
        setMobileMenu,
      }}
    >
      {children}
    </Context.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("Missing workspace provider");
  return ctx;
}
