import { Link, useNavigate } from "@tanstack/react-router";
import { Fragment, useEffect, useMemo, useState } from "react";
import { ArrowRight, ChevronDown, ChevronRight, Clock3, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { num, type ApiHorizon, type SecurityOverviewOut } from "@/lib/api";
import {
  NA,
  SIGNALS,
  componentScore,
  daysAgoIso,
  horizonLabel,
  liquidityLabel,
  naira,
  riskLabel,
  score100,
  signalFor,
  timeAgo,
  toAction,
  toSignal,
  type Signal,
} from "@/lib/format";
import {
  useLatestScan,
  useOverview,
  useSignalChanges,
  useStatus,
  useWatchMutations,
} from "@/lib/queries";
import { useWorkspace } from "@/lib/workspace-context";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  MetricCard,
  PriceChange,
  SignalBadge,
  StockCard,
} from "../market-ui";
import { FilterSelect, HorizonTabs, PageHeader } from "./common";

/** The page's horizon, starting from (and following) the saved default. */
export function useDefaultHorizon(): [ApiHorizon, (h: ApiHorizon) => void] {
  const { defaultHorizon } = useWorkspace();
  const [horizon, setHorizon] = useState<ApiHorizon>(defaultHorizon);
  useEffect(() => setHorizon(defaultHorizon), [defaultHorizon]);
  return [horizon, setHorizon];
}

type Sort = "score" | "price" | "confidence" | "change";

function sortValue(item: SecurityOverviewOut, horizon: ApiHorizon, sort: Sort): number {
  const signal = signalFor(item.signals, horizon);
  const value =
    sort === "price"
      ? num(item.price?.price)
      : sort === "change"
        ? num(item.price?.change_pct)
        : sort === "confidence"
          ? num(signal?.confidence)
          : num(signal?.overall_score);
  return value ?? Number.NEGATIVE_INFINITY;
}

export function ScannerPage() {
  const [horizon, setHorizon] = useDefaultHorizon();
  const [query, setQuery] = useState("");
  const [signal, setSignal] = useState("All signals");
  const [sector, setSector] = useState("All sectors");
  const [liquidity, setLiquidity] = useState("Any liquidity");
  const [risk, setRisk] = useState("Any risk");
  const [confidence, setConfidence] = useState("Any confidence");
  const [sort, setSort] = useState<Sort>("score");
  const [expanded, setExpanded] = useState<string | null>(null);
  const overview = useOverview();
  const scan = useLatestScan();
  const status = useStatus();
  const items = useMemo(() => overview.data?.items ?? [], [overview.data]);
  const filtered = useMemo(
    () =>
      items
        .filter((x) => {
          const s = signalFor(x.signals, horizon);
          const conf = score100(s?.confidence);
          return (
            (!query ||
              `${x.security.ticker} ${x.security.company_name}`
                .toLowerCase()
                .includes(query.toLowerCase())) &&
            (signal === "All signals" || (s && toSignal(s.action) === signal)) &&
            (sector === "All sectors" || x.security.sector === sector) &&
            (liquidity === "Any liquidity" || liquidityLabel(s) === liquidity) &&
            (risk === "Any risk" || riskLabel(s) === risk) &&
            (confidence === "Any confidence" ||
              (conf !== null && conf >= Number(confidence.slice(0, 2))))
          );
        })
        .sort((a, b) => sortValue(b, horizon, sort) - sortValue(a, horizon, sort)),
    [items, horizon, query, signal, sector, liquidity, risk, confidence, sort],
  );
  const current = items.map((x) => signalFor(x.signals, horizon));
  const countOf = (...actions: string[]) =>
    current.filter((s) => s && actions.includes(s.action)).length;
  const assessed = current.filter(Boolean).length;
  const lastRun = scan.data?.finished_at ?? status.data?.latest_signal_at;
  return (
    <>
      <PageHeader
        eyebrow="DISCOVERY / NGX UNIVERSE"
        title="Market scanner"
        description="Explore model assessments across Nigerian Exchange securities."
        action={
          <span className="updated-tag">
            <Clock3 size={15} />{" "}
            {lastRun
              ? `${scan.data ? "Last scan" : "Last assessment"} ${timeAgo(lastRun)}`
              : "No assessments yet"}
          </span>
        }
      />
      <div className="scan-summary">
        <MetricCard
          label="Stocks assessed"
          value={String(assessed)}
          detail={`of ${items.length} listed`}
        />
        <MetricCard
          label="BUY signals"
          value={String(countOf("BUY", "BUY_MORE"))}
          detail={horizonLabel(horizon)}
        />
        <MetricCard label="On watch" value={String(countOf("WATCH"))} detail="potential setups" />
        <MetricCard
          label="SELL / risk"
          value={String(countOf("SELL", "URGENT_RISK"))}
          detail="require review"
        />
        <MetricCard
          label="Not assessed"
          value={String(items.length - assessed)}
          detail="no stored signal for this horizon"
        />
      </div>
      <div className="toolbar-row">
        <HorizonTabs value={horizon} onChange={setHorizon} />
        <span className="muted small">{filtered.length} matching securities</span>
      </div>
      <div className="scanner-filters">
        <div className="filter-search">
          <Search size={17} />
          <input
            aria-label="Search scanner"
            placeholder="Search ticker or company"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <FilterSelect
          label="Signal"
          options={["All signals", ...SIGNALS]}
          value={signal}
          onChange={setSignal}
        />
        <FilterSelect
          label="Sector"
          options={[
            "All sectors",
            ...new Set(items.map((x) => x.security.sector).filter((x): x is string => !!x)),
          ]}
          value={sector}
          onChange={setSector}
        />
        <FilterSelect
          label="Liquidity"
          options={["Any liquidity", "High", "Medium", "Low", "Unavailable"]}
          value={liquidity}
          onChange={setLiquidity}
        />
        <FilterSelect
          label="Risk"
          options={["Any risk", "High", "Medium", "Low", "Unavailable"]}
          value={risk}
          onChange={setRisk}
        />
        <FilterSelect
          label="Confidence"
          options={["Any confidence", "50%+", "70%+", "80%+"]}
          value={confidence}
          onChange={setConfidence}
        />
      </div>
      <div className="table-wrap scanner-table">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>SECURITY</th>
              <th>SECTOR</th>
              <th>
                <Button variant="ghost" onClick={() => setSort("price")}>
                  PRICE
                </Button>
              </th>
              <th>
                <Button variant="ghost" onClick={() => setSort("change")}>
                  DAILY %
                </Button>
              </th>
              <th>SIGNAL</th>
              <th>
                <Button variant="ghost" onClick={() => setSort("score")}>
                  SCORE
                </Button>
              </th>
              <th>TECH</th>
              <th>FUND.</th>
              <th>LIQ.</th>
              <th>EVENTS</th>
              <th>MACRO</th>
              <th>RISK</th>
              <th>
                <Button variant="ghost" onClick={() => setSort("confidence")}>
                  CONF.
                </Button>
              </th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((x, i) => {
              const s = signalFor(x.signals, horizon);
              const t = x.security.ticker;
              const conf = score100(s?.confidence);
              return (
                <Fragment key={t}>
                  <tr
                    className="clickable-row"
                    onClick={() => setExpanded(expanded === t ? null : t)}
                  >
                    <td className="muted">{String(i + 1).padStart(2, "0")}</td>
                    <td>
                      <Link
                        className="table-ticker"
                        to="/stocks/$ticker"
                        params={{ ticker: t }}
                        search={{}}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {t}
                        <span>{x.security.company_name}</span>
                      </Link>
                    </td>
                    <td>{x.security.sector ?? NA}</td>
                    <td>{naira(x.price?.price, 2)}</td>
                    <td>
                      <PriceChange value={x.price?.change_pct} />
                    </td>
                    <td>
                      <SignalBadge signal={s && toSignal(s.action)} />
                    </td>
                    <td>
                      <strong className="score-number">{score100(s?.overall_score) ?? NA}</strong>
                    </td>
                    <td>{componentScore(s, "technical") ?? NA}</td>
                    <td>{componentScore(s, "fundamental") ?? NA}</td>
                    <td>{liquidityLabel(s)}</td>
                    <td>{componentScore(s, "event") ?? NA}</td>
                    <td>{componentScore(s, "macro") ?? NA}</td>
                    <td>{riskLabel(s)}</td>
                    <td>{conf === null ? NA : `${conf}%`}</td>
                    <td>
                      <ChevronDown size={15} />
                    </td>
                  </tr>
                  {expanded === t && (
                    <tr>
                      <td colSpan={15}>
                        <div className="expanded-row">
                          <div>
                            <span className="eyebrow">SUPPORTING FACTORS</span>
                            {s?.supporting_factors.length ? (
                              s.supporting_factors.map((f) => <p key={f}>+ {f}</p>)
                            ) : (
                              <p className="muted">None recorded</p>
                            )}
                          </div>
                          <div>
                            <span className="eyebrow">RISK FACTORS</span>
                            {s?.risk_factors.length ? (
                              s.risk_factors.map((r) => <p key={r}>− {r}</p>)
                            ) : (
                              <p className="muted">None recorded</p>
                            )}
                          </div>
                          <div>
                            <span className="eyebrow">DATA QUALITY</span>
                            {!s ? (
                              <p>No stored assessment for this horizon.</p>
                            ) : s.data_quality_warnings.length ? (
                              s.data_quality_warnings.map((w) => <p key={w}>{w}</p>)
                            ) : (
                              <p>Coverage {score100(s.coverage)}% · no data-quality warnings</p>
                            )}
                            <Button asChild variant="outline" size="sm">
                              <Link to="/stocks/$ticker" params={{ ticker: t }} search={{}}>
                                Full analysis <ArrowRight size={14} />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
        {overview.isLoading && <LoadingState />}
        {overview.error && <ErrorState error={overview.error} />}
        {overview.data && filtered.length === 0 && (
          <EmptyState
            title="No securities found"
            description="Try adjusting the filters or search term."
          />
        )}
      </div>
      <p className="section-footnote">
        Scores and signals are model assessments, not guarantees of future performance. Component
        columns are 0–100 (50 = neutral); “—” means the input was unavailable.
      </p>
    </>
  );
}

const PERIODS: Record<string, number> = { Today: 1, "7 Days": 7, "30 Days": 30, "90 Days": 90 };

export function SignalsPage() {
  const [filter, setFilter] = useState<"All signals" | Signal>("All signals");
  const [horizon, setHorizon] = useDefaultHorizon();
  const [period, setPeriod] = useState("7 Days");
  const since = useMemo(() => daysAgoIso(PERIODS[period] ?? 7), [period]);
  const changes = useSignalChanges({
    horizon,
    since,
    action: filter === "All signals" ? undefined : toAction(filter),
  });
  const displayed = changes.data?.items ?? [];
  return (
    <>
      <PageHeader
        eyebrow="SIGNAL MONITOR / STATE CHANGES"
        title="Signals"
        description="Every change in assessment, with the reasoning behind it."
      />
      <div className="toolbar-row wrap">
        <div className="segmented">
          {(["All signals", ...SIGNALS] as const).map((x) => (
            <Button
              key={x}
              variant="ghost"
              className={filter === x ? "chosen" : ""}
              onClick={() => setFilter(x)}
            >
              {x}
            </Button>
          ))}
        </div>
        <FilterSelect
          label="Period"
          options={Object.keys(PERIODS)}
          value={period}
          onChange={setPeriod}
        />
      </div>
      <div className="toolbar-row">
        <HorizonTabs value={horizon} onChange={setHorizon} />
        <span className="muted small">
          {changes.data ? `${changes.data.total} state changes` : "Loading…"}
        </span>
      </div>
      <div className="signal-list">
        {changes.isLoading && <LoadingState />}
        {changes.error && <ErrorState error={changes.error} />}
        {displayed.map((s) => (
          <Link
            key={s.decision_id ?? s.signal_id}
            to="/stocks/$ticker"
            params={{ ticker: s.ticker }}
            search={{ focus: "signal" }}
            className="signal-item"
          >
            <div className="signal-item-icon">{s.ticker.slice(0, 2)}</div>
            <div className="signal-item-main">
              <div className="signal-item-head">
                <strong>{s.ticker}</strong>
                <span>{s.company_name}</span>
                <SignalBadge signal={toSignal(s.action)} />
                {s.is_owned && <span className="muted small">HELD</span>}
              </div>
              <p>
                {s.previous_action ? toSignal(s.previous_action) : "First assessment"} →{" "}
                {toSignal(s.action)} <span className="dot-separator">·</span> {s.explanation}
              </p>
              <div className="signal-factors">
                {s.risk_factors.slice(0, 2).map((x) => (
                  <span key={x}>{x}</span>
                ))}
              </div>
            </div>
            <div className="signal-item-side">
              <strong>{score100(s.confidence)}%</strong>
              <span>Model confidence</span>
              <span>
                {score100(s.overall_score)}/100 score · {timeAgo(s.decided_at ?? s.generated_at)}
              </span>
              <span>
                {horizonLabel(s.horizon)} · {s.strategy_version}
              </span>
            </div>
            <ChevronRight size={17} />
          </Link>
        ))}
        {changes.data && !displayed.length && (
          <EmptyState
            title="No signal changes in this view"
            description="Try another signal type, horizon or a longer period."
          />
        )}
      </div>
    </>
  );
}

export function WatchlistPage() {
  const navigate = useNavigate();
  const { defaultHorizon } = useWorkspace();
  const [newTicker, setNewTicker] = useState("");
  const all = useOverview();
  const { add, remove } = useWatchMutations();
  const items = all.data?.items ?? [];
  const listed = items.filter((x) => x.is_watched);
  const error = add.error ?? remove.error;
  return (
    <>
      <PageHeader
        eyebrow="PERSONAL / TRACKED SECURITIES"
        title="Watchlist"
        description="Keep promising setups in view across all three horizons."
        action={
          <div className="inline-add">
            <select
              aria-label="Choose company to watch"
              value={newTicker}
              onChange={(e) => setNewTicker(e.target.value)}
            >
              <option value="">Choose ticker</option>
              {items
                .filter((x) => !x.is_watched)
                .map((x) => (
                  <option key={x.security.ticker}>{x.security.ticker}</option>
                ))}
            </select>
            <Button
              disabled={!newTicker || add.isPending}
              onClick={() => {
                if (newTicker) add.mutate(newTicker, { onSuccess: () => setNewTicker("") });
              }}
            >
              <Plus size={16} /> Add
            </Button>
          </div>
        }
      />
      {error && <ErrorState error={error} title="Watchlist update failed" />}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>SECURITY</th>
              <th>PRICE</th>
              <th>DAILY CHANGE</th>
              <th>1 WEEK</th>
              <th>1 MONTH</th>
              <th>3 MONTHS</th>
              <th>CONFIDENCE ({horizonLabel(defaultHorizon).toUpperCase()})</th>
              <th>LATEST MATERIAL EVENT</th>
              <th>LAST ASSESSED</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {listed.map((x) => {
              const t = x.security.ticker;
              const main = signalFor(x.signals, defaultHorizon);
              const conf = score100(main?.confidence);
              return (
                <tr key={t}>
                  <td>
                    <Link
                      className="table-ticker"
                      to="/stocks/$ticker"
                      params={{ ticker: t }}
                      search={{}}
                    >
                      {t}
                      <span>{x.security.company_name}</span>
                    </Link>
                  </td>
                  <td>{naira(x.price?.price, 2)}</td>
                  <td>
                    <PriceChange value={x.price?.change_pct} />
                  </td>
                  {(["1w", "1m", "3m"] as const).map((h) => {
                    const s = signalFor(x.signals, h);
                    return (
                      <td key={h}>
                        <SignalBadge signal={s && toSignal(s.action)} />
                      </td>
                    );
                  })}
                  <td>{conf === null ? NA : `${conf}%`}</td>
                  <td className="table-event">
                    {x.latest_event ? (
                      <Link to="/events/$id" params={{ id: x.latest_event.id }} search={{}}>
                        {x.latest_event.title}
                      </Link>
                    ) : (
                      "No recorded event"
                    )}
                  </td>
                  <td>{timeAgo(main?.generated_at)}</td>
                  <td>
                    <div className="row-actions">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Record a purchase"
                        aria-label={`Record a purchase of ${t}`}
                        onClick={() => navigate({ to: "/portfolio", search: { add: t } })}
                      >
                        <Plus size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Remove from watchlist"
                        aria-label={`Remove ${t}`}
                        disabled={remove.isPending}
                        onClick={() => remove.mutate(t)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {all.isLoading && <LoadingState />}
        {all.error && <ErrorState error={all.error} />}
        {all.data && listed.length === 0 && (
          <EmptyState
            title="Nothing on your watchlist"
            description="Choose a ticker above to start tracking it."
          />
        )}
      </div>
    </>
  );
}

export function CompaniesPage() {
  const [search, setSearch] = useState("");
  const [horizon, setHorizon] = useDefaultHorizon();
  const overview = useOverview();
  const items = (overview.data?.items ?? []).filter((x) =>
    `${x.security.ticker} ${x.security.company_name}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <>
      <PageHeader
        eyebrow="NGX / COMPANY DIRECTORY"
        title="Companies"
        description="Browse securities and open their latest assessments."
        action={<HorizonTabs value={horizon} onChange={setHorizon} />}
      />
      <div className="filter-search standalone-search">
        <Search size={17} />
        <input
          placeholder="Find a company or ticker"
          aria-label="Find a company"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {overview.isLoading && <LoadingState />}
      {overview.error && <ErrorState error={overview.error} />}
      <div className="stock-grid">
        {items.map((x) => (
          <StockCard key={x.security.ticker} item={x} horizon={horizon} />
        ))}
      </div>
      {overview.data && items.length === 0 && (
        <EmptyState title="No companies found" description="Try another name or ticker." />
      )}
    </>
  );
}
