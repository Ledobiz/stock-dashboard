import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { ArrowRight, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { num, type ApiAction, type ApiHorizon, type PositionOut } from "@/lib/api";
import {
  API_HORIZONS,
  NA,
  formatDate,
  formatDateTime,
  horizonLabel,
  naira,
  pct,
  score100,
  signalFor,
  todayIso,
  toSignal,
} from "@/lib/format";
import {
  useAddPosition,
  useDeletePosition,
  useEvents,
  useOverview,
  usePortfolioSummary,
  usePosition,
  usePositions,
} from "@/lib/queries";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  MetricCard,
  PriceChange,
  SectionHeading,
  SignalBadge,
} from "../market-ui";
import { PageHeader } from "./common";

const COLORS = [
  "var(--chart-positive)",
  "var(--chart-blue)",
  "var(--chart-amber)",
  "var(--chart-red)",
  "var(--chart-purple)",
];

function returnPct(p: PositionOut): number | null {
  const r = num(p.valuation?.unrealised_pnl_pct);
  return r === null ? null : r * 100;
}

export function PortfolioPage({ addTicker }: { addTicker?: string | undefined }) {
  const navigate = useNavigate();
  const positions = usePositions();
  const summary = usePortfolioSummary();
  const overview = useOverview();
  const remove = useDeletePosition();
  const [open, setOpen] = useState(!!addTicker);
  const [selected, setSelected] = useState<string | null>(null);
  useEffect(() => {
    if (addTicker) setOpen(true);
  }, [addTicker]);
  const signals = new Map((overview.data?.items ?? []).map((x) => [x.security.ticker, x.signals]));
  const list = positions.data?.items ?? [];
  const s = summary.data;
  const allocations = s?.allocations ?? [];
  function closeForm() {
    setOpen(false);
    if (addTicker) navigate({ to: "/portfolio", search: {} });
  }
  function deletePosition(p: PositionOut) {
    if (!window.confirm(`Delete the recorded ${p.ticker} position and its history?`)) return;
    remove.mutate(p.id, {
      onSuccess: () => {
        if (selected === p.id) setSelected(null);
      },
    });
  }
  return (
    <>
      <PageHeader
        eyebrow="YOUR BOOK / POSITIONS"
        title="Portfolio"
        description="Your externally purchased holdings, tracked against current market assessments."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus size={16} /> Add position
          </Button>
        }
      />
      <div className="summary-grid">
        <MetricCard
          label="Portfolio value"
          value={s ? naira(s.market_value) : NA}
          change={s ? pct(s.unrealised_pnl_pct, 1, true) : undefined}
          detail={
            s && !s.is_complete
              ? `${s.priced_positions} of ${s.open_positions} priced`
              : "unrealised return"
          }
        />
        <MetricCard
          label="Invested capital"
          value={s ? naira(s.cost_basis) : NA}
          detail={s ? `${s.open_positions} positions · incl. fees` : undefined}
        />
        <MetricCard
          label="Unrealised P/L"
          value={s ? naira(s.unrealised_pnl) : NA}
          detail="at latest known prices"
        />
        <MetricCard
          label="Realised P/L"
          value={s ? naira(s.realised_pnl) : NA}
          detail={s ? `${s.closed_positions} closed positions` : undefined}
        />
      </div>
      {s?.warnings.map((w) => (
        <p className="muted small" key={w}>
          {w}
        </p>
      ))}
      <div className="portfolio-layout">
        <section>
          <SectionHeading
            eyebrow="HOLDINGS"
            title="Open positions"
            action={<span className="muted small">Click a position for details</span>}
          />
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>SECURITY</th>
                  <th>ENTRY</th>
                  <th>CURRENT</th>
                  <th>QTY</th>
                  <th>INVESTED</th>
                  <th>VALUE</th>
                  <th>P/L %</th>
                  <th>P/L ₦</th>
                  <th>HORIZON</th>
                  <th>SIGNAL</th>
                  <th>CONF.</th>
                  <th>THESIS</th>
                  <th>PRICED</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {list.map((p) => {
                  const signal = signalFor(signals.get(p.ticker) ?? [], p.target_horizon);
                  const pnl = num(p.valuation?.unrealised_pnl);
                  return (
                    <tr
                      key={p.id}
                      className="clickable-row"
                      onClick={() => setSelected(selected === p.id ? null : p.id)}
                    >
                      <td>
                        <Link
                          className="table-ticker"
                          to="/stocks/$ticker"
                          params={{ ticker: p.ticker }}
                          search={{}}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {p.ticker}
                          <span>{p.company_name}</span>
                        </Link>
                      </td>
                      <td>{naira(p.entry_price, 2)}</td>
                      <td>{naira(p.valuation?.price?.price, 2)}</td>
                      <td>{num(p.quantity)?.toLocaleString() ?? NA}</td>
                      <td>{naira(p.capital_committed)}</td>
                      <td>{naira(p.valuation?.market_value)}</td>
                      <td>
                        <PriceChange value={returnPct(p)} />
                      </td>
                      <td className={pnl === null ? "" : pnl >= 0 ? "positive" : "negative"}>
                        {pnl === null ? NA : (pnl >= 0 ? "+" : "") + naira(pnl)}
                      </td>
                      <td>{horizonLabel(p.target_horizon)}</td>
                      <td>
                        <SignalBadge signal={signal && toSignal(signal.action)} />
                      </td>
                      <td>{signal ? `${score100(signal.confidence)}%` : NA}</td>
                      <td>
                        {p.thesis_status ? (
                          <span className={"thesis " + p.thesis_status}>{p.thesis_status}</span>
                        ) : (
                          <span className="muted">Not reviewed</span>
                        )}
                      </td>
                      <td>{formatDateTime(p.valuation?.price?.as_of)}</td>
                      <td>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="negative"
                          aria-label={`Delete ${p.ticker} position`}
                          title="Delete position"
                          disabled={remove.isPending}
                          onClick={(e) => {
                            e.stopPropagation();
                            deletePosition(p);
                          }}
                        >
                          <Trash2 size={15} />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {positions.isLoading && <LoadingState />}
            {positions.error && <ErrorState error={positions.error} />}
            {positions.data && list.length === 0 && (
              <EmptyState
                title="No positions yet"
                description="Add a trade made externally to track it here."
              />
            )}
          </div>
        </section>
        <aside className="allocation-panel">
          <SectionHeading eyebrow="EXPOSURE" title="Allocation" />
          <div className="allocation-chart">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={allocations.map((a) => ({
                    name: a.ticker,
                    value: num(a.market_value) ?? 0,
                  }))}
                  dataKey="value"
                  innerRadius="66%"
                  outerRadius="88%"
                  stroke="none"
                >
                  {allocations.map((a, i) => (
                    <Cell key={a.position_id} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="allocation-center">
              <strong>{s?.open_positions ?? NA}</strong>
              <span>holdings</span>
            </div>
          </div>
          <div className="allocation-legend">
            {allocations.map((a, i) => (
              <div key={a.position_id}>
                <span className="legend-color" style={{ background: COLORS[i % COLORS.length] }} />
                {a.ticker}
                <strong>{pct(a.weight)}</strong>
              </div>
            ))}
            {s && allocations.length === 0 && (
              <p className="muted small">No priced positions to allocate.</p>
            )}
          </div>
        </aside>
      </div>
      {selected && <PositionDrawer id={selected} onClose={() => setSelected(null)} />}
      {open && (
        <AddPositionModal
          initialTicker={addTicker ?? ""}
          tickers={(overview.data?.items ?? []).map((x) => x.security.ticker)}
          onClose={closeForm}
        />
      )}
    </>
  );
}

function PositionDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const detail = usePosition(id);
  const remove = useDeletePosition();
  const p = detail.data;
  const events = useEvents({ ticker: p?.ticker, limit: 5 });
  const overview = useOverview(p ? { ticker: p.ticker } : { ticker: "" });
  const signal = p && signalFor(overview.data?.items[0]?.signals ?? [], p.target_horizon);
  const entry = (p?.entry_snapshot ?? {}) as {
    available?: boolean;
    action?: ApiAction;
    reason?: string;
    explanation?: string;
  };
  const days = p
    ? Math.max(
        0,
        Math.round((Date.now() - new Date(`${p.entry_date}T00:00:00`).getTime()) / 86400000),
      )
    : null;
  const pnl = num(p?.valuation?.unrealised_pnl);
  return (
    <div className="detail-drawer-backdrop" onClick={onClose}>
      <aside className="detail-drawer" onClick={(e) => e.stopPropagation()}>
        {detail.isLoading && <LoadingState />}
        {detail.error && <ErrorState error={detail.error} />}
        {p && (
          <>
            <div className="drawer-top">
              <div>
                <div className="eyebrow">POSITION DETAIL</div>
                <h2>{p.ticker}</h2>
                <p>{p.company_name}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close detail">
                <X />
              </Button>
            </div>
            <div className="drawer-metrics">
              <MetricCard label="Entry price" value={naira(p.entry_price, 2)} />
              <MetricCard label="Current price" value={naira(p.valuation?.price?.price, 2)} />
              <MetricCard
                label="Unrealised P/L"
                value={pnl === null ? NA : naira(pnl)}
                change={pct(p.valuation?.unrealised_pnl_pct, 1, true)}
              />
              <MetricCard label="Days held" value={String(days)} />
            </div>
            <div className="drawer-section">
              <div className="eyebrow">
                CURRENT ASSESSMENT · {horizonLabel(p.target_horizon).toUpperCase()}
              </div>
              <div className="flex-between">
                <SignalBadge signal={signal && toSignal(signal.action)} />
                <span>
                  {signal ? `${score100(signal.confidence)}% confidence` : "Not assessed"}
                </span>
              </div>
              {signal?.explanation && <p>{signal.explanation}</p>}
              <p>
                Initial signal: {p.initial_action ? toSignal(p.initial_action) : "unavailable"} ·
                Target: {horizonLabel(p.target_horizon)} · Thesis:{" "}
                {p.thesis_status ?? "not reviewed yet"}
              </p>
              {p.latest_snapshot?.thesis_reasons.map((r) => (
                <p className="muted small" key={r.code}>
                  {r.message}
                </p>
              ))}
            </div>
            <div className="drawer-section">
              <div className="eyebrow">SINCE PURCHASE</div>
              <div className="timeline">
                <div>
                  <strong>Purchased</strong>
                  <span>
                    {formatDate(p.entry_date)} · {naira(p.entry_price, 2)} × {num(p.quantity)}
                    {num(p.fees) ? ` · fees ${naira(p.fees, 2)}` : ""}
                  </span>
                </div>
                <div>
                  <strong>{entry.action ? toSignal(entry.action) : "Entry thesis"}</strong>
                  <span>
                    {entry.available === false
                      ? `No assessment was available at entry${entry.reason ? ` (${entry.reason})` : ""}`
                      : `Score ${score100(p.initial_score) ?? NA}/100 at entry${entry.explanation ? ` · ${entry.explanation}` : ""}`}
                  </span>
                </div>
                {p.latest_snapshot && (
                  <div>
                    <strong>
                      {p.latest_snapshot.action ? toSignal(p.latest_snapshot.action) : "Reviewed"}
                    </strong>
                    <span>Last review {formatDateTime(p.latest_snapshot.as_of)}</span>
                  </div>
                )}
              </div>
              {p.investment_thesis && <p className="muted small">Thesis: {p.investment_thesis}</p>}
              {p.notes && <p className="muted small">Notes: {p.notes}</p>}
            </div>
            <div className="drawer-section">
              <div className="eyebrow">RELEVANT EVENTS</div>
              {events.data?.items.length ? (
                events.data.items.map((e) => (
                  <p key={e.id}>
                    <Link to="/events/$id" params={{ id: e.id }} search={{}}>
                      {e.title}
                    </Link>
                  </p>
                ))
              ) : (
                <p className="muted small">No recorded events for this company.</p>
              )}
            </div>
            <Button asChild className="w-full">
              <Link to="/stocks/$ticker" params={{ ticker: p.ticker }} search={{}}>
                Open full stock analysis <ArrowRight size={15} />
              </Link>
            </Button>
            <Button
              variant="ghost"
              className="w-full negative"
              disabled={remove.isPending}
              onClick={() => {
                if (!window.confirm(`Delete the recorded ${p.ticker} position and its history?`))
                  return;
                remove.mutate(p.id, { onSuccess: onClose });
              }}
            >
              Remove recorded position
            </Button>
            {remove.error && <ErrorState error={remove.error} title="Couldn't remove" />}
            <p className="section-footnote">{p.disclaimer}</p>
          </>
        )}
      </aside>
    </div>
  );
}

function AddPositionModal({
  initialTicker,
  tickers,
  onClose,
}: {
  initialTicker: string;
  tickers: string[];
  onClose: () => void;
}) {
  const add = useAddPosition();
  const [form, setForm] = useState({
    ticker: initialTicker,
    quantity: "",
    entry: "",
    fees: "",
    date: todayIso(),
    horizon: "1m" as ApiHorizon,
    thesis: "",
    notes: "",
  });
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="flex-between">
          <div>
            <div className="eyebrow">PORTFOLIO RECORD</div>
            <h2>Add position</h2>
          </div>
          <Button variant="ghost" size="icon" aria-label="Close" onClick={onClose}>
            <X />
          </Button>
        </div>
        <p className="muted">Record a trade you made externally. No order will be placed.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.ticker || !Number(form.quantity) || !Number(form.entry)) return;
            add.mutate(
              {
                ticker: form.ticker,
                quantity: form.quantity,
                entry_price: form.entry,
                entry_date: form.date,
                target_horizon: form.horizon,
                fees: form.fees || undefined,
                thesis: form.thesis || null,
                notes: form.notes || null,
              },
              { onSuccess: onClose },
            );
          }}
          className="form-grid"
        >
          <label>
            Ticker
            <select
              required
              value={form.ticker}
              onChange={(e) => setForm({ ...form, ticker: e.target.value })}
            >
              <option value="">Select security</option>
              {tickers.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label>
            Quantity
            <input
              required
              type="number"
              min="1"
              step="1"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            />
          </label>
          <label>
            Entry price (₦)
            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              value={form.entry}
              onChange={(e) => setForm({ ...form, entry: e.target.value })}
            />
          </label>
          <label>
            Fees (₦, optional)
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.fees}
              onChange={(e) => setForm({ ...form, fees: e.target.value })}
            />
          </label>
          <label>
            Purchase date
            <input
              required
              type="date"
              max={todayIso()}
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </label>
          <label>
            Target horizon
            <select
              value={form.horizon}
              onChange={(e) => setForm({ ...form, horizon: e.target.value as ApiHorizon })}
            >
              {API_HORIZONS.map((h) => (
                <option key={h} value={h}>
                  {horizonLabel(h)}
                </option>
              ))}
            </select>
          </label>
          <label className="full">
            Investment thesis
            <textarea
              value={form.thesis}
              onChange={(e) => setForm({ ...form, thesis: e.target.value })}
              placeholder="Optional: why you bought"
            />
          </label>
          <label className="full">
            Notes
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Optional context about this trade"
            />
          </label>
          {add.error && <p className="negative full">{add.error.message}</p>}
          <Button type="submit" className="full" disabled={add.isPending}>
            {add.isPending ? "Saving…" : "Save position"}
          </Button>
        </form>
      </div>
    </div>
  );
}
