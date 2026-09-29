import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { NA, formatDateTime, pct, titleCase } from "@/lib/format";
import { useEvent, useEvents, useOverview, usePositions } from "@/lib/queries";
import { EmptyState, ErrorState, EventCard, LoadingState, SectionHeading } from "../market-ui";
import { FilterSelect, PageHeader } from "./common";

const KINDS: [string, string][] = [
  ["", "All"],
  ["corporate", "Company"],
  ["regulatory", "Regulatory"],
  ["macroeconomic", "Macroeconomic"],
];

const CATEGORIES = [
  "financial_results",
  "dividend",
  "profit_warning",
  "management_change",
  "governance",
  "capital_raise",
  "acquisition",
  "disposal",
  "litigation",
  "regulatory_change",
  "government_policy",
  "industry_disruption",
  "operational_disruption",
  "macroeconomic_release",
  "other",
];

const SEVERITIES = ["low", "medium", "high", "critical"];

export function EventsPage() {
  const [kind, setKind] = useState("");
  const [category, setCategory] = useState("");
  const [ticker, setTicker] = useState("");
  const [usage, setUsage] = useState("");
  const [severity, setSeverity] = useState("");
  const overview = useOverview();
  const events = useEvents({
    kind: kind || undefined,
    category: category || undefined,
    ticker: ticker || undefined,
    usage: usage || undefined,
    limit: 200,
  });
  // The API has no severity filter; it is applied to the loaded page.
  const items = (events.data?.items ?? []).filter((e) => !severity || e.severity === severity);
  return (
    <>
      <PageHeader
        eyebrow="INTELLIGENCE / EVENT MONITOR"
        title="Events & news"
        description="Company, regulatory and macro developments that could shift an assessment."
      />
      <div className="toolbar-row wrap">
        <div className="segmented">
          {KINDS.map(([value, label]) => (
            <Button
              key={label}
              variant="ghost"
              className={kind === value ? "chosen" : ""}
              onClick={() => setKind(value)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>
      <div className="scanner-filters">
        <FilterSelect
          label="Company"
          value={ticker}
          onChange={setTicker}
          options={[
            ["", "All companies"],
            ...(overview.data?.items ?? []).map((x): [string, string] => [
              x.security.ticker,
              x.security.ticker,
            ]),
          ]}
        />
        <FilterSelect
          label="Category"
          value={category}
          onChange={setCategory}
          options={[
            ["", "Any category"],
            ...CATEGORIES.map((c): [string, string] => [c, titleCase(c)]),
          ]}
        />
        <FilterSelect
          label="Severity"
          value={severity}
          onChange={setSeverity}
          options={[
            ["", "Any severity"],
            ...SEVERITIES.map((s): [string, string] => [s, titleCase(s)]),
          ]}
        />
        <FilterSelect
          label="Usage"
          value={usage}
          onChange={setUsage}
          options={[
            ["", "Any usage"],
            ["decision_input", "Decision input"],
            ["context_only", "Context only"],
          ]}
        />
      </div>
      {events.isLoading && <LoadingState />}
      {events.error && <ErrorState error={events.error} />}
      <div className="event-list event-feed">
        {items.map((e) => (
          <EventCard key={e.id} event={e} />
        ))}
      </div>
      {events.data && !items.length && (
        <EmptyState
          title="No events match"
          description="No recorded event matches these filters."
        />
      )}
      {events.data && events.data.total > events.data.items.length && (
        <p className="section-footnote">
          Showing the latest {events.data.items.length} of {events.data.total} events.
        </p>
      )}
    </>
  );
}

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="assessment-meta">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function EventDetailPage({ id }: { id: string }) {
  const event = useEvent(id);
  const positions = usePositions();
  if (event.isLoading) return <LoadingState />;
  if (event.error) return <ErrorState error={event.error} title="Event not found" />;
  const e = event.data;
  if (!e) return null;
  const tickers = [...new Set(e.affected_companies.flatMap((c) => c.tickers))];
  const held = [
    ...new Set(
      (positions.data?.items ?? []).filter((p) => tickers.includes(p.ticker)).map((p) => p.ticker),
    ),
  ];
  const scores = e.evidence.classification?.scores ?? {};
  return (
    <>
      <div className="backline">
        <Link to="/events">
          <ArrowLeft size={15} /> Events & news
        </Link>
        <span>/</span>
        <span>Event detail</span>
      </div>
      <PageHeader
        eyebrow={`${titleCase(e.category).toUpperCase()} / ${e.severity.toUpperCase()} SEVERITY`}
        title={e.title}
        description={`${e.source_name} · Known ${formatDateTime(e.known_at)}${e.is_mock ? " · MOCK DATA" : ""}`}
      />
      <div className="event-detail-grid">
        <section className="analysis-panel">
          <div className="eyebrow">CURRENT ASSESSMENT</div>
          <p className="large-copy">{e.summary ?? "No summary was extracted from the source."}</p>
          <p>
            Impact direction: <strong>{titleCase(e.impact_direction)}</strong> · time horizon{" "}
            <strong>{titleCase(e.time_horizon)}</strong> · classification confidence{" "}
            <strong>{pct(e.confidence, 0)}</strong>.{" "}
            {e.usage === "decision_input"
              ? "This event is an input to the decision engine, which never acts on an event alone."
              : "This event is context only and is not scored by the decision engine."}
          </p>
          {e.usage_reasons.length > 0 && (
            <p className="muted small">Usage: {e.usage_reasons.join("; ")}.</p>
          )}
          <SectionHeading eyebrow="POTENTIAL EXPOSURE" title="Affected securities" />
          {e.affected_companies.length === 0 ? (
            <p className="muted">No company was matched to this event.</p>
          ) : (
            <div className="ticker-links">
              {e.affected_companies.flatMap((c) =>
                c.tickers.map((t) => (
                  <Button asChild variant="outline" key={t}>
                    <Link to="/stocks/$ticker" params={{ ticker: t }} search={{ focus: "signal" }}>
                      {t} · {pct(c.confidence, 0)} match <ArrowRight size={14} />
                    </Link>
                  </Button>
                )),
              )}
            </div>
          )}
          {e.affected_sectors.length > 0 && (
            <p className="muted small">Sectors: {e.affected_sectors.map(titleCase).join(", ")}</p>
          )}
          <SectionHeading eyebrow="YOUR PORTFOLIO" title="How this affects my holdings" />
          <p>
            {held.length
              ? `${held.join(", ")} ${held.length === 1 ? "is" : "are"} in your open positions. Review the latest stock-level signal before acting.`
              : "None of the affected securities is in your open positions."}
          </p>
          {Object.keys(scores).length > 0 && (
            <>
              <SectionHeading eyebrow="EVIDENCE" title="How it was classified" />
              <p className="muted small">
                Rule scores:{" "}
                {Object.entries(scores)
                  .map(([k, v]) => `${titleCase(k)} ${v}`)
                  .join(", ")}
                {e.evidence.classification?.runner_up
                  ? ` · runner-up ${titleCase(e.evidence.classification.runner_up)}`
                  : ""}
                . Interpreter {e.interpreter} {e.interpreter_version}.
              </p>
            </>
          )}
        </section>
        <aside className="assessment-panel">
          <div className="eyebrow">SOURCE REFERENCE</div>
          <Meta label="Source" value={e.source_name} />
          <Meta label="Kind" value={titleCase(e.kind)} />
          <Meta label="Classification" value={titleCase(e.category)} />
          <Meta label="Verification" value={titleCase(e.verification_status)} />
          <Meta label="Source confidence" value={pct(e.source_confidence, 0)} />
          <Meta label="Corroborations" value={e.corroboration_count} />
          <Meta label="Severity" value={titleCase(e.severity)} />
          <Meta label="Impact" value={titleCase(e.impact_direction)} />
          <Meta label="Published" value={e.published_at ? formatDateTime(e.published_at) : NA} />
          <Meta label="First seen" value={formatDateTime(e.first_seen_at)} />
          {e.regulator && <Meta label="Regulator" value={e.regulator} />}
          {e.indicator && <Meta label="Indicator" value={titleCase(e.indicator)} />}
          <p className="section-footnote">
            <a href={e.document_url} target="_blank" rel="noreferrer">
              Original document <ExternalLink size={12} />
            </a>
          </p>
        </aside>
      </div>
    </>
  );
}
