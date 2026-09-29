import { Link, useNavigate } from "@tanstack/react-router";
import { Activity, ArrowRight } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { API_URL, ApiError, type ApiHorizon } from "@/lib/api";
import { API_HORIZONS, NA, horizonLabel, titleCase } from "@/lib/format";
import {
  useAuthCheck,
  useLogin,
  useNotificationPreferences,
  useScannerConfig,
  useStatus,
  useUpdateNotificationPreferences,
  useUpdatePreferences,
} from "@/lib/queries";
import { useWorkspace } from "@/lib/workspace-context";
import { PageHeader } from "./common";
import { MarketDataSettings } from "./market-data-settings";

export function SettingsPage() {
  const { theme, toggleTheme, defaultHorizon } = useWorkspace();
  const updatePrefs = useUpdatePreferences();
  const notifications = useNotificationPreferences();
  const updateNotifications = useUpdateNotificationPreferences();
  const scanner = useScannerConfig();
  const status = useStatus();
  const auth = useAuthCheck();
  const n = notifications.data;
  const email = !!n?.enabled && (n.mode === "email" || n.mode === "both");
  const push = !!n?.enabled && (n.mode === "push" || n.mode === "both");
  // Two toggles over one delivery mode; turning both off disables notifications.
  const setChannels = (nextEmail: boolean, nextPush: boolean) => {
    if (!nextEmail && !nextPush) return updateNotifications.mutate({ enabled: false });
    updateNotifications.mutate({
      enabled: true,
      mode: nextEmail && nextPush ? "both" : nextEmail ? "email" : "push",
    });
  };
  const interval = scanner.data?.interval_seconds;
  const eod = scanner.data?.["eod_cron"] as string | undefined;
  return (
    <>
      <PageHeader
        eyebrow="PERSONAL WORKSPACE / PREFERENCES"
        title="Settings"
        description="Tune how your market workspace presents assessments and alerts."
      />
      <div className="settings-layout">
        <section className="settings-panel">
          <div className="eyebrow">TRADING PREFERENCES</div>
          <h2>Analysis defaults</h2>
          <label className="field-label">
            Default horizon
            <select
              value={defaultHorizon}
              disabled={updatePrefs.isPending}
              onChange={(e) =>
                updatePrefs.mutate({ default_horizon: e.target.value as ApiHorizon })
              }
            >
              {API_HORIZONS.map((h) => (
                <option key={h} value={h}>
                  {horizonLabel(h)}
                </option>
              ))}
            </select>
          </label>
          {updatePrefs.error && <p className="negative small">{updatePrefs.error.message}</p>}
          <div className="source-data">
            <span>Strategy</span>
            <strong>{scanner.data?.strategy_version ?? NA}</strong>
          </div>
          <div className="source-data">
            <span>Market scan frequency</span>
            <strong>
              {interval ? `Every ${Math.round(interval / 60)} min in market hours` : NA}
            </strong>
          </div>
          <div className="source-data">
            <span>End-of-day scan</span>
            <strong>{eod ? `cron ${eod} (Lagos)` : NA}</strong>
          </div>
          <p className="section-footnote">
            Component weights, thresholds and scan intervals are server settings (SIGNALS_PARAMS,
            SCANNER_PARAMS, SCANNER_INTERVAL_SECONDS); changing them versions the strategy.
          </p>
        </section>
        <section className="settings-panel">
          <div className="eyebrow">INTERFACE & DELIVERY</div>
          <h2>Workspace</h2>
          <label className="toggle-row">
            <span>
              <strong>Dark appearance</strong>
              <small>Optimised for long market sessions</small>
            </span>
            <input type="checkbox" checked={theme === "dark"} onChange={toggleTheme} />
          </label>
          <label className="toggle-row">
            <span>
              <strong>Email alerts</strong>
              <small>Receive key signal changes by email</small>
            </span>
            <input
              type="checkbox"
              checked={email}
              disabled={!n || updateNotifications.isPending}
              onChange={(e) => setChannels(e.target.checked, push)}
            />
          </label>
          <label className="toggle-row">
            <span>
              <strong>Push alerts</strong>
              <small>Receive alerts on your phone</small>
            </span>
            <input
              type="checkbox"
              checked={push}
              disabled={!n || updateNotifications.isPending}
              onChange={(e) => setChannels(email, e.target.checked)}
            />
          </label>
          {updateNotifications.error && (
            <p className="negative small">{updateNotifications.error.message}</p>
          )}
          <Link className="text-link" to="/notifications">
            More alert settings <ArrowRight size={14} />
          </Link>
        </section>
        <MarketDataSettings />
        <section className="settings-panel">
          <div className="eyebrow">CONNECTION STATES</div>
          <h2>Integrations</h2>
          <div className="source-data">
            <span>Python API</span>
            <strong>
              {status.error
                ? "Unreachable"
                : status.data
                  ? `Connected · ${status.data.environment}`
                  : NA}
            </strong>
          </div>
          {Object.entries(status.data?.providers ?? {}).map(([name, provider]) => (
            <div className="source-data" key={name}>
              <span>{titleCase(name)}</span>
              <strong>{Array.isArray(provider) ? provider.join(", ") : provider}</strong>
            </div>
          ))}
          <div className="source-data">
            <span>Account</span>
            <strong>
              {auth.data?.email
                ? auth.data.email
                : auth.data?.method === "api_token"
                  ? "API token"
                  : auth.data?.method === "open"
                    ? "Sign-in not required (development, no account yet)"
                    : NA}
            </strong>
          </div>
          <p className="section-footnote">
            API at {API_URL}. Private credentials are never displayed in this interface.
          </p>
        </section>
      </div>
    </>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const login = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login.mutateAsync({ email: email.trim(), password });
      setPassword("");
      await navigate({ to: "/" });
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 422
          ? "Enter your e-mail and password."
          : err instanceof Error
            ? err.message
            : "Sign-in failed",
      );
    }
  };
  const busy = login.isPending;
  return (
    <div className="login-screen">
      <div className="login-brand">
        <span className="brand-emblem">
          <Activity size={24} />
        </span>
        <strong>Ẹ̀KỌ́</strong>
        <span>MARKET INTELLIGENCE</span>
      </div>
      <div className="login-main">
        <div className="eyebrow">PRIVATE WORKSPACE</div>
        <h1>
          Market clarity,
          <br />
          without the noise.
        </h1>
        <p>Your personal Nigerian equity intelligence workspace.</p>
        <form className="login-box" onSubmit={submit}>
          <h2>Sign in</h2>
          <p>Private access for one account.</p>
          <label>
            E-mail
            <input
              type="email"
              autoComplete="username"
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              required
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <Button type="submit" disabled={busy || !email.trim() || !password} className="w-full">
            {busy ? "Signing in…" : "Sign in"} <ArrowRight size={16} />
          </Button>
          {error && <small className="negative">{error}</small>}
          <small>
            You stay signed in on this browser until you sign out or the session expires.
          </small>
        </form>
      </div>
      <div className="login-foot">PRIVATE / PERSONAL USE ONLY</div>
    </div>
  );
}
