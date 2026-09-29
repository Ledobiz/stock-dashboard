import { ArrowRight, Database } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { SourceHealth, SourceOut } from "@/lib/api";
import { NA, formatDateTime, timeAgo, titleCase } from "@/lib/format";
import { useReadiness, useSourceRuns, useSources, useStatus } from "@/lib/queries";
import { EmptyState, ErrorState, LoadingState, SectionHeading } from "../market-ui";
import { FilterSelect, PageHeader } from "./common";

// Maps a source's health onto the design's status pill and LED classes.
const PILL: Record<SourceHealth, string> = {
  healthy: "",
  delayed: "delayed",
  stale: "stale",
  failing: "stale",
  never_run: "delayed",
  disabled: "",
};

function led(ok: boolean | null): string {
  return "health-led " + (ok === null ? "warning" : ok ? "" : "danger");
}

function interval(seconds: number | null): string {
  if (!seconds) return NA;
  return seconds >= 3600
    ? `every ${Math.round(seconds / 3600)} h`
    : `every ${Math.round(seconds / 60)} min`;
}

function SourceHistory({ code }: { code: string }) {
  const runs = useSourceRuns(code);
  if (runs.isLoading) return <LoadingState />;
  if (runs.error) return <ErrorState error={runs.error} />;
  const items = runs.data?.items ?? [];
  if (!items.length) return <p className="muted small">This source has never been collected.</p>;
  return (
    <div className="source-history">
      {items.map((r) => (
        <div key={r.id}>
          {formatDateTime(r.started_at)} <strong>{titleCase(r.status)}</strong>
          {typeof r.stats["documents_new"] === "number" &&
            ` · ${r.stats["documents_new"]} new documents`}
          {typeof r.stats["events_recorded"] === "number" &&
            ` · ${r.stats["events_recorded"]} events`}
          {r.error && <p className="negative small">{r.error}</p>}
        </div>
      ))}
    </div>
  );
}

function SourceCard({ source }: { source: SourceOut }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="source-card">
      <div className="flex-between">
        <span className="source-icon">
          <Database size={19} />
        </span>
        <span className={"status-pill " + PILL[source.health]}>{titleCase(source.health)}</span>
      </div>
      <h3>
        {source.name}
        {source.is_mock ? " (mock)" : ""}
      </h3>
      <div className="source-data">
        <span>Collection</span>
        <strong>
          {titleCase(source.collector_kind ?? source.access_method)} ·{" "}
          {interval(source.poll_interval_seconds)}
        </strong>
      </div>
      <div className="source-data">
        <span>Last successful sync</span>
        <strong>{source.last_success_at ? timeAgo(source.last_success_at) : "Never"}</strong>
      </div>
      <div className="source-data">
        <span>Trust</span>
        <strong>
          {titleCase(source.trust_level)}
          {source.is_official ? " · official" : ""}
        </strong>
      </div>
      <div className="source-data">
        <span>Consecutive failures</span>
        <strong>{source.consecutive_failures}</strong>
      </div>
      {source.notes && <p className="muted small">{source.notes}</p>}
      <Button variant="ghost" className="source-link" onClick={() => setOpen((o) => !o)}>
        {open ? "Hide" : "View"} source history <ArrowRight size={14} />
      </Button>
      {open && <SourceHistory code={source.code} />}
    </div>
  );
}

export function SourcesPage() {
  const sources = useSources();
  const readiness = useReadiness();
  const status = useStatus();
  const [show, setShow] = useState("enabled");
  const all = sources.data ?? [];
  const list = all.filter((s) => show === "all" || s.enabled);
  const count = (h: SourceHealth[]) => all.filter((s) => h.includes(s.health)).length;
  const r = readiness.data;
  const s = status.data;
  const checks: [string, boolean | null, string][] = [
    [
      "API backend",
      readiness.error ? false : r ? true : null,
      readiness.error ? "Unreachable" : "Responding",
    ],
    ...Object.entries(r?.checks ?? {}).map(([name, c]): [string, boolean | null, string] => [
      titleCase(name),
      c.status === "ok",
      c.status === "ok"
        ? `OK${c.latency_ms !== null ? ` · ${Math.round(c.latency_ms)} ms` : ""}`
        : (c.detail ?? c.status),
    ]),
    ...(r?.scheduler
      ? [
          [
            "Background workers",
            r.scheduler.status === "ok",
            r.scheduler.last_heartbeat
              ? `Heartbeat ${timeAgo(r.scheduler.last_heartbeat)}`
              : titleCase(r.scheduler.status),
          ] as [string, boolean | null, string],
        ]
      : []),
    ...Object.entries(s?.runs ?? {}).map(([name, run]): [string, boolean | null, string] => [
      `${titleCase(name)} refresh`,
      run ? run.status === "succeeded" : null,
      run
        ? `${titleCase(run.status)} · ${timeAgo(run.finished_at ?? run.started_at)}${run.is_mock ? " · mock" : ""}`
        : "Never run",
    ]),
    ...Object.entries(s?.providers ?? {}).map(
      ([name, provider]): [string, boolean | null, string] => {
        const value = Array.isArray(provider) ? provider.join(", ") : provider;
        return [`${titleCase(name)} provider`, value.includes("mock") ? null : true, value];
      },
    ),
  ];
  return (
    <>
      <PageHeader
        eyebrow="TRANSPARENCY / INPUT HEALTH"
        title="Data sources"
        description="Understand where information comes from and whether it is fresh enough to trust."
        action={
          <FilterSelect
            label="Show"
            value={show}
            onChange={setShow}
            options={[
              ["enabled", "Enabled sources"],
              ["all", "All sources"],
            ]}
          />
        }
      />
      <div className="source-overview">
        <span>
          <span className="health-led" /> {count(["healthy"])} healthy
        </span>
        <span>
          <span className="health-led warning" /> {count(["delayed", "never_run"])} delayed / never
          run
        </span>
        <span>
          <span className="health-led danger" /> {count(["stale", "failing"])} stale / failing
        </span>
        <span className="muted">
          {count(["disabled"])} disabled · checked{" "}
          {sources.dataUpdatedAt ? timeAgo(new Date(sources.dataUpdatedAt).toISOString()) : NA}
        </span>
      </div>
      {sources.isLoading && <LoadingState />}
      {sources.error && <ErrorState error={sources.error} />}
      <div className="source-grid">
        {list.map((x) => (
          <SourceCard key={x.code} source={x} />
        ))}
      </div>
      {sources.data && !list.length && (
        <EmptyState
          title="No enabled sources"
          description="Enable sources through SOURCES_CONFIG_FILE."
        />
      )}
      <section className="section-block">
        <SectionHeading eyebrow="SYSTEM HEALTH" title="Infrastructure checks" />
        <div className="health-grid">
          {checks.map(([name, ok, detail]) => (
            <div key={name}>
              <span className={led(ok)} />
              <strong>{name}</strong>
              <span>{detail}</span>
            </div>
          ))}
        </div>
        <p className="section-footnote">
          From /health/ready and /status. Amber means mock or not yet run; real sources stay
          disabled until their URLs are confirmed on the publisher's site.
        </p>
      </section>
    </>
  );
}
