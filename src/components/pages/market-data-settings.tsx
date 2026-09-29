import { Database } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import type { MarketDataSettingsOut } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { useMarketDataSettings, useUpdateMarketDataSettings } from "@/lib/queries";
import { ErrorState, LoadingState } from "../market-ui";

// Form fields are strings so a half-typed number is never coerced.
type Draft = { provider: string; requests: string; interval: string; skip: boolean };

function draftOf(data: MarketDataSettingsOut): Draft {
  return {
    provider: data.effective.provider,
    requests: String(data.effective.history_requests_per_run),
    interval: String(data.effective.min_request_interval_seconds),
    skip: data.effective.skip_current_history,
  };
}

function MarketDataForm({ data }: { data: MarketDataSettingsOut }) {
  const update = useUpdateMarketDataSettings();
  const [draft, setDraft] = useState(draftOf(data));
  const [saved, setSaved] = useState(false);
  useEffect(() => setDraft(draftOf(data)), [data]);
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setSaved(false);
    setDraft((d) => ({ ...d, [key]: value }));
  };
  const requests = Number(draft.requests);
  const interval = Number(draft.interval);
  const valid =
    draft.requests.trim() !== "" &&
    draft.interval.trim() !== "" &&
    Number.isInteger(requests) &&
    requests >= 0 &&
    Number.isFinite(interval) &&
    interval >= 0;
  const chosen = data.providers.find((p) => p.code === draft.provider);
  const switching = draft.provider !== data.effective.provider;
  const submit = (e: FormEvent) => {
    e.preventDefault();
    update.mutate(
      {
        provider: draft.provider,
        history_requests_per_run: requests,
        min_request_interval_seconds: interval,
        skip_current_history: draft.skip,
      },
      { onSuccess: () => setSaved(true) },
    );
  };
  const useEnvironment = () => {
    setSaved(false);
    update.mutate(
      {
        provider: null,
        history_requests_per_run: null,
        min_request_interval_seconds: null,
        skip_current_history: null,
      },
      { onSuccess: () => setSaved(true) },
    );
  };
  return (
    <form className="settings-panel" onSubmit={submit}>
      <div className="eyebrow">DATA PROVIDER</div>
      <h2>Market data</h2>
      <label className="field-label">
        Provider
        <select value={draft.provider} onChange={(e) => set("provider", e.target.value)}>
          {data.providers.map((p) => (
            <option
              key={p.code}
              value={p.code}
              disabled={!p.selectable && p.code !== data.effective.provider}
            >
              {p.label}
              {p.selectable ? "" : " (unavailable)"}
            </option>
          ))}
        </select>
      </label>
      {data.providers.map((p) => (
        <div className="source-data" key={p.code}>
          <span>{p.label}</span>
          <strong>
            {p.key_name === null
              ? "Placeholder"
              : p.key_configured
                ? "API key set on the server"
                : `Set ${p.key_name} on the server`}
          </strong>
        </div>
      ))}
      {chosen && !chosen.selectable && chosen.note && (
        <p className="negative small">{chosen.note}</p>
      )}
      {switching && (
        <p className="muted small">
          The next refresh uses {chosen?.label ?? draft.provider}. Bars already stored are kept, and
          each provider's own ranges can differ slightly, so avoid switching back and forth.
        </p>
      )}
      <label className="field-label">
        History requests per refresh (0 = no limit)
        <input
          type="number"
          min={0}
          step={1}
          value={draft.requests}
          onChange={(e) => set("requests", e.target.value)}
        />
      </label>
      <label className="field-label">
        Seconds between requests
        <input
          type="number"
          min={0}
          step={0.1}
          value={draft.interval}
          onChange={(e) => set("interval", e.target.value)}
        />
      </label>
      <label className="toggle-row">
        <span>
          <strong>Skip securities that are up to date</strong>
          <small>Saves requests on metered plans</small>
        </span>
        <input
          type="checkbox"
          checked={draft.skip}
          onChange={(e) => set("skip", e.target.checked)}
        />
      </label>
      <Button
        type="submit"
        disabled={update.isPending || !valid || !!(chosen && !chosen.selectable)}
      >
        <Database size={15} /> {update.isPending ? "Saving…" : "Save market data settings"}
      </Button>
      {data.overridden.length > 0 && (
        <Button
          type="button"
          variant="outline"
          disabled={update.isPending}
          onClick={useEnvironment}
        >
          Reset to the server's values
        </Button>
      )}
      {saved && <p className="positive small">Saved. It applies to the next refresh.</p>}
      {update.error && <p className="negative small">{update.error.message}</p>}
      {data.warning && <p className="negative small">{data.warning}</p>}
      <p className="section-footnote">
        {data.overridden.length > 0
          ? `Saved here: ${data.overridden.join(", ").replaceAll("_", " ")}${
              data.updated_at ? ` (${formatDateTime(data.updated_at)})` : ""
            }. The server's environment says ${data.environment.provider}.`
          : "Using the server's environment values."}{" "}
        API keys are set in the server environment and are never shown or stored here.
      </p>
    </form>
  );
}

export function MarketDataSettings() {
  const settings = useMarketDataSettings();
  if (settings.data) return <MarketDataForm data={settings.data} />;
  return (
    <section className="settings-panel">
      <div className="eyebrow">DATA PROVIDER</div>
      <h2>Market data</h2>
      {settings.error ? <ErrorState error={settings.error} /> : <LoadingState />}
    </section>
  );
}
