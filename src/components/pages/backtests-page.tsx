import { useEffect, useState, type FormEvent } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { num, type ApiHorizon, type BacktestMetrics } from "@/lib/api";
import {
  API_HORIZONS,
  NA,
  fixed,
  formatDate,
  formatDateTime,
  horizonLabel,
  naira,
  nairaCompact,
  pct,
  titleCase,
} from "@/lib/format";
import {
  useBacktest,
  useBacktestConfig,
  useBacktestEquity,
  useBacktestTrades,
  useBacktests,
  useRequestBacktest,
} from "@/lib/queries";
import { EmptyState, ErrorState, LoadingState, MetricCard, SectionHeading } from "../market-ui";
import { FilterSelect, PageHeader, SeriesChart } from "./common";

function metric(m: BacktestMetrics | undefined, key: string): number | null {
  const v = m?.[key];
  return typeof v === "number" ? v : null;
}

function RequestForm({ onCreated }: { onCreated: (id: string) => void }) {
  const config = useBacktestConfig();
  const create = useRequestBacktest();
  const [start, setStart] = useState("2025-01-01");
  const [end, setEnd] = useState(() => new Date().toISOString().slice(0, 10));
  const [horizons, setHorizons] = useState<ApiHorizon[]>([...API_HORIZONS]);
  const [tickers, setTickers] = useState("");
  const [name, setName] = useState("");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    create.mutate(
      {
        start,
        end,
        horizons,
        tickers: tickers
          .split(/[\s,]+/)
          .map((t) => t.trim().toUpperCase())
          .filter(Boolean),
        name: name.trim() || null,
      },
      { onSuccess: (run) => onCreated(run.id) },
    );
  };
  return (
    <form className="settings-panel" onSubmit={submit}>
      <div className="eyebrow">NEW RUN</div>
      <h2>Request a backtest</h2>
      <label className="field-label">
        Name (optional)
        <input value={name} maxLength={200} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="field-label">
        Start
        <input type="date" required value={start} onChange={(e) => setStart(e.target.value)} />
      </label>
      <label className="field-label">
        End
        <input type="date" required value={end} onChange={(e) => setEnd(e.target.value)} />
      </label>
      <div className="field-label">
        Horizons
        <div className="overlay-options">
          {API_HORIZONS.map((h) => (
            <label key={h}>
              <input
                type="checkbox"
                checked={horizons.includes(h)}
                onChange={() =>
                  setHorizons((p) => (p.includes(h) ? p.filter((x) => x !== h) : [...p, h]))
                }
              />
              {horizonLabel(h)}
            </label>
          ))}
        </div>
      </div>
      <label className="field-label">
        Tickers (blank = whole universe)
        <input
          value={tickers}
          placeholder="e.g. MOCKTEL, MOCKBANK"
          onChange={(e) => setTickers(e.target.value)}
        />
      </label>
      <Button type="submit" disabled={create.isPending || horizons.length === 0}>
        <Play size={15} /> {create.isPending ? "Queuing…" : "Queue backtest"}
      </Button>
      {create.error && <p className="negative small">{create.error.message}</p>}
      <p className="section-footnote">
        Runs on the background worker, look-ahead safe, with starting capital{" "}
        {naira(config.data?.params.starting_capital)} per horizon
        {config.data ? ` and at most ${config.data.max_days} days` : ""}.
        {config.data ? ` Strategy ${config.data.strategy_version}.` : ""}
      </p>
    </form>
  );
}

export function BacktestsPage() {
  const runs = useBacktests();
  const [selected, setSelected] = useState<string | null>(null);
  const items = runs.data?.items ?? [];
  const firstId = items[0]?.id;
  useEffect(() => {
    if (!selected && firstId) setSelected(firstId);
  }, [firstId, selected]);
  const detail = useBacktest(selected);
  const run = detail.data;
  const done = run?.status === "succeeded";
  const equity = useBacktestEquity(selected, done);
  const trades = useBacktestTrades(selected, done);
  const overall = run?.metrics.overall;

  // The combined book is the per-session sum of the horizon books (as in the backend metrics).
  const totals = new Map<string, number>();
  for (const curve of Object.values(equity.data?.horizons ?? {})) {
    for (const p of curve) totals.set(p.day, (totals.get(p.day) ?? 0) + (num(p.equity) ?? 0));
  }
  let peak = 0;
  const curve = [...totals.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, value]) => {
      peak = Math.max(peak, value);
      return { day, equity: value, drawdown: peak > 0 ? value / peak - 1 : 0 };
    });
  const capital = metric(overall, "starting_capital");

  return (
    <>
      <PageHeader
        eyebrow="RESEARCH / HISTORICAL TESTING"
        title="Backtests"
        description="Replay the decision engine over history with costs, liquidity and look-ahead safeguards."
        action={
          items.length > 0 && (
            <FilterSelect
              label="Run"
              value={selected ?? ""}
              onChange={setSelected}
              options={items.map((r): [string, string] => [
                r.id,
                `${r.name ?? r.strategy_version} · ${formatDate(r.start_date)} – ${formatDate(r.end_date)} · ${r.status}`,
              ])}
            />
          )
        }
      />
      {runs.isLoading && <LoadingState />}
      {runs.error && <ErrorState error={runs.error} />}
      <div className="settings-layout">
        <div>
          {runs.data && items.length === 0 && (
            <EmptyState
              title="No backtests yet"
              description="Queue a run with the form; results appear here when the worker finishes."
            />
          )}
          {detail.error && <ErrorState error={detail.error} />}
          {run && !done && (
            <div className="quality-warning">
              <div>
                <strong>{run.status.toUpperCase()}</strong>
                <p>
                  {run.status === "failed"
                    ? `The run failed: ${run.error ?? "no error recorded"}`
                    : `Requested ${formatDateTime(run.created_at)}. This page refreshes while the worker runs it.`}
                </p>
              </div>
            </div>
          )}
          {run && done && (
            <>
              <div className="summary-grid">
                <MetricCard
                  label="Total return"
                  value={pct(metric(overall, "total_return"), 1, true)}
                  detail={`${formatDate(run.start_date)} – ${formatDate(run.end_date)}`}
                />
                <MetricCard
                  label="Win rate"
                  value={pct(metric(overall, "win_rate"), 1)}
                  detail={`of ${metric(overall, "trades") ?? 0} trades`}
                />
                <MetricCard
                  label="Profit factor"
                  value={fixed(metric(overall, "profit_factor"), 2)}
                  detail="gross win / gross loss"
                />
                <MetricCard
                  label="Max drawdown"
                  value={pct(metric(overall, "max_drawdown"), 1)}
                  detail="peak-to-trough"
                />
              </div>
              <div className="backtest-meta">
                <span>
                  Initial capital <strong>{naira(capital)}</strong>
                </span>
                <span>
                  Final equity <strong>{naira(metric(overall, "final_equity"))}</strong>
                </span>
                <span>
                  Annualised <strong>{pct(metric(overall, "annualised_return"), 1, true)}</strong>
                </span>
                <span>
                  Average win <strong>{pct(metric(overall, "average_win_return"), 1, true)}</strong>
                </span>
                <span>
                  Average loss{" "}
                  <strong>{pct(metric(overall, "average_loss_return"), 1, true)}</strong>
                </span>
                <span>
                  Avg. holding{" "}
                  <strong>{fixed(metric(overall, "average_holding_days"), 0, " days")}</strong>
                </span>
                <span>
                  Fees + slippage{" "}
                  <strong>
                    {nairaCompact(
                      (metric(overall, "fees") ?? 0) + (metric(overall, "slippage") ?? 0),
                    )}
                  </strong>
                </span>
              </div>
              <div className="analysis-grid">
                <section className="chart-panel">
                  <SectionHeading eyebrow="HISTORICAL PERFORMANCE" title="Equity curve" />
                  {equity.isLoading ? (
                    <LoadingState />
                  ) : curve.length ? (
                    <SeriesChart data={curve} x="day" y="equity" format={(v) => nairaCompact(v)} />
                  ) : (
                    <EmptyState
                      title="No equity points"
                      description="The run recorded no sessions."
                    />
                  )}
                </section>
                <section className="chart-panel">
                  <SectionHeading eyebrow="RISK PROFILE" title="Drawdown" />
                  {curve.length > 0 && (
                    <SeriesChart
                      data={curve}
                      x="day"
                      y="drawdown"
                      color="var(--chart-red)"
                      format={(v) => pct(v, 1)}
                    />
                  )}
                </section>
              </div>
              <section className="section-block">
                <SectionHeading eyebrow="BREAKDOWN" title="Results by horizon" />
                <div className="data-grid three">
                  {Object.entries(run.metrics.by_horizon ?? {}).map(([h, m]) => (
                    <div className="data-item" key={h}>
                      <span>{horizonLabel(h as ApiHorizon)}</span>
                      <strong>{pct(metric(m, "total_return"), 1, true)}</strong>
                      <small>
                        {metric(m, "trades") ?? 0} trades · win rate {pct(metric(m, "win_rate"), 0)}{" "}
                        · max DD {pct(metric(m, "max_drawdown"), 1)}
                      </small>
                    </div>
                  ))}
                </div>
              </section>
              <section className="section-block">
                <SectionHeading
                  eyebrow="EXECUTION RECORD"
                  title="Simulated trades"
                  action={
                    trades.data && trades.data.total > trades.data.items.length ? (
                      <span className="muted small">
                        First {trades.data.items.length} of {trades.data.total}
                      </span>
                    ) : undefined
                  }
                />
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>SECURITY</th>
                        <th>HORIZON</th>
                        <th>ENTRY</th>
                        <th>EXIT</th>
                        <th>DAYS</th>
                        <th>NET P/L</th>
                        <th>RETURN</th>
                        <th>EXIT REASON</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(trades.data?.items ?? []).map((t) => {
                        const r = num(t.return_pct);
                        return (
                          <tr key={t.id}>
                            <td>
                              <strong>{t.ticker}</strong>
                            </td>
                            <td>{horizonLabel(t.horizon)}</td>
                            <td>
                              {naira(t.entry_price, 2)}{" "}
                              <span className="muted small">{formatDate(t.entry_date)}</span>
                            </td>
                            <td>
                              {naira(t.exit_price, 2)}{" "}
                              <span className="muted small">{formatDate(t.exit_date)}</span>
                            </td>
                            <td>{t.holding_days}</td>
                            <td>{naira(t.net_pnl)}</td>
                            <td className={r === null ? "" : r >= 0 ? "positive" : "negative"}>
                              {pct(r, 1, true)}
                            </td>
                            <td>{titleCase(t.exit_reason)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {trades.isLoading && <LoadingState />}
                  {trades.data?.items.length === 0 && (
                    <EmptyState
                      title="No trades"
                      description="The strategy took no positions in this period."
                    />
                  )}
                </div>
              </section>
              <p className="section-footnote">
                {run.disclaimer} Strategy {run.strategy_version}
                {run.is_mock ? " · run on MOCK data" : ""}.
              </p>
            </>
          )}
          {!run && !detail.isLoading && items.length > 0 && <p className="muted">{NA}</p>}
        </div>
        <RequestForm onCreated={setSelected} />
      </div>
    </>
  );
}
