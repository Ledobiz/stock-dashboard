import { Link } from "@tanstack/react-router";
import {
  ArrowDownRight,
  ArrowUpRight,
  ArrowRight,
  AlertTriangle,
  Database,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ApiError,
  num,
  type ApiHorizon,
  type Dec,
  type EventOut,
  type SecurityOverviewOut,
} from "@/lib/api";
import {
  NA,
  formatDate,
  liquidityLabel,
  naira,
  riskLabel,
  score100,
  signalFor,
  titleCase,
  toSignal,
  type Signal,
} from "@/lib/format";

export function SignalBadge({ signal }: { signal: Signal | null | undefined }) {
  if (!signal)
    return (
      <span className="signal">
        <span>NOT ASSESSED</span>
      </span>
    );
  return (
    <span className={"signal signal-" + signal.toLowerCase().replaceAll(" ", "-")}>
      {signal === "URGENT RISK" && <AlertTriangle size={12} />}
      <span>{signal}</span>
    </span>
  );
}
/** A percentage change (already in percent, e.g. 1.83 for +1.83%). */
export function PriceChange({ value }: { value: Dec }) {
  const n = num(value);
  if (n === null) return <span className="price-change muted">{NA}</span>;
  return (
    <span className={"price-change " + (n >= 0 ? "positive" : "negative")}>
      {n >= 0 ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />} {Math.abs(n).toFixed(2)}%
    </span>
  );
}
export function QualityBadge({ quality = "Complete" }: { quality?: string }) {
  return (
    <span className={"quality " + (quality === "Complete" ? "quality-good" : "quality-warn")}>
      <span className="quality-dot" />
      {quality}
    </span>
  );
}
export function MetricCard({
  label,
  value,
  change,
  detail,
  icon,
}: {
  label: string;
  value: string;
  change?: string | undefined;
  detail?: string | undefined;
  icon?: React.ReactNode;
}) {
  return (
    <div className="metric-card">
      <div className="metric-top">
        <span>{label}</span>
        {icon}
      </div>
      <strong>{value}</strong>
      <div className="metric-foot">
        {change && change !== NA && (
          <span className={change.startsWith("-") ? "negative" : "positive"}>{change}</span>
        )}
        {detail && <span>{detail}</span>}
      </div>
    </div>
  );
}
export function ScoreBar({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="score-row">
      <span>{label}</span>
      <div className="score-track">
        <div className="score-fill" style={{ width: `${value ?? 0}%` }} />
      </div>
      <strong title={value === null ? "Data unavailable" : undefined}>{value ?? "n/a"}</strong>
    </div>
  );
}
export function SectionHeading({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h2>{title}</h2>
      </div>
      {action}
    </div>
  );
}
export function StockCard({ item, horizon }: { item: SecurityOverviewOut; horizon: ApiHorizon }) {
  const { security, price } = item;
  const signal = signalFor(item.signals, horizon);
  const score = score100(signal?.overall_score);
  const confidence = score100(signal?.confidence);
  return (
    <article className="stock-card">
      <div className="stock-card-top">
        <div className="ticker-mark">{security.ticker.slice(0, 2)}</div>
        <SignalBadge signal={signal && toSignal(signal.action)} />
      </div>
      <h3>{security.ticker}</h3>
      <p className="muted small truncate">{security.company_name}</p>
      <div className="card-price">
        <strong>{price ? naira(price.price, 2) : "No price"}</strong>
        <PriceChange value={price?.change_pct} />
      </div>
      <div className="card-divider" />
      <div className="card-score">
        <span>Overall score</span>
        <strong>
          {score ?? NA}
          <small>/100</small>
        </strong>
      </div>
      <div className="card-score">
        <span>Model confidence</span>
        <strong>{confidence === null ? NA : `${confidence}%`}</strong>
      </div>
      <div className="card-score">
        <span>Liquidity / Risk</span>
        <span className="text-foreground">
          {liquidityLabel(signal)} / {riskLabel(signal)}
        </span>
      </div>
      <p className="card-summary">
        {signal?.explanation || "No stored assessment for this horizon."}
      </p>
      <Button asChild variant="outline" className="w-full justify-between">
        <Link to="/stocks/$ticker" params={{ ticker: security.ticker }} search={{}}>
          View full analysis <ArrowRight size={15} />
        </Link>
      </Button>
    </article>
  );
}
export function EventCard({ event }: { event: EventOut }) {
  const high = event.severity === "high" || event.severity === "critical";
  const tickers = event.affected_companies.flatMap((c) => c.tickers);
  return (
    <Link className="event-card" to="/events/$id" params={{ id: event.id }} search={{}}>
      <div className={"event-icon " + (high ? "event-high" : "")}>
        <Database size={17} />
      </div>
      <div className="event-content">
        <div className="event-meta">
          <span className="eyebrow">
            {titleCase(event.category)} · {event.severity.toUpperCase()} IMPACT
          </span>
          <span>{formatDate(event.known_at)}</span>
        </div>
        <h3>{event.title}</h3>
        {event.summary && <p>{event.summary}</p>}
        <div className="event-tags">
          <span>{titleCase(event.verification_status)}</span>
          <span>{event.source_name || event.source_code || "Unknown source"}</span>
          <span>{titleCase(event.impact_direction)}</span>
          {tickers.length > 0 && <span>{tickers.join(" · ")}</span>}
          {event.is_mock && <span>MOCK</span>}
        </div>
      </div>
      <ChevronRight className="event-arrow" size={18} />
    </Link>
  );
}
export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="empty-state">
      <Database size={25} />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
export function LoadingState({ label = "Loading…" }: { label?: string | undefined }) {
  return (
    <div className="empty-state">
      <Loader2 size={25} className="animate-spin" />
      <p>{label}</p>
    </div>
  );
}
export function ErrorState({
  error,
  title = "Couldn't load data",
}: {
  error: unknown;
  title?: string;
}) {
  const message = error instanceof Error ? error.message : String(error);
  const status = error instanceof ApiError ? error.status : null;
  return (
    <div className="empty-state">
      <AlertTriangle size={25} />
      <h3>{status === 404 ? "Not found" : title}</h3>
      <p>{message}</p>
    </div>
  );
}
/** Renders loading / error states for a query and the children once data is there. */
export function QueryBoundary<T>({
  query,
  children,
  loading,
}: {
  query: { data: T | undefined; error: unknown; isLoading: boolean };
  children: (data: T) => React.ReactNode;
  loading?: string;
}) {
  if (query.isLoading) return <LoadingState label={loading} />;
  if (query.error || query.data === undefined) return <ErrorState error={query.error} />;
  return <>{children(query.data)}</>;
}
export function DemoNotice() {
  return (
    <div className="demo-notice">
      <span className="demo-pulse" /> MOCK DATA <span className="demo-notice-separator">/</span>{" "}
      Some figures come from fictional fixture providers (is_mock), not live market information.
    </div>
  );
}
