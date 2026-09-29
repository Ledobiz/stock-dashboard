import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowLeft, ArrowRight, CircleAlert, Eye, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  num,
  type AnalysisHorizonOut,
  type AnalysisParam,
  type ApiHorizon,
  type Dec,
  type FundamentalsOut,
  type MetricValueOut,
  type SignalOut,
} from "@/lib/api";
import {
  API_HORIZONS,
  COMPONENT_LABELS,
  NA,
  compact,
  fixed,
  formatDate,
  formatDateTime,
  horizonLabel,
  liquidityLabel,
  naira,
  nairaCompact,
  pct,
  riskLabel,
  score100,
  signalFor,
  timeAgo,
  titleCase,
  toSignal,
} from "@/lib/format";
import {
  useAnalysis,
  useEvents,
  useExplanation,
  useFundamentals,
  useOverview,
  usePositions,
  useSeries,
  useWatchMutations,
} from "@/lib/queries";
import {
  EmptyState,
  ErrorState,
  EventCard,
  LoadingState,
  PriceChange,
  QualityBadge,
  ScoreBar,
  SectionHeading,
  SignalBadge,
} from "../market-ui";
import { axisTick, HorizonTabs, tooltipStyle } from "./common";
import { useDefaultHorizon } from "./market-pages";

const RANGES: Record<string, number> = {
  "5D": 7,
  "1M": 31,
  "3M": 92,
  "6M": 183,
  "1Y": 366,
  "5Y": 1827,
};
const OVERLAYS = ["SMA 20", "SMA 50", "EMA 20", "Volume", "RSI", "MACD"] as const;
type Overlay = (typeof OVERLAYS)[number];

export function StockDetailPage({ ticker, focus }: { ticker: string; focus?: string | undefined }) {
  const [tab, setTab] = useState("Overview");
  const [horizon, setHorizon] = useDefaultHorizon();
  const overview = useOverview({ ticker });
  const positions = usePositions();
  const { add, remove } = useWatchMutations();
  const item = overview.data?.items[0];
  const held = (positions.data?.items ?? []).filter((p) => p.ticker === ticker);
  const quantity = held.reduce((q, p) => q + (num(p.quantity) ?? 0), 0);
  if (overview.isLoading) return <LoadingState />;
  if (overview.error) return <ErrorState error={overview.error} />;
  if (!item)
    return (
      <EmptyState
        title="Security not found"
        description={`${ticker} is not in the securities master.`}
      />
    );
  const { security, price } = item;
  const signal = signalFor(item.signals, horizon);
  const latest = [...item.signals].sort((a, b) =>
    (b.decided_at ?? b.generated_at).localeCompare(a.decided_at ?? a.generated_at),
  )[0];
  const watching = item.is_watched;
  return (
    <>
      <div className="backline">
        <Link to="/scanner">
          <ArrowLeft size={15} /> Market scanner
        </Link>
        <span>/</span>
        <span>{security.ticker}</span>
      </div>
      <div className="stock-detail-header">
        <div className="stock-identity">
          <div className="stock-logo">{security.ticker.slice(0, 2)}</div>
          <div>
            <div className="eyebrow">
              {(security.sector ?? "Unclassified").toUpperCase()} / {security.exchange}:{" "}
              {security.ticker}
            </div>
            <h1>{security.ticker}</h1>
            <p>{security.company_name}</p>
          </div>
        </div>
        <div className="stock-header-right">
          <div className="current-price">
            <strong>{price ? naira(price.price, 2) : "No price"}</strong>
            <PriceChange value={price?.change_pct} />
            <span>
              {price
                ? `${price.kind === "quote" ? "Quote" : "Close"} ${formatDateTime(price.as_of)}${price.is_stale ? " · stale" : ""}${price.is_mock ? " · mock data" : ""}`
                : "No price has been recorded"}
            </span>
          </div>
          <Button
            variant="outline"
            disabled={add.isPending || remove.isPending}
            onClick={() => (watching ? remove : add).mutate(security.ticker)}
          >
            <Eye size={16} />
            {watching ? "Watching" : "Add to watchlist"}
          </Button>
        </div>
      </div>
      {focus === "signal" && latest && (
        <div className="focused-alert">
          <CircleAlert size={19} />
          <div>
            <strong>
              Latest signal: {toSignal(latest.action)} ({horizonLabel(latest.horizon)})
            </strong>
            <p>
              {latest.previous_action ? `${toSignal(latest.previous_action)} → ` : ""}
              {toSignal(latest.action)} · {latest.explanation}
            </p>
          </div>
        </div>
      )}
      {signal && signal.data_quality_warnings.length > 0 && (
        <div className="quality-warning">
          <CircleAlert size={17} />
          <div>
            <strong>DATA QUALITY WARNING</strong>
            {signal.data_quality_warnings.map((w) => (
              <p key={w}>{w}</p>
            ))}
            <p>Model confidence is reduced while inputs are incomplete.</p>
          </div>
        </div>
      )}
      <div className="detail-tabs">
        {["Overview", "Technical", "Fundamentals", "Liquidity", "News & Events"].map((x) => (
          <Button
            key={x}
            variant="ghost"
            className={tab === x ? "active" : ""}
            onClick={() => setTab(x)}
          >
            {x}
          </Button>
        ))}
      </div>
      {tab === "Overview" ? (
        <OverviewTab
          ticker={security.ticker}
          signals={item.signals}
          signal={signal}
          horizon={horizon}
          setHorizon={setHorizon}
          held={held}
          quantity={quantity}
        />
      ) : tab === "Technical" ? (
        <TechnicalTab ticker={security.ticker} horizon={horizon} setHorizon={setHorizon} />
      ) : tab === "Fundamentals" ? (
        <FundamentalsTab ticker={security.ticker} />
      ) : tab === "Liquidity" ? (
        <LiquidityTab
          ticker={security.ticker}
          horizon={horizon}
          setHorizon={setHorizon}
          signal={signal}
          quantity={quantity || undefined}
        />
      ) : (
        <EventsTab ticker={security.ticker} />
      )}
    </>
  );
}

function OverviewTab({
  ticker,
  signals,
  signal,
  horizon,
  setHorizon,
  held,
  quantity,
}: {
  ticker: string;
  signals: SignalOut[];
  signal: SignalOut | undefined;
  horizon: ApiHorizon;
  setHorizon: (h: ApiHorizon) => void;
  held: NonNullable<ReturnType<typeof usePositions>["data"]>["items"];
  quantity: number;
}) {
  const explanation = useExplanation(ticker, horizon);
  const position = held.find((p) => p.target_horizon === horizon) ?? held[0];
  const components = explanation.data?.components ?? signal?.components ?? [];
  return (
    <>
      <div className="stock-overview-grid">
        <PriceChart ticker={ticker} />
        <section className="assessment-panel">
          <div className="eyebrow">CURRENT ASSESSMENT · {horizonLabel(horizon).toUpperCase()}</div>
          {signal ? (
            <>
              <div className="assessment-main">
                <SignalBadge signal={toSignal(signal.action)} />
                <strong>
                  {score100(signal.overall_score)}
                  <small>/100</small>
                </strong>
              </div>
              <div className="assessment-confidence">
                Model confidence <strong>{score100(signal.confidence)}%</strong>
              </div>
              <p>{signal.explanation}</p>
              <div className="assessment-meta">
                <span>Data coverage</span>
                <QualityBadge
                  quality={
                    signal.data_quality_warnings.length || num(signal.coverage) !== 1
                      ? `Partial · ${score100(signal.coverage)}%`
                      : "Complete"
                  }
                />
              </div>
              <div className="assessment-meta">
                <span>Liquidity</span>
                <strong>{liquidityLabel(signal)}</strong>
              </div>
              <div className="assessment-meta">
                <span>Risk</span>
                <strong>{riskLabel(signal)}</strong>
              </div>
              <div className="assessment-meta">
                <span>Assessed</span>
                <strong>{timeAgo(signal.generated_at)}</strong>
              </div>
            </>
          ) : (
            <p>No stored assessment for this horizon yet.</p>
          )}
          {quantity > 0 && (
            <div className="held-status">
              YOU OWN {quantity.toLocaleString()} SHARES
              {position?.thesis_status ? ` · THESIS ${position.thesis_status.toUpperCase()}` : ""}
            </div>
          )}
        </section>
      </div>
      <section className="section-block">
        <SectionHeading
          eyebrow="TIME HORIZONS"
          title="Signal by holding period"
          action={<HorizonTabs value={horizon} onChange={setHorizon} />}
        />
        <div className="horizon-grid">
          {API_HORIZONS.map((h) => {
            const s = signalFor(signals, h);
            return (
              <div className={"horizon-card " + (h === horizon ? "selected" : "")} key={h}>
                <span className="eyebrow">{horizonLabel(h).toUpperCase()}</span>
                <SignalBadge signal={s && toSignal(s.action)} />
                <div className="horizon-score">
                  <span>Overall score</span>
                  <strong>{s ? `${score100(s.overall_score)}/100` : NA}</strong>
                </div>
                <div className="horizon-score">
                  <span>Confidence</span>
                  <strong>{s ? `${score100(s.confidence)}%` : NA}</strong>
                </div>
                <Button variant="ghost" onClick={() => setHorizon(h)}>
                  View explanation <ArrowRight size={14} />
                </Button>
              </div>
            );
          })}
        </div>
      </section>
      <div className="analysis-grid">
        <section className="analysis-panel">
          <SectionHeading eyebrow="EXPLAINABILITY" title="Why this signal?" />
          <div className="score-summary">
            <strong>
              {score100(signal?.overall_score) ?? NA}
              <small>/100</small>
            </strong>
            <span>
              Overall assessment <br /> {horizonLabel(horizon)}
            </span>
          </div>
          {components.map((c) => (
            <div key={c.component} title={c.explanation ?? undefined}>
              <ScoreBar
                label={`${COMPONENT_LABELS[c.component] ?? c.component} · w ${pct(c.weight, 0)}`}
                value={c.is_available ? score100(c.score) : null}
              />
            </div>
          ))}
          {explanation.data && explanation.data.rules_applied.length > 0 && (
            <>
              <div className="eyebrow">RULES APPLIED</div>
              {explanation.data.rules_applied.map((r) => (
                <p className="muted small" key={r.code + r.message}>
                  {titleCase(r.code)}: {r.message}
                </p>
              ))}
            </>
          )}
        </section>
        <section className="analysis-panel">
          <SectionHeading
            eyebrow={position ? "YOUR POSITION" : "COMPONENT DETAIL"}
            title={position ? "Trading thesis" : "What drives the score"}
          />
          {position ? (
            <>
              <div className="thesis-quote">
                “{position.investment_thesis || "No written thesis was recorded for this position."}
                ”
              </div>
              <div className="thesis-meta">
                <div>
                  <span>Thesis status</span>
                  <strong>{position.thesis_status ?? "Not reviewed yet"}</strong>
                </div>
                <div>
                  <span>Entered</span>
                  <strong>{formatDate(position.entry_date)}</strong>
                </div>
                <div>
                  <span>Last reviewed</span>
                  <strong>{formatDateTime(position.last_reviewed_at)}</strong>
                </div>
                <div>
                  <span>Initial → current score</span>
                  <strong>
                    {score100(position.initial_score) ?? NA} →{" "}
                    {score100(signalFor(signals, position.target_horizon)?.overall_score) ?? NA}
                  </strong>
                </div>
              </div>
            </>
          ) : (
            components.map((c) => (
              <p className="muted small" key={c.component}>
                <strong>{COMPONENT_LABELS[c.component] ?? c.component}:</strong>{" "}
                {c.explanation ?? "Unavailable"}
              </p>
            ))
          )}
          {explanation.data?.previous_decision && (
            <>
              <div className="eyebrow">CONDITIONS CHANGED</div>
              <p className="muted small">
                Previously{" "}
                {explanation.data.previous_decision.action
                  ? toSignal(explanation.data.previous_decision.action)
                  : NA}{" "}
                ({formatDateTime(explanation.data.previous_decision.decided_at)}).
              </p>
            </>
          )}
        </section>
      </div>
      <div className="factor-grid">
        <div>
          <div className="eyebrow positive">SUPPORTING FACTORS</div>
          {signal?.supporting_factors.length ? (
            signal.supporting_factors.map((f) => (
              <p key={f}>
                <span className="factor-plus">+</span>
                {f}
              </p>
            ))
          ) : (
            <p className="muted">None recorded</p>
          )}
        </div>
        <div>
          <div className="eyebrow negative">RISK FACTORS</div>
          {signal?.risk_factors.length ? (
            signal.risk_factors.map((r) => (
              <p key={r}>
                <span className="factor-minus">−</span>
                {r}
              </p>
            ))
          ) : (
            <p className="muted">None recorded</p>
          )}
        </div>
      </div>
      <p className="section-footnote">
        {explanation.data?.disclaimer ??
          "Signals represent model-based analysis and are not guarantees of future market performance."}
        {signal && ` Strategy ${signal.strategy_version}.`}
      </p>
    </>
  );
}

function PriceChart({ ticker }: { ticker: string }) {
  const [range, setRange] = useState("3M");
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const start = useMemo(
    () => new Date(Date.now() - (RANGES[range] ?? 92) * 86400000).toISOString().slice(0, 10),
    [range],
  );
  const series = useSeries(ticker, {
    start,
    sma: [overlays.includes("SMA 20") && 20, overlays.includes("SMA 50") && 50].filter(
      (x): x is number => !!x,
    ),
    ema: overlays.includes("EMA 20") ? [20] : [],
    rsi: overlays.includes("RSI") ? 14 : undefined,
    macd: overlays.includes("MACD") || undefined,
  });
  const data = (series.data?.points ?? []).map((p) => ({
    date: p.trading_date,
    close: p.close,
    volume: p.volume,
    ...p.indicators,
  }));
  const lines: [string, string][] = [
    ["sma_20", "var(--chart-blue)"],
    ["sma_50", "var(--chart-amber)"],
    ["ema_20", "var(--chart-purple)"],
  ];
  return (
    <section className="chart-panel">
      <div className="flex-between">
        <div>
          <div className="eyebrow">PRICE HISTORY · DAILY CLOSE</div>
          <h2>{ticker} performance</h2>
        </div>
        <div className="segmented compact">
          {Object.keys(RANGES).map((x) => (
            <Button
              key={x}
              variant="ghost"
              className={range === x ? "chosen" : ""}
              onClick={() => setRange(x)}
            >
              {x}
            </Button>
          ))}
        </div>
      </div>
      {series.isLoading ? (
        <LoadingState />
      ) : series.error ? (
        <ErrorState error={series.error} />
      ) : data.length === 0 ? (
        <EmptyState title="No price history" description="No daily bars in this range." />
      ) : (
        <>
          <div style={{ height: 260 }} className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 10, right: 5, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="fill-close" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-positive)" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="var(--chart-positive)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="3 5" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={axisTick}
                  minTickGap={32}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={axisTick}
                  width={56}
                  domain={["auto", "auto"]}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="close"
                  stroke="var(--chart-positive)"
                  strokeWidth={2}
                  fill="url(#fill-close)"
                  dot={false}
                />
                {lines
                  .filter(([key]) => series.data?.indicators.includes(key))
                  .map(([key, color]) => (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stroke={color}
                      dot={false}
                      strokeWidth={1.5}
                    />
                  ))}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          {overlays.includes("Volume") && (
            <div style={{ height: 90 }} className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 4, right: 5, left: 0, bottom: 0 }}>
                  <XAxis dataKey="date" hide />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={axisTick}
                    width={56}
                    tickFormatter={(v) => compact(v)}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="volume" fill="var(--chart-blue)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          {overlays.includes("RSI") && (
            <div style={{ height: 90 }} className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 4, right: 5, left: 0, bottom: 0 }}>
                  <XAxis dataKey="date" hide />
                  <YAxis
                    domain={[0, 100]}
                    ticks={[30, 70]}
                    tickLine={false}
                    axisLine={false}
                    tick={axisTick}
                    width={56}
                  />
                  <ReferenceLine y={70} stroke="var(--chart-grid)" />
                  <ReferenceLine y={30} stroke="var(--chart-grid)" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="rsi_14" stroke="var(--chart-amber)" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          {overlays.includes("MACD") && (
            <div style={{ height: 100 }} className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 4, right: 5, left: 0, bottom: 0 }}>
                  <XAxis dataKey="date" hide />
                  <YAxis tickLine={false} axisLine={false} tick={axisTick} width={56} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="macd_histogram" fill="var(--chart-purple)" />
                  <Line type="monotone" dataKey="macd" stroke="var(--chart-blue)" dot={false} />
                  <Line
                    type="monotone"
                    dataKey="macd_signal"
                    stroke="var(--chart-red)"
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
      <div className="overlay-options">
        {OVERLAYS.map((x) => (
          <label key={x}>
            <input
              type="checkbox"
              checked={overlays.includes(x)}
              onChange={() =>
                setOverlays((p) => (p.includes(x) ? p.filter((v) => v !== x) : [...p, x]))
              }
            />
            {x}
          </label>
        ))}
      </div>
      {series.data?.is_mock && <p className="muted small">Mock price data (fictional fixture).</p>}
    </section>
  );
}

function horizonAnalysis(
  query: ReturnType<typeof useAnalysis>,
  horizon: ApiHorizon,
): AnalysisHorizonOut | undefined {
  return query.data?.horizons.find((h) => h.horizon === horizon);
}

function DataGrid({ rows }: { rows: [string, string, string][] }) {
  return (
    <div className="data-grid">
      {rows.map(([name, value, description]) => (
        <div className="data-item" key={name}>
          <span>
            {name}{" "}
            <span title={description}>
              <Info size={13} />
            </span>
          </span>
          <strong>{value}</strong>
          <small>{description}</small>
        </div>
      ))}
    </div>
  );
}

function TechnicalTab({
  ticker,
  horizon,
  setHorizon,
}: {
  ticker: string;
  horizon: ApiHorizon;
  setHorizon: (h: ApiHorizon) => void;
}) {
  const analysis = useAnalysis(ticker);
  const h = horizonAnalysis(analysis, horizon);
  const m = h?.technical.metrics ?? {};
  const w = h?.technical.params ?? {};
  const win = (key: AnalysisParam) => (w[key] ? ` (${w[key]})` : "");
  return (
    <>
      <SectionHeading
        eyebrow="PRICE & MOMENTUM"
        title="Technical analysis"
        action={<HorizonTabs value={horizon} onChange={setHorizon} />}
      />
      {analysis.isLoading && <LoadingState />}
      {analysis.error && <ErrorState error={analysis.error} />}
      {h && (
        <>
          <DataGrid
            rows={[
              ["Close", naira(m.close, 2), `Last bar ${formatDate(h.technical.last_bar_date)}`],
              [
                "Period return" + win("return_window"),
                pct(m.period_return, 2, true),
                "Price change over the return window",
              ],
              ["1-day return", pct(m.return_1d, 2, true), "Change from the previous session"],
              [
                "Momentum" + win("momentum"),
                pct(m.momentum, 2, true),
                "Rate of change over the window",
              ],
              [
                "RSI" + win("rsi"),
                fixed(m.rsi, 1),
                "Relative strength; above 70 can indicate overbought",
              ],
              [
                "MACD",
                fixed(m.macd, 3),
                `Signal ${fixed(m.macd_signal, 3)} · histogram ${fixed(m.macd_histogram, 3)}`,
              ],
              [
                "ATR" + win("atr"),
                naira(m.atr, 2),
                `Typical daily range · ${pct(m.atr_pct, 2)} of price`,
              ],
              [
                "Volatility" + win("volatility"),
                pct(m.volatility, 2),
                "Annualised standard deviation of daily returns",
              ],
              [
                "Relative volume",
                fixed(m.relative_volume, 2, "×"),
                `Versus the ${w.volume_average ?? NA}-session average`,
              ],
              [
                "SMA fast / slow" + (w.sma_fast ? ` (${w.sma_fast}/${w.sma_slow})` : ""),
                `${naira(m.sma_fast, 2)} / ${naira(m.sma_slow, 2)}`,
                "Price versus recent averages",
              ],
              ["EMA" + win("ema"), naira(m.ema, 2), "Exponential moving average"],
              [
                `Range (${h.technical.range_sessions})`,
                `${naira(m.range_low, 2)} – ${naira(m.range_high, 2)}`,
                `Position in range ${pct(m.range_position, 0)}`,
              ],
              [
                "Drawdown" + win("drawdown"),
                pct(m.drawdown, 2),
                `Max drawdown in window ${pct(m.max_drawdown, 2)}`,
              ],
            ]}
          />
          {h.technical.unavailable.length > 0 && (
            <p className="section-footnote">
              Unavailable (not enough history or missing bars): {h.technical.unavailable.join(", ")}
              .
            </p>
          )}
          <p className="section-footnote">
            {h.technical.bars_used} bars used · analysis {analysis.data?.analysis_version} · as of{" "}
            {formatDate(analysis.data?.as_of_date)}
          </p>
        </>
      )}
    </>
  );
}

const PCT_RATIOS = new Set([
  "profit_margin",
  "return_on_equity",
  "return_on_assets",
  "dividend_payout_ratio",
  "dividend_yield",
]);

function formatMetric(code: string, metric: MetricValueOut | undefined): string {
  if (!metric) return NA;
  if (metric.status === "not_applicable") return "Not applicable";
  if (metric.status !== "available") return "Unavailable";
  const v: Dec = metric.value;
  if (metric.category === "growth" || PCT_RATIOS.has(code))
    return pct(v, 1, metric.category === "growth");
  if (metric.category === "ratio" || code === "pe_ratio" || code === "pb_ratio")
    return fixed(v, 2, "×");
  if (code === "shares_outstanding") return compact(v);
  if (metric.category === "per_share" || code === "dividend_per_share") return naira(v, 2);
  return nairaCompact(v);
}

const FUNDAMENTAL_ORDER = [
  "revenue",
  "gross_earnings",
  "insurance_revenue",
  "net_interest_income",
  "revenue_growth",
  "operating_profit",
  "profit_before_tax",
  "profit_after_tax",
  "profit_after_tax_growth",
  "eps_basic",
  "eps_growth",
  "return_on_equity",
  "return_on_assets",
  "profit_margin",
  "debt_to_equity",
  "total_debt",
  "cash_and_equivalents",
  "total_assets",
  "total_equity",
  "operating_cash_flow",
  "free_cash_flow",
  "book_value_per_share",
  "dividend_per_share",
  "dividend_payout_ratio",
  "shares_outstanding",
];

function FundamentalsTab({ ticker }: { ticker: string }) {
  const fundamentals = useFundamentals(ticker);
  const [index, setIndex] = useState(0);
  if (fundamentals.isLoading) return <LoadingState />;
  if (fundamentals.error) return <ErrorState error={fundamentals.error} />;
  const f = fundamentals.data as FundamentalsOut;
  const period = f.periods[index];
  const previous =
    period && f.periods.find((p, i) => i > index && p.period_type === period.period_type);
  const label = (p: FundamentalsOut["periods"][number]) => `${p.period_type} ${p.fiscal_year}`;
  return (
    <>
      <SectionHeading
        eyebrow="COMPANY PERFORMANCE"
        title="Fundamentals"
        action={
          f.periods.length > 0 && (
            <select
              aria-label="Reporting period"
              value={index}
              onChange={(e) => setIndex(Number(e.target.value))}
            >
              {f.periods.map((p, i) => (
                <option key={label(p) + p.period_end} value={i}>
                  {label(p)} · to {formatDate(p.period_end)}
                </option>
              ))}
            </select>
          )
        }
      />
      {!period ? (
        <EmptyState
          title="No financial reports"
          description="No report published on or before today has been imported for this company."
        />
      ) : (
        <>
          <div className="data-grid">
            {FUNDAMENTAL_ORDER.filter(
              (code) => period.metrics[code] && period.metrics[code].status !== "not_applicable",
            ).map((code) => (
              <div className="data-item" key={code}>
                <span>{titleCase(code)}</span>
                <strong>{formatMetric(code, period.metrics[code])}</strong>
                <small>
                  {previous
                    ? `${label(previous)}: ${formatMetric(code, previous.metrics[code])}`
                    : (period.metrics[code]?.origin ?? "No earlier period")}
                </small>
              </div>
            ))}
            {f.valuation &&
              Object.entries(f.valuation.metrics).map(([code, metric]) => (
                <div className="data-item" key={code}>
                  <span>{titleCase(code)}</span>
                  <strong>{formatMetric(code, metric)}</strong>
                  <small>At {naira(f.valuation?.price?.close, 2)} close</small>
                </div>
              ))}
          </div>
          {f.recent_dividends.length > 0 && (
            <p className="section-footnote">
              Recent dividends:{" "}
              {f.recent_dividends
                .map(
                  (d) =>
                    `${naira(d.amount_per_share, 2)} ${d.dividend_type} (declared ${formatDate(d.declared_on)})`,
                )
                .join(" · ")}
            </p>
          )}
          <p className="section-footnote">
            Source: {period.provenance.source}
            {period.provenance.source_url && (
              <>
                {" "}
                ·{" "}
                <a href={period.provenance.source_url} target="_blank" rel="noreferrer">
                  original
                </a>
              </>
            )}{" "}
            · published {formatDate(period.provenance.published_on)} · {period.basis} ·{" "}
            {period.is_audited === null
              ? "audit status unknown"
              : period.is_audited
                ? "audited"
                : "unaudited"}
            {period.is_mock && " · MOCK DATA"}. Profile: {f.profile.profile}
            {f.profile.note ? ` (${f.profile.note})` : ""}.
          </p>
        </>
      )}
    </>
  );
}

function LiquidityTab({
  ticker,
  horizon,
  setHorizon,
  signal,
  quantity,
}: {
  ticker: string;
  horizon: ApiHorizon;
  setHorizon: (h: ApiHorizon) => void;
  signal: SignalOut | undefined;
  quantity: number | undefined;
}) {
  const analysis = useAnalysis(ticker, true, quantity);
  const h = horizonAnalysis(analysis, horizon);
  const l = h?.liquidity;
  const m = l?.metrics ?? {};
  const position = l?.position as
    | { quantity: Dec; volume_ratio: Dec; days_to_exit: Dec; max_participation_pct: Dec }
    | null
    | undefined;
  return (
    <>
      <SectionHeading
        eyebrow="TRADABILITY"
        title="Liquidity assessment"
        action={<HorizonTabs value={horizon} onChange={setHorizon} />}
      />
      <div className="liquidity-hero">
        <strong>{liquidityLabel(signal)} liquidity</strong>
        <p>
          Liquidity indicates how easily a position may be sold without significantly affecting its
          price. Larger positions require more trading activity.
        </p>
      </div>
      {analysis.isLoading && <LoadingState />}
      {analysis.error && <ErrorState error={analysis.error} />}
      {l && (
        <DataGrid
          rows={[
            [
              "Average daily volume",
              `${compact(m.average_daily_volume)} shares`,
              `${l.sessions_expected} expected sessions from ${formatDate(l.window_start)}`,
            ],
            [
              "Median daily volume",
              `${compact(m.median_daily_volume)} shares`,
              "Less sensitive to one-off block trades",
            ],
            [
              "Average daily value",
              nairaCompact(m.average_daily_value),
              "Traded value per session",
            ],
            ["Average trades", fixed(m.average_trades, 0), "Deals per session"],
            [
              "Trading frequency",
              pct(m.trading_frequency, 0),
              `${l.sessions_traded} of ${l.sessions_expected} sessions traded`,
            ],
            [
              "Zero-volume / missing",
              `${l.zero_volume_sessions} / ${l.missing_sessions}`,
              "Missing sessions have no bar at all",
            ],
            [
              "Volume consistency",
              fixed(m.volume_cv, 2),
              "Coefficient of variation (lower = steadier)",
            ],
            [
              "Position-size assessment",
              position ? `${fixed(position.days_to_exit, 1)} days to exit` : "No position held",
              position
                ? `${compact(position.quantity)} shares · ${fixed(position.volume_ratio, 2)}× ADV at ≤${fixed(position.max_participation_pct, 0)}% participation`
                : "Record a position to size its exit",
            ],
          ]}
        />
      )}
      {l && l.unavailable.length > 0 && (
        <p className="section-footnote">Unavailable: {l.unavailable.join(", ")}.</p>
      )}
    </>
  );
}

function EventsTab({ ticker }: { ticker: string }) {
  const events = useEvents({ ticker });
  return (
    <>
      <SectionHeading eyebrow="CATALYSTS & DISCLOSURES" title="News & events" />
      <div className="event-list">
        {events.isLoading && <LoadingState />}
        {events.error && <ErrorState error={events.error} />}
        {events.data?.items.map((e) => (
          <EventCard key={e.id} event={e} />
        ))}
        {events.data?.items.length === 0 && (
          <EmptyState
            title="No recent material events"
            description="No recorded events are linked to this company."
          />
        )}
      </div>
    </>
  );
}
