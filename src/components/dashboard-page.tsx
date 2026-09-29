import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowUpRight,
  AlertTriangle,
  Activity,
  CircleDollarSign,
  Crosshair,
  Eye,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { num, type ApiHorizon } from "@/lib/api";
import {
  API_HORIZONS,
  NA,
  daysAgoIso,
  horizonLabel,
  isEntry,
  naira,
  pct,
  score100,
  signalFor,
  timeAgo,
  toSignal,
} from "@/lib/format";
import {
  useEvents,
  useOverview,
  usePortfolioSummary,
  usePositions,
  useSignalChanges,
  useStatus,
} from "@/lib/queries";
import { useWorkspace } from "@/lib/workspace-context";
import {
  EmptyState,
  ErrorState,
  EventCard,
  LoadingState,
  MetricCard,
  PriceChange,
  SectionHeading,
  SignalBadge,
  StockCard,
} from "./market-ui";

function greeting(): string {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

export function DashboardPage() {
  const { defaultHorizon } = useWorkspace();
  const [horizon, setHorizon] = useState<ApiHorizon>(defaultHorizon);
  useEffect(() => setHorizon(defaultHorizon), [defaultHorizon]);
  const status = useStatus();
  const overview = useOverview();
  const summary = usePortfolioSummary();
  const positions = usePositions();
  const events = useEvents({ limit: 3 });
  const [since] = useState(() => daysAgoIso(7));
  const changes = useSignalChanges({ since, limit: 50 });

  const items = overview.data?.items ?? [];
  const bySecurity = new Map(items.map((x) => [x.security.ticker, x]));
  const latest = items.flatMap((x) => x.signals);
  const buyCount = new Set(latest.filter((s) => isEntry(s.action)).map((s) => s.ticker)).size;
  const urgentCount = new Set(latest.filter((s) => s.action === "URGENT_RISK").map((s) => s.ticker))
    .size;
  const opportunities = items
    .filter((x) => isEntry(signalFor(x.signals, horizon)?.action))
    .sort(
      (a, b) =>
        (num(signalFor(b.signals, horizon)?.signed_score) ?? -2) -
        (num(signalFor(a.signals, horizon)?.signed_score) ?? -2),
    )
    .slice(0, 3);
  // Exits and risk first, then the most recent of the rest.
  const priority = { URGENT_RISK: 0, SELL: 1, BUY_MORE: 2, BUY: 3, HOLD: 4, WATCH: 5 };
  const attention = [...(changes.data?.items ?? [])]
    .sort((a, b) => priority[a.action] - priority[b.action])
    .slice(0, 4);
  const s = summary.data;
  const today = status.data?.market.today;

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            {today
              ? new Date(`${today}T12:00:00Z`)
                  .toLocaleDateString("en-GB", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                  .toUpperCase()
              : "TODAY"}{" "}
            <span className="eyebrow-divider">/</span> MARKET OVERVIEW
          </div>
          {/* The server and browser clocks can sit in different time zones. */}
          <h1 suppressHydrationWarning>
            {greeting()}
            <span className="heading-period">.</span>
          </h1>
          <p>Your Nigerian market, at a glance. Here's what needs your attention.</p>
        </div>
        <Button asChild variant="outline" className="heading-action">
          <Link to="/scanner">
            <Crosshair size={16} /> Open scanner <ArrowRight size={15} />
          </Link>
        </Button>
      </div>
      <div className="summary-grid">
        <MetricCard
          label="Portfolio value"
          value={s ? naira(s.market_value) : NA}
          change={s ? pct(s.unrealised_pnl_pct, 1, true) : undefined}
          detail={s && !s.is_complete ? "some positions unpriced" : "at latest prices"}
          icon={<Wallet size={17} />}
        />
        <MetricCard
          label="Realised P/L"
          value={s ? naira(s.realised_pnl) : NA}
          detail={s ? `${s.closed_positions} closed positions` : undefined}
          icon={<Activity size={17} />}
        />
        <MetricCard
          label="Total unrealised P/L"
          value={s ? naira(s.unrealised_pnl) : NA}
          change={s ? pct(s.unrealised_pnl_pct, 1, true) : undefined}
          detail="before exit fees"
          icon={<ArrowUpRight size={17} />}
        />
        <MetricCard
          label="Capital invested"
          value={s ? naira(s.cost_basis) : NA}
          detail={s ? `${s.open_positions} open positions` : undefined}
          icon={<CircleDollarSign size={17} />}
        />
      </div>
      <div className="compact-stats">
        <div>
          <span className="stat-icon neutral">
            <Eye size={17} />
          </span>
          <span>On watchlist</span>
          <strong>{overview.data ? items.filter((x) => x.is_watched).length : NA}</strong>
        </div>
        <div>
          <span className="stat-icon neutral">
            <Wallet size={17} />
          </span>
          <span>Open positions</span>
          <strong>{s ? s.open_positions : NA}</strong>
        </div>
        <div>
          <span className="stat-icon green">
            <ArrowUpRight size={17} />
          </span>
          <span>Securities with BUY signals</span>
          <strong>{overview.data ? buyCount : NA}</strong>
        </div>
        <div>
          <span className="stat-icon red">
            <AlertTriangle size={17} />
          </span>
          <span>Urgent risk alerts</span>
          <strong>{overview.data ? urgentCount : NA}</strong>
        </div>
      </div>
      <section className="section-block urgent-block">
        <SectionHeading
          eyebrow="PRIORITY MONITOR · LAST 7 DAYS"
          title="Needs your attention"
          action={
            <Link className="text-link" to="/signals">
              All signals <ArrowRight size={15} />
            </Link>
          }
        />
        <div className="alert-list">
          {changes.isLoading ? (
            <LoadingState />
          ) : changes.error ? (
            <ErrorState error={changes.error} />
          ) : attention.length === 0 ? (
            <EmptyState
              title="No signal changes"
              description="No assessment changed state in the past 7 days."
            />
          ) : (
            attention.map((c) => (
              <div className="alert-row" key={c.decision_id ?? c.signal_id}>
                <span
                  className={
                    "alert-indicator " +
                    (c.action === "URGENT_RISK" || c.action === "SELL" ? "danger" : "")
                  }
                />
                <div className="alert-main">
                  <div className="alert-head">
                    <strong>{c.ticker}</strong>
                    <span>{c.company_name}</span>
                    <SignalBadge signal={toSignal(c.action)} />
                  </div>
                  <p>
                    {c.previous_action ? toSignal(c.previous_action) : "NEW"} → {toSignal(c.action)}{" "}
                    <span className="dot-separator">·</span> {horizonLabel(c.horizon)}{" "}
                    <span className="dot-separator">·</span> {c.explanation}
                  </p>
                </div>
                <div className="alert-side">
                  <span>
                    {score100(c.confidence)}% confidence · {timeAgo(c.decided_at ?? c.generated_at)}
                  </span>
                  <Link
                    to="/stocks/$ticker"
                    params={{ ticker: c.ticker }}
                    search={{ focus: "signal" }}
                  >
                    Review <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
      <section className="section-block">
        <SectionHeading
          eyebrow="DISCOVER"
          title="Top opportunities"
          action={
            <div className="segmented">
              {API_HORIZONS.map((h) => (
                <Button
                  key={h}
                  variant="ghost"
                  className={horizon === h ? "chosen" : ""}
                  onClick={() => setHorizon(h)}
                >
                  {horizonLabel(h)}
                </Button>
              ))}
            </div>
          }
        />
        {overview.isLoading ? (
          <LoadingState />
        ) : overview.error ? (
          <ErrorState error={overview.error} />
        ) : opportunities.length === 0 ? (
          <EmptyState
            title="No BUY signals"
            description={`No security currently has a BUY assessment for ${horizonLabel(horizon)}.`}
          />
        ) : (
          <div className="stock-grid">
            {opportunities.map((item) => (
              <StockCard key={item.security.ticker} item={item} horizon={horizon} />
            ))}
          </div>
        )}
      </section>
      <div className="dashboard-bottom">
        <section className="section-block">
          <SectionHeading
            eyebrow="YOUR HOLDINGS"
            title="Current positions"
            action={
              <Link className="text-link" to="/portfolio">
                View portfolio <ArrowRight size={15} />
              </Link>
            }
          />
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>STOCK</th>
                  <th>ENTRY</th>
                  <th>CURRENT</th>
                  <th>VALUE</th>
                  <th>P/L</th>
                  <th>SIGNAL</th>
                  <th>THESIS</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(positions.data?.items ?? []).map((p) => {
                  const signal = signalFor(
                    bySecurity.get(p.ticker)?.signals ?? [],
                    p.target_horizon,
                  );
                  const ret = num(p.valuation?.unrealised_pnl_pct);
                  return (
                    <tr key={p.id}>
                      <td>
                        <Link
                          className="table-ticker"
                          to="/stocks/$ticker"
                          params={{ ticker: p.ticker }}
                          search={{}}
                        >
                          {p.ticker}
                          <span>{p.company_name}</span>
                        </Link>
                      </td>
                      <td>{naira(p.entry_price, 2)}</td>
                      <td>{naira(p.valuation?.price?.price, 2)}</td>
                      <td>{naira(p.valuation?.market_value)}</td>
                      <td>
                        <PriceChange value={ret === null ? null : ret * 100} />
                      </td>
                      <td>
                        <SignalBadge signal={signal && toSignal(signal.action)} />
                      </td>
                      <td>
                        {p.thesis_status ? (
                          <span className={"thesis " + p.thesis_status}>{p.thesis_status}</span>
                        ) : (
                          <span className="muted">Not reviewed</span>
                        )}
                      </td>
                      <td>
                        <Link
                          to="/stocks/$ticker"
                          params={{ ticker: p.ticker }}
                          search={{}}
                          aria-label={`View ${p.ticker}`}
                        >
                          <ArrowRight size={16} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {positions.isLoading && <LoadingState />}
            {positions.error && <ErrorState error={positions.error} />}
            {positions.data?.items.length === 0 && (
              <EmptyState
                title="No positions yet"
                description="Record a trade made externally on the Portfolio page."
              />
            )}
          </div>
        </section>
        <section className="section-block">
          <SectionHeading
            eyebrow="MARKET INTELLIGENCE"
            title="Recent developments"
            action={
              <Link className="text-link" to="/events">
                All events <ArrowRight size={15} />
              </Link>
            }
          />
          <div className="event-list">
            {events.isLoading && <LoadingState />}
            {events.error && <ErrorState error={events.error} />}
            {events.data?.items.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
            {events.data?.items.length === 0 && (
              <EmptyState title="No events" description="No events have been recorded yet." />
            )}
          </div>
        </section>
      </div>
    </>
  );
}
