import { Activity, CircleAlert, CircleCheck } from "lucide-react";
import { useState } from "react";
import { num, type Dec, type MacroIndicatorOut } from "@/lib/api";
import { NA, fixed, formatDate, pct, score100, titleCase } from "@/lib/format";
import { useMacroIndicators, useMacroObservations, useMacroSnapshot } from "@/lib/queries";
import { EmptyState, ErrorState, LoadingState, SectionHeading } from "../market-ui";
import { FilterSelect, PageHeader, SeriesChart } from "./common";

// Headline indicators shown as cards; everything else is still selectable in the chart.
const HEADLINE = [
  "headline_inflation_yoy",
  "monetary_policy_rate",
  "usd_ngn_official",
  "external_reserves",
  "tbill_91d_stop_rate",
  "real_gdp_growth_yoy",
];

/** A value in the indicator's own unit; units are never converted. */
function formatValue(value: Dec, unit: string): string {
  const n = num(value);
  if (n === null) return NA;
  switch (unit) {
    case "percent":
      return `${n.toFixed(2)}%`;
    case "ngn_per_usd":
      return `₦${n.toLocaleString("en-NG", { maximumFractionDigits: 2 })}`;
    case "usd_millions":
      return n >= 1000 ? `$${(n / 1000).toFixed(2)}bn` : `$${n.toFixed(0)}m`;
    case "ngn_billions":
      return n >= 1000 ? `₦${(n / 1000).toFixed(2)}tn` : `₦${n.toFixed(0)}bn`;
    case "usd_per_barrel":
      return `$${n.toFixed(2)}`;
    case "mbpd":
      return `${n.toFixed(2)} mbpd`;
    default:
      return n.toLocaleString("en-NG", { maximumFractionDigits: 2 });
  }
}

function IndicatorCard({ indicator }: { indicator: MacroIndicatorOut }) {
  const observations = useMacroObservations(indicator.code);
  const [latest, previous] = observations.data?.items ?? [];
  return (
    <div className="metric-card">
      <div className="metric-top">
        <span>{indicator.name}</span>
        <Activity size={17} />
      </div>
      <strong>{latest ? formatValue(latest.value, indicator.unit) : "Unavailable"}</strong>
      <div className="metric-foot">
        <span>
          {previous
            ? `Previous ${formatValue(previous.value, indicator.unit)} (${formatDate(previous.observation_date)})`
            : "No earlier observation"}
        </span>
      </div>
      <div className="macro-source">
        {latest
          ? `${latest.source}${latest.is_mock ? " (mock)" : ""} · for ${formatDate(latest.observation_date)} · published ${formatDate(latest.published_on)}`
          : (indicator.publisher ?? NA)}
      </div>
    </div>
  );
}

export function MacroPage() {
  const indicators = useMacroIndicators();
  const snapshot = useMacroSnapshot();
  const [selected, setSelected] = useState("headline_inflation_yoy");
  const observations = useMacroObservations(selected);
  const all = indicators.data?.indicators ?? [];
  const headline = HEADLINE.map((c) => all.find((i) => i.code === c)).filter(
    (i): i is MacroIndicatorOut => !!i,
  );
  const chosen = all.find((i) => i.code === selected);
  const points = [...(observations.data?.items ?? [])]
    .reverse()
    .map((o) => ({ date: o.observation_date, value: num(o.value) }));
  const s = snapshot.data;
  const drivers = s
    ? Object.values(s.factors).flatMap((f) =>
        Object.entries(f.drivers).map(([code, d]) => ({ code, ...d })),
      )
    : [];
  const scored = drivers.filter((d) => d.status === "scored" && d.score !== null);
  const headwinds = scored
    .filter((d) => (d.score ?? 0) < -0.1)
    .sort((a, b) => (a.score ?? 0) - (b.score ?? 0));
  const tailwinds = scored
    .filter((d) => (d.score ?? 0) > 0.1)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const unavailable = drivers.filter((d) => d.status === "unavailable");
  return (
    <>
      <PageHeader
        eyebrow="NIGERIA / ECONOMIC CONTEXT"
        title="Macro environment"
        description="Key indicators shaping market conditions and sector sensitivity."
      />
      {indicators.isLoading && <LoadingState />}
      {indicators.error && <ErrorState error={indicators.error} />}
      <div className="macro-grid">
        {headline.map((i) => (
          <IndicatorCard key={i.code} indicator={i} />
        ))}
      </div>
      <div className="macro-layout">
        <section className="chart-panel">
          <SectionHeading
            eyebrow="HISTORICAL TREND"
            title={chosen ? chosen.name : "Indicator trajectory"}
            action={
              <FilterSelect
                label="Indicator"
                value={selected}
                onChange={setSelected}
                options={all.map((i): [string, string] => [i.code, i.name])}
              />
            }
          />
          {observations.isLoading ? (
            <LoadingState />
          ) : observations.error ? (
            <ErrorState error={observations.error} />
          ) : points.length === 0 ? (
            <EmptyState
              title="No observations"
              description="Nothing has been imported for this indicator."
            />
          ) : (
            <SeriesChart
              data={points}
              x="date"
              y="value"
              color="var(--chart-blue)"
              format={(v) => formatValue(v, chosen?.unit ?? "")}
            />
          )}
          {chosen?.description && <p className="muted small">{chosen.description}</p>}
        </section>
        <aside className="assessment-panel">
          <div className="eyebrow">CURRENT MACRO ENVIRONMENT</div>
          {snapshot.isLoading ? (
            <LoadingState />
          ) : !s ? (
            <p>No macro snapshot has been computed yet.</p>
          ) : (
            <>
              <h2>
                {titleCase(s.stance)}
                {s.is_mixed ? " (mixed)" : ""}
              </h2>
              <p>
                Score {fixed(s.score, 2)} on −1…+1 · confidence {score100(s.confidence)}% · coverage{" "}
                {pct(s.coverage, 0)} · as of {formatDate(s.as_of_date)}.
              </p>
              {headwinds.slice(0, 4).map((d) => (
                <div className="macro-factor" key={d.code} title={d.description}>
                  <CircleAlert size={16} /> {titleCase(d.code)} ({fixed(d.score, 2)})
                </div>
              ))}
              {tailwinds.slice(0, 4).map((d) => (
                <div className="macro-factor" key={d.code} title={d.description}>
                  <CircleCheck size={16} /> {titleCase(d.code)} (+{fixed(d.score, 2)})
                </div>
              ))}
              {unavailable.length > 0 && (
                <p className="muted small">
                  Unavailable:{" "}
                  {unavailable
                    .map((d) => `${titleCase(d.code)}${d.reason ? ` (${d.reason})` : ""}`)
                    .join("; ")}
                </p>
              )}
              {s.notes.map((n) => (
                <p className="muted small" key={n}>
                  {n}
                </p>
              ))}
            </>
          )}
        </aside>
      </div>
      <section className="section-block">
        <SectionHeading eyebrow="CROSS-MARKET CONTEXT" title="Sector sensitivity" />
        {s && s.sectors.length > 0 ? (
          <div className="sector-grid">
            {s.sectors.map((x) => (
              <div className="sector-item" key={x.sector}>
                <strong>{titleCase(x.sector)}</strong>
                <p>
                  {titleCase(x.stance)}
                  {x.is_mixed ? " (mixed)" : ""} · score {fixed(x.score, 2)} · confidence{" "}
                  {score100(x.confidence)}%
                </p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No sector view"
            description="Sector scores appear with the next macro snapshot."
          />
        )}
      </section>
      <p className="section-footnote">
        Point-in-time values: each observation is used only from its publication date.
        {s ? ` Model ${s.model_version}.` : ""}
        {s?.is_mock ? " Built from MOCK data, not current economic data." : ""}
      </p>
    </>
  );
}
