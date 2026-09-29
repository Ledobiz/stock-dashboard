import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  Bell,
  ChartNoAxesCombined,
  ChevronDown,
  CircleHelp,
  Database,
  FileChartColumn,
  Home,
  LayoutGrid,
  ListFilter,
  Menu,
  Moon,
  Newspaper,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  ShieldCheck,
  Sun,
  TrendingUp,
  Wallet,
  X,
  Eye,
  LogOut,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { timeAgo } from "@/lib/format";
import { useAuthCheck, useLogout, useOverview, useSources, useStatus } from "@/lib/queries";
import { useWorkspace } from "@/lib/workspace-context";
import { DemoNotice } from "./market-ui";
const items = [
  { label: "Dashboard", to: "/", icon: Home },
  { label: "Market Scanner", to: "/scanner", icon: ListFilter },
  { label: "Signals", to: "/signals", icon: Activity },
  { label: "Watchlist", to: "/watchlist", icon: Eye },
  { label: "Portfolio", to: "/portfolio", icon: Wallet },
  { label: "Companies", to: "/companies", icon: LayoutGrid },
  { label: "Events & News", to: "/events", icon: Newspaper },
  { label: "Macro", to: "/macro", icon: TrendingUp },
  { label: "Backtests", to: "/backtests", icon: FileChartColumn },
  { label: "Notifications", to: "/notifications", icon: Bell },
  { label: "Data Sources", to: "/sources", icon: Database },
  { label: "Settings", to: "/settings", icon: Settings },
] as const;
export function AppShell({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme, sidebarCollapsed, toggleSidebar, mobileMenu, setMobileMenu } =
    useWorkspace();
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const current =
    items.find((x) => x.to === pathname)?.label ||
    (pathname.startsWith("/stocks/")
      ? "Stock Analysis"
      : pathname.startsWith("/events/")
        ? "Event Intelligence"
        : "Workspace");
  const auth = useAuthCheck();
  const logout = useLogout();
  const status = useStatus();
  const sources = useSources();
  const overview = useOverview();
  useEffect(() => {
    const unauthorized = () => navigate({ to: "/login" });
    window.addEventListener("eko:unauthorized", unauthorized);
    return () => window.removeEventListener("eko:unauthorized", unauthorized);
  }, [navigate]);
  useEffect(() => {
    if (auth.data && auth.data.auth_required && !auth.data.authenticated)
      navigate({ to: "/login" });
  }, [auth.data, navigate]);
  const st = status.data;
  const counts: Record<string, number | undefined> = {
    Signals: st?.signal_changes_24h,
    Notifications: st?.notifications_sent_24h,
  };
  const enabledSources = (sources.data ?? []).filter((x) => x.enabled);
  const healthySources = enabledSources.filter((x) => x.health === "healthy").length;
  const matches = (overview.data?.items ?? [])
    .map((x) => x.security)
    .filter((s) => `${s.ticker} ${s.company_name}`.toLowerCase().includes(search.toLowerCase()));
  function signOut() {
    setProfileOpen(false);
    logout.mutate(undefined, { onSettled: () => void navigate({ to: "/login" }) });
  }
  function openStock(ticker: string) {
    setSearch("");
    setSearchOpen(false);
    navigate({ to: "/stocks/$ticker", params: { ticker }, search: {} });
  }
  return (
    <div className={"app " + theme + (sidebarCollapsed ? " sidebar-small" : "")}>
      <aside className={"sidebar " + (mobileMenu ? "sidebar-open" : "")}>
        <div className="brand">
          <div className="brand-emblem">
            <ChartNoAxesCombined size={21} />
          </div>
          {!sidebarCollapsed && (
            <div className="brand-text">
              <strong>Ẹ̀KỌ́</strong>
              <span>MARKET INTELLIGENCE</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="mobile-close"
            onClick={() => setMobileMenu(false)}
            aria-label="Close navigation"
          >
            <X />
          </Button>
        </div>
        <div className="sidebar-kicker">{!sidebarCollapsed ? "WORKSPACE" : "—"}</div>
        <nav className="side-nav">
          {items.slice(0, 6).map((item) => (
            <Link
              key={item.to}
              to={item.to}
              title={item.label}
              onClick={() => setMobileMenu(false)}
              className={"nav-item " + (pathname === item.to ? "active" : "")}
            >
              <item.icon size={18} />
              {!sidebarCollapsed && <span>{item.label}</span>}
              {!sidebarCollapsed && !!counts[item.label] && (
                <span className="nav-count" title="Last 24 hours">
                  {counts[item.label]}
                </span>
              )}
            </Link>
          ))}
          <div className="nav-divider" />
          <div className="sidebar-kicker">{!sidebarCollapsed ? "INTELLIGENCE" : "—"}</div>
          {items.slice(6).map((item) => (
            <Link
              key={item.to}
              to={item.to}
              title={item.label}
              onClick={() => setMobileMenu(false)}
              className={"nav-item " + (pathname === item.to ? "active" : "")}
            >
              <item.icon size={18} />
              {!sidebarCollapsed && <span>{item.label}</span>}
              {!sidebarCollapsed && !!counts[item.label] && (
                <span className="nav-count" title="Last 24 hours">
                  {counts[item.label]}
                </span>
              )}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="system-summary">
            <span
              className={
                "health-led " +
                (status.isError
                  ? "danger"
                  : healthySources < enabledSources.length
                    ? "warning"
                    : "")
              }
            />
            {!sidebarCollapsed && (
              <div>
                <strong>
                  {status.isError
                    ? "API unreachable"
                    : st?.uses_mock_data
                      ? "Mock data workspace"
                      : "Private workspace"}
                </strong>
                <span>
                  {sources.data
                    ? `${healthySources}/${enabledSources.length} sources healthy`
                    : "Checking sources…"}
                </span>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="collapse-button"
            onClick={toggleSidebar}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
          </Button>
        </div>
      </aside>
      {mobileMenu && <div className="sidebar-backdrop" onClick={() => setMobileMenu(false)} />}
      <div className="app-main">
        <header className="topbar">
          <div className="topbar-left">
            <Button
              variant="ghost"
              size="icon"
              className="mobile-menu"
              onClick={() => setMobileMenu(true)}
              aria-label="Open navigation"
            >
              <Menu />
            </Button>
            <span className="breadcrumb-root">Workspace</span>
            <span className="breadcrumb-slash">/</span>
            <span className="breadcrumb-current">{current}</span>
          </div>
          <div className="topbar-right">
            <div className="market-status">
              <span className="market-dot" />{" "}
              {st ? (st.market.is_open ? "NGX OPEN" : "NGX CLOSED") : "NGX —"}{" "}
              <span className="market-time">
                ·{" "}
                {st?.latest_quote_at
                  ? `Last price ${timeAgo(st.latest_quote_at)}`
                  : "No prices yet"}
              </span>
            </div>
            <div className="header-search">
              <Search size={16} />
              <input
                placeholder="Search ticker or company..."
                aria-label="Search ticker or company"
                value={search}
                onFocus={() => setSearchOpen(true)}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && matches[0]) openStock(matches[0].ticker);
                  if (e.key === "Escape") setSearchOpen(false);
                }}
              />
              {searchOpen && search && (
                <div className="search-results">
                  {matches.length ? (
                    matches.slice(0, 5).map((s) => (
                      <Button variant="ghost" key={s.ticker} onClick={() => openStock(s.ticker)}>
                        <strong>{s.ticker}</strong>
                        <span>{s.company_name}</span>
                      </Button>
                    ))
                  ) : (
                    <p>No matching companies</p>
                  )}
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle theme"
              title="Toggle theme"
              onClick={toggleTheme}
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </Button>
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="relative"
              aria-label="Notifications"
              title="Notifications"
            >
              <Link to="/notifications">
                <Bell size={18} />
                {!!st?.notifications_sent_24h && <span className="notification-dot" />}
              </Link>
            </Button>
            <div className="profile-wrap">
              <Button
                variant="ghost"
                className="profile-button"
                onClick={() => setProfileOpen((v) => !v)}
              >
                <span className="avatar">K</span>
                <span className="profile-name">Personal workspace</span>
                <ChevronDown size={14} />
              </Button>
              {profileOpen && (
                <div className="profile-menu">
                  <div>
                    {auth.data?.email
                      ? `Signed in as ${auth.data.email}`
                      : auth.data?.method === "api_token"
                        ? "Signed in with API token"
                        : "API open (no account yet)"}
                  </div>
                  <Button asChild variant="ghost" onClick={() => setProfileOpen(false)}>
                    <Link to="/settings">
                      <Settings size={15} /> Settings
                    </Link>
                  </Button>
                  <Button variant="ghost" onClick={signOut}>
                    <LogOut size={15} /> Sign out
                  </Button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="content">
          {st?.uses_mock_data && <DemoNotice />}
          {children}
        </main>
        <footer className="app-footer">
          <span>Ẹ̀KỌ́ / Nigerian market intelligence</span>
          <span>Signals are model assessments, not guarantees of future performance.</span>
          <span>{st ? `${st.environment} · ${st.market.timezone}` : "WAT"}</span>
        </footer>
      </div>
      <nav className="bottom-nav">
        {[
          { label: "Home", to: "/", icon: Home },
          { label: "Scanner", to: "/scanner", icon: ListFilter },
          { label: "Portfolio", to: "/portfolio", icon: Wallet },
          { label: "Signals", to: "/signals", icon: Activity },
          { label: "More", to: "/settings", icon: Menu },
        ].map((item) => (
          <Link key={item.to} to={item.to} className={pathname === item.to ? "selected" : ""}>
            <item.icon size={19} />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
