// Display helpers. The API sends scores as fractions and decimals as strings; the UI shows
// scores on 0-100. Anything missing renders as an explicit "unavailable" marker, never a guess.
import { num, type ApiAction, type ApiHorizon, type Dec, type SignalOut } from "./api";

export type Signal = "BUY" | "BUY MORE" | "HOLD" | "WATCH" | "SELL" | "URGENT RISK";
export type Horizon = "1 Week" | "1 Month" | "3 Months";

export const NA = "—";
export const API_HORIZONS: ApiHorizon[] = ["1w", "1m", "3m"];
export const API_ACTIONS: ApiAction[] = ["BUY", "BUY_MORE", "HOLD", "WATCH", "SELL", "URGENT_RISK"];
export const SIGNALS: Signal[] = ["BUY", "BUY MORE", "HOLD", "WATCH", "SELL", "URGENT RISK"];

const HORIZON_LABELS: Record<ApiHorizon, Horizon> = {
  "1w": "1 Week",
  "1m": "1 Month",
  "3m": "3 Months",
};

export function horizonLabel(h: ApiHorizon): Horizon {
  return HORIZON_LABELS[h];
}

export function toSignal(action: ApiAction): Signal {
  return action.replace("_", " ") as Signal;
}

export function toAction(signal: Signal): ApiAction {
  return signal.replace(" ", "_") as ApiAction;
}

/** A fraction in [0, 1] as a whole number on 0-100, or null. */
export function score100(value: Dec): number | null {
  const n = num(value);
  return n === null ? null : Math.round(n * 100);
}

export function naira(value: Dec, digits = 0): string {
  const n = num(value);
  if (n === null) return NA;
  const text = Math.abs(n).toLocaleString("en-NG", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  return (n < 0 ? "-₦" : "₦") + text;
}

/** Large naira amounts as ₦1.42tn / ₦426bn / ₦684m. */
export function nairaCompact(value: Dec): string {
  const n = num(value);
  if (n === null) return NA;
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1e12) return `${sign}₦${(abs / 1e12).toFixed(2)}tn`;
  if (abs >= 1e9) return `${sign}₦${(abs / 1e9).toFixed(1)}bn`;
  if (abs >= 1e6) return `${sign}₦${(abs / 1e6).toFixed(1)}m`;
  return naira(n, 2);
}

export function compact(value: Dec): string {
  const n = num(value);
  if (n === null) return NA;
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${(n / 1e9).toFixed(2)}bn`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(1)}m`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(1)}k`;
  return n.toLocaleString("en-NG", { maximumFractionDigits: 2 });
}

/** A fraction as a percentage ("0.052" -> "5.2%"). */
export function pct(value: Dec, digits = 1, signed = false): string {
  const n = num(value);
  if (n === null) return NA;
  const text = `${(n * 100).toFixed(digits)}%`;
  return signed && n > 0 ? `+${text}` : text;
}

export function fixed(value: Dec, digits = 2, suffix = ""): string {
  const n = num(value);
  return n === null ? NA : `${n.toFixed(digits)}${suffix}`;
}

export function titleCase(value: string | null | undefined): string {
  if (!value) return NA;
  return value
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return NA;
  const d = new Date(value.length === 10 ? `${value}T12:00:00Z` : value);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return NA;
  return new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
  });
}

export function timeAgo(value: string | null | undefined, now = Date.now()): string {
  if (!value) return NA;
  const seconds = Math.max(0, Math.round((now - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} h ago`;
  return `${Math.round(hours / 24)} days ago`;
}

export function todayIso(): string {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 86400000).toISOString();
}

// --- signal-derived labels -------------------------------------------------------------------

export function component(signal: SignalOut | undefined, name: string) {
  return signal?.components.find((c) => c.component === name && c.is_available);
}

export function componentScore(signal: SignalOut | undefined, name: string): number | null {
  return score100(component(signal, name)?.score);
}

/** The liquidity component's signed score as High / Medium / Low. */
export function liquidityLabel(signal: SignalOut | undefined): string {
  const s = num(component(signal, "liquidity")?.signed_score);
  if (s === null) return "Unavailable";
  return s >= 0.33 ? "High" : s >= -0.33 ? "Medium" : "Low";
}

/** The risk component is +1 for low risk, -1 for high risk. */
export function riskLabel(signal: SignalOut | undefined): string {
  const s = num(component(signal, "risk")?.signed_score);
  if (s === null) return "Unavailable";
  return s >= 0.33 ? "Low" : s >= -0.33 ? "Medium" : "High";
}

export const COMPONENT_LABELS: Record<string, string> = {
  technical: "Technical",
  fundamental: "Fundamentals",
  liquidity: "Liquidity",
  event: "News / Events",
  macro: "Macro",
  risk: "Risk",
};

export function signalFor(signals: SignalOut[], horizon: ApiHorizon): SignalOut | undefined {
  return signals.find((s) => s.horizon === horizon);
}

export function isEntry(action: ApiAction | undefined): boolean {
  return action === "BUY" || action === "BUY_MORE";
}
