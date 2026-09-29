import { Link } from "@tanstack/react-router";
import { Bell, ChevronRight, Send } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import type { ApiAction, ApiHorizon, NotificationOut, NotificationPreferencesOut } from "@/lib/api";
import {
  API_ACTIONS,
  API_HORIZONS,
  formatDateTime,
  horizonLabel,
  timeAgo,
  titleCase,
  toSignal,
} from "@/lib/format";
import {
  useNotificationConfig,
  useNotificationPreferences,
  useNotifications,
  useSendTestNotification,
  useUpdateNotificationPreferences,
} from "@/lib/queries";
import { EmptyState, ErrorState, LoadingState } from "../market-ui";
import { PageHeader } from "./common";

const FILTERS: [ApiAction | undefined, string][] = [
  [undefined, "All"],
  ["BUY", "BUY"],
  ["BUY_MORE", "BUY MORE"],
  ["SELL", "SELL"],
  ["URGENT_RISK", "URGENT RISK"],
];

function deliveryLine(n: NotificationOut): string {
  if (n.status === "suppressed") return `Not sent · ${titleCase(n.suppressed_reason)}`;
  const channels = n.deliveries.map((d) => `${titleCase(d.channel)} ${d.status}`).join(", ");
  return `${titleCase(n.status)}${channels ? ` · ${channels}` : ""}${n.sent_at ? ` · ${formatDateTime(n.sent_at)}` : ""}`;
}

function NotificationItem({ n }: { n: NotificationOut }) {
  const body = (
    <>
      <span className="notification-icon">
        <Bell size={17} />
      </span>
      <div>
        <div className="flex-between">
          <strong>
            {n.title}
            {n.priority === "high" ? " · HIGH PRIORITY" : ""}
          </strong>
          <span className="muted small">{timeAgo(n.created_at)}</span>
        </div>
        <p>{n.body.split("\n")[0]}</p>
        <span className="muted small">
          {deliveryLine(n)}
          {n.horizons.length ? ` · ${n.horizons.map(horizonLabel).join(", ")}` : ""}
        </span>
      </div>
      <ChevronRight size={16} />
    </>
  );
  return n.ticker ? (
    <Link
      className="notification-item"
      to="/stocks/$ticker"
      params={{ ticker: n.ticker }}
      search={{ focus: "signal" }}
    >
      {body}
    </Link>
  ) : (
    <div className="notification-item">{body}</div>
  );
}

function hhmm(value: string | null): string {
  return value ? value.slice(0, 5) : "";
}

function PreferencesForm({ prefs }: { prefs: NotificationPreferencesOut }) {
  const update = useUpdateNotificationPreferences();
  const config = useNotificationConfig();
  const test = useSendTestNotification();
  const [form, setForm] = useState(prefs);
  const [quiet, setQuiet] = useState(!!prefs.quiet_hours_start);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    setForm(prefs);
    setQuiet(!!prefs.quiet_hours_start);
  }, [prefs]);
  const set = <K extends keyof NotificationPreferencesOut>(
    key: K,
    value: NotificationPreferencesOut[K],
  ) => {
    setSaved(false);
    setForm((f) => ({ ...f, [key]: value }));
  };
  const toggle = <T,>(list: T[], item: T) =>
    list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
  const submit = (e: FormEvent) => {
    e.preventDefault();
    update.mutate(
      {
        enabled: form.enabled,
        mode: form.mode,
        email_address: form.email_address?.trim() || null,
        actions: form.actions,
        horizons: form.horizons,
        quiet_hours_start: quiet ? hhmm(form.quiet_hours_start) || "22:00" : null,
        quiet_hours_end: quiet ? hhmm(form.quiet_hours_end) || "07:00" : null,
        urgent_bypass_quiet_hours: form.urgent_bypass_quiet_hours,
      },
      { onSuccess: () => setSaved(true) },
    );
  };
  return (
    <form className="settings-panel" onSubmit={submit}>
      <div className="eyebrow">DELIVERY PREFERENCES</div>
      <h2>Alert settings</h2>
      <label className="toggle-row">
        <span>
          <strong>Notifications enabled</strong>
          <small>Alert me when an assessment changes state</small>
        </span>
        <input
          type="checkbox"
          checked={form.enabled}
          onChange={(e) => set("enabled", e.target.checked)}
        />
      </label>
      <label className="field-label">
        Preferred channel
        <select
          value={form.mode}
          onChange={(e) => set("mode", e.target.value as NotificationPreferencesOut["mode"])}
        >
          <option value="push">Push</option>
          <option value="email">Email</option>
          <option value="both">Both</option>
        </select>
      </label>
      <label className="field-label">
        Email address
        <input
          type="email"
          value={form.email_address ?? ""}
          placeholder="Uses the server default when blank"
          onChange={(e) => set("email_address", e.target.value)}
        />
      </label>
      <div className="field-label">
        Actions (URGENT RISK is always sent)
        <div className="overlay-options">
          {API_ACTIONS.map((a) => (
            <label key={a}>
              <input
                type="checkbox"
                checked={form.actions.includes(a)}
                onChange={() => set("actions", toggle(form.actions, a))}
              />
              {toSignal(a)}
            </label>
          ))}
        </div>
      </div>
      <div className="field-label">
        Horizons
        <div className="overlay-options">
          {API_HORIZONS.map((h) => (
            <label key={h}>
              <input
                type="checkbox"
                checked={form.horizons.includes(h)}
                onChange={() => set("horizons", toggle<ApiHorizon>(form.horizons, h))}
              />
              {horizonLabel(h)}
            </label>
          ))}
        </div>
      </div>
      <label className="toggle-row">
        <span>
          <strong>Quiet hours</strong>
          <small>Pause non-urgent alerts (Lagos time)</small>
        </span>
        <input
          type="checkbox"
          checked={quiet}
          onChange={(e) => {
            setSaved(false);
            setQuiet(e.target.checked);
          }}
        />
      </label>
      {quiet && (
        <div className="overlay-options">
          <label>
            From
            <input
              type="time"
              value={hhmm(form.quiet_hours_start) || "22:00"}
              onChange={(e) => set("quiet_hours_start", e.target.value)}
            />
          </label>
          <label>
            To
            <input
              type="time"
              value={hhmm(form.quiet_hours_end) || "07:00"}
              onChange={(e) => set("quiet_hours_end", e.target.value)}
            />
          </label>
        </div>
      )}
      <label className="toggle-row">
        <span>
          <strong>Urgent bypass</strong>
          <small>Deliver urgent risk alerts during quiet hours</small>
        </span>
        <input
          type="checkbox"
          checked={form.urgent_bypass_quiet_hours}
          onChange={(e) => set("urgent_bypass_quiet_hours", e.target.checked)}
        />
      </label>
      <Button type="submit" disabled={update.isPending || form.horizons.length === 0}>
        {update.isPending ? "Saving…" : "Save preferences"}
      </Button>
      {saved && <p className="positive small">Saved.</p>}
      {update.error && <p className="negative small">{update.error.message}</p>}
      <Button
        type="button"
        variant="outline"
        disabled={test.isPending}
        onClick={() => test.mutate()}
      >
        <Send size={15} /> {test.isPending ? "Sending…" : "Send a test notification"}
      </Button>
      {test.data && <p className="muted small">Test notification: {deliveryLine(test.data)}</p>}
      {test.error && <p className="negative small">{test.error.message}</p>}
      <div className="eyebrow">CHANNELS</div>
      {(config.data?.channels ?? []).map((c) => (
        <div className="source-data" key={c.channel}>
          <span>{titleCase(c.channel)}</span>
          <strong>
            {c.enabled ? titleCase(c.provider) : "Not configured"}
            {c.is_mock ? " (mock)" : ""}
          </strong>
        </div>
      ))}
      {config.data && (
        <p className="section-footnote">
          Cooldown {config.data.cooldown_minutes} min per security, horizon and action (urgent{" "}
          {config.data.urgent_cooldown_minutes} min). Delivery runs every{" "}
          {config.data.dispatch_seconds}s.
        </p>
      )}
    </form>
  );
}

export function NotificationsPage() {
  const [filter, setFilter] = useState<ApiAction | undefined>(undefined);
  const notifications = useNotifications(filter);
  const prefs = useNotificationPreferences();
  const items = notifications.data?.items ?? [];
  return (
    <>
      <PageHeader
        eyebrow="ALERT CENTER / DELIVERY"
        title="Notifications"
        description="A record of signal alerts and your delivery preferences."
      />
      <div className="notification-layout">
        <section>
          <div className="toolbar-row">
            <div className="segmented">
              {FILTERS.map(([value, label]) => (
                <Button
                  key={label}
                  variant="ghost"
                  className={filter === value ? "chosen" : ""}
                  onClick={() => setFilter(value)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
          <div className="signal-list">
            {notifications.isLoading && <LoadingState />}
            {notifications.error && <ErrorState error={notifications.error} />}
            {items.map((n) => (
              <NotificationItem key={n.id} n={n} />
            ))}
            {notifications.data && !items.length && (
              <EmptyState
                title="No matching alerts"
                description="Alerts appear here when an assessment changes state."
              />
            )}
          </div>
        </section>
        {prefs.data ? (
          <PreferencesForm prefs={prefs.data} />
        ) : prefs.error ? (
          <ErrorState error={prefs.error} />
        ) : (
          <LoadingState />
        )}
      </div>
    </>
  );
}
