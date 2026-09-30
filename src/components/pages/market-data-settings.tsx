import { ArrowDown, ArrowUp, Database, X } from "lucide-react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type {
  MarketDataProviderOut,
  MarketDataSettingsIn,
  MarketDataSettingsOut,
  MarketDataValues,
} from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { useMarketDataSettings, useUpdateMarketDataSettings } from "@/lib/queries";
import { ErrorState, LoadingState } from "../market-ui";

// Form fields are strings so a half-typed number is never coerced. "" as the universe means
// "the same as the primary".
type Draft = {
  provider: string;
  universe: string;
  snapshot: string;
  history: string[];
  fallbacks: string[];
  disclosures: boolean;
  stream: boolean;
  requests: string;
  interval: string;
  skip: boolean;
};

function draftOf(data: MarketDataSettingsOut): Draft {
  const e = data.effective;
  return {
    provider: e.provider,
    universe: e.universe_provider ?? "",
    snapshot: e.snapshot_provider,
    history: e.history_providers,
    fallbacks: e.latest_fallback_providers,
    disclosures: e.disclosures_enabled,
    stream: e.stream_enabled,
    requests: String(e.history_requests_per_run),
    interval: String(e.min_request_interval_seconds),
    skip: e.skip_current_history,
  };
}

const sameList = (a: string[], b: string[]) => a.join(",") === b.join(",");

// Only the fields that changed are sent, so an untouched setting keeps following the server's
// environment (and an NGN Market switch left as it was never needs the NGN Market key).
function changesOf(draft: Draft, e: MarketDataValues): MarketDataSettingsIn {
  const body: MarketDataSettingsIn = {};
  if (draft.provider !== e.provider) body.provider = draft.provider;
  if (draft.universe !== (e.universe_provider ?? ""))
    body.universe_provider = draft.universe || null;
  if (draft.snapshot !== e.snapshot_provider) body.snapshot_provider = draft.snapshot;
  if (!sameList(draft.history, e.history_providers)) body.history_providers = draft.history;
  if (!sameList(draft.fallbacks, e.latest_fallback_providers))
    body.latest_fallback_providers = draft.fallbacks;
  if (draft.disclosures !== e.disclosures_enabled) body.disclosures_enabled = draft.disclosures;
  if (draft.stream !== e.stream_enabled) body.stream_enabled = draft.stream;
  const requests = Number(draft.requests);
  if (requests !== e.history_requests_per_run) body.history_requests_per_run = requests;
  const interval = Number(draft.interval);
  if (interval !== e.min_request_interval_seconds) body.min_request_interval_seconds = interval;
  if (draft.skip !== e.skip_current_history) body.skip_current_history = draft.skip;
  return body;
}

function labelOf(providers: MarketDataProviderOut[], code: string | null): string {
  if (code === null) return "None";
  return providers.find((p) => p.code === code)?.label ?? code;
}

function RoleField({
  label,
  inUse,
  onReset,
  children,
}: {
  label: string;
  inUse?: string | undefined;
  onReset?: (() => void) | undefined;
  children: ReactNode;
}) {
  return (
    <div className="field-label">
      <span className="flex-between">
        {label}
        {onReset && (
          <Button type="button" variant="link" size="sm" className="source-link" onClick={onReset}>
            Use server value
          </Button>
        )}
      </span>
      {children}
      {inUse !== undefined && <small className="muted">In use now: {inUse}</small>}
    </div>
  );
}

// An ordered provider chain: asked first to last. Only providers that can serve the role and have
// their key set can be added.
function ChainEditor({
  value,
  candidates,
  providers,
  emptyText,
  onChange,
}: {
  value: string[];
  candidates: MarketDataProviderOut[];
  providers: MarketDataProviderOut[];
  emptyText: string;
  onChange: (next: string[]) => void;
}) {
  const move = (index: number, by: number) => {
    const next = [...value];
    const [item] = next.splice(index, 1);
    if (item === undefined) return;
    next.splice(index + by, 0, item);
    onChange(next);
  };
  const addable = candidates.filter((p) => p.selectable && !value.includes(p.code));
  return (
    <div>
      {value.length === 0 && <p className="muted small">{emptyText}</p>}
      {value.map((code, index) => (
        <div className="source-data" key={code}>
          <span>
            {index + 1}. {labelOf(providers, code)}
            {providers.find((p) => p.code === code)?.selectable === false && " (unavailable)"}
          </span>
          <span className="row-actions">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Move up"
              disabled={index === 0}
              onClick={() => move(index, -1)}
            >
              <ArrowUp size={13} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Move down"
              disabled={index === value.length - 1}
              onClick={() => move(index, 1)}
            >
              <ArrowDown size={13} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Remove"
              onClick={() => onChange(value.filter((c) => c !== code))}
            >
              <X size={13} />
            </Button>
          </span>
        </div>
      ))}
      {addable.length > 0 && (
        <div className="inline-add">
          <select
            value=""
            onChange={(e) => e.target.value && onChange([...value, e.target.value])}
            aria-label="Add a provider"
          >
            <option value="">Add a provider…</option>
            {addable.map((p) => (
              <option key={p.code} value={p.code}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
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
  const { providers, roles } = data;
  const serving = (role: string) => providers.filter((p) => p.roles.includes(role));
  const ngn = providers.find((p) => p.code === "ngn_market");
  const ngnUsable = ngn?.selectable ?? false;
  const requests = Number(draft.requests);
  const interval = Number(draft.interval);
  const valid =
    draft.requests.trim() !== "" &&
    draft.interval.trim() !== "" &&
    Number.isInteger(requests) &&
    requests >= 0 &&
    Number.isFinite(interval) &&
    interval >= 0;
  const chosen = providers.find((p) => p.code === draft.provider);
  const changes = changesOf(draft, data.effective);
  const changed = Object.keys(changes).length > 0;
  const overridden = (field: keyof MarketDataValues) => data.overridden.includes(field);
  const save = (body: MarketDataSettingsIn) => {
    setSaved(false);
    update.mutate(body, { onSuccess: () => setSaved(true) });
  };
  const reset = (field: keyof MarketDataValues) =>
    overridden(field) ? () => save({ [field]: null }) : undefined;
  const submit = (e: FormEvent) => {
    e.preventDefault();
    save(changes);
  };
  const useEnvironment = () =>
    save(Object.fromEntries(data.overridden.map((field) => [field, null])));
  const option = (p: MarketDataProviderOut, current: string) => (
    <option key={p.code} value={p.code} disabled={!p.selectable && p.code !== current}>
      {p.label}
      {p.selectable ? "" : " (unavailable)"}
    </option>
  );
  return (
    <form className="settings-panel" onSubmit={submit}>
      <div className="eyebrow">DATA PROVIDERS</div>
      <h2>Market data</h2>
      <p className="muted small">
        Each kind of data has its own provider. A provider can be chosen only when its API key is
        set on the server; one that becomes unusable is skipped, never replaced with made-up data.
      </p>

      <RoleField
        label="Latest prices (primary)"
        inUse={labelOf(providers, roles.latest)}
        onReset={reset("provider")}
      >
        <select value={draft.provider} onChange={(e) => set("provider", e.target.value)}>
          {serving("latest").map((p) => option(p, data.effective.provider))}
        </select>
      </RoleField>
      {chosen && !chosen.selectable && chosen.note && (
        <p className="negative small">{chosen.note}</p>
      )}

      <RoleField
        label="Security universe (the list of listed securities)"
        inUse={labelOf(providers, roles.universe)}
        onReset={reset("universe_provider")}
      >
        <select value={draft.universe} onChange={(e) => set("universe", e.target.value)}>
          <option value="">Same as the primary</option>
          {serving("universe").map((p) => option(p, data.effective.universe_provider ?? ""))}
        </select>
      </RoleField>

      <RoleField
        label="Market snapshot (index, breadth, turnover)"
        inUse={labelOf(providers, roles.snapshot)}
        onReset={reset("snapshot_provider")}
      >
        <select value={draft.snapshot} onChange={(e) => set("snapshot", e.target.value)}>
          <option value="none">None</option>
          {serving("snapshot").map((p) => option(p, data.effective.snapshot_provider))}
        </select>
      </RoleField>

      <RoleField
        label="Daily history, asked in order"
        inUse={roles.history.map((c) => labelOf(providers, c)).join(" → ")}
        onReset={reset("history_providers")}
      >
        <ChainEditor
          value={draft.history}
          candidates={serving("history")}
          providers={providers}
          emptyText="None: the primary serves history alone."
          onChange={(next) => set("history", next)}
        />
      </RoleField>

      <RoleField
        label="Latest-price fallbacks, asked in order"
        inUse={
          roles.latest_fallbacks.length
            ? roles.latest_fallbacks.map((c) => labelOf(providers, c)).join(" → ")
            : "None"
        }
        onReset={reset("latest_fallback_providers")}
      >
        <ChainEditor
          value={draft.fallbacks}
          candidates={serving("latest_fallback").filter((p) => p.code !== draft.provider)}
          providers={providers}
          emptyText="None: a security the primary has no price for stays unavailable."
          onChange={(next) => set("fallbacks", next)}
        />
      </RoleField>

      <label className="toggle-row">
        <span>
          <strong>NGN Market disclosure discovery</strong>
          <small>
            Finds new filings sooner; NGX's own filing stays authoritative.
            {ngnUsable ? "" : " Needs NGNMARKET_API_KEY on the server."}
            {overridden("disclosures_enabled") ? " Saved here." : ""}
          </small>
        </span>
        <input
          type="checkbox"
          checked={draft.disclosures}
          disabled={!ngnUsable && !draft.disclosures}
          onChange={(e) => set("disclosures", e.target.checked)}
        />
      </label>
      <label className="toggle-row">
        <span>
          <strong>NGN Market live price stream</strong>
          <small>
            Held and watched securities in market hours. The stream process must be running on the
            server (COMPOSE_PROFILES=stream).
            {ngnUsable ? "" : " Needs NGNMARKET_API_KEY on the server."}
            {overridden("stream_enabled") ? " Saved here." : ""}
          </small>
        </span>
        <input
          type="checkbox"
          checked={draft.stream}
          disabled={!ngnUsable && !draft.stream}
          onChange={(e) => set("stream", e.target.checked)}
        />
      </label>

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

      {providers.map((p) => (
        <div className="source-data" key={p.code}>
          <span>{p.label}</span>
          <strong>
            {p.key_name === null
              ? "Placeholder"
              : p.key_configured
                ? p.selectable
                  ? "API key set on the server"
                  : (p.note ?? "Unavailable")
                : `Set ${p.key_name} on the server`}
          </strong>
        </div>
      ))}
      {draft.provider !== data.effective.provider && (
        <p className="muted small">
          The next refresh uses {chosen?.label ?? draft.provider}. Bars already stored are kept, and
          each provider's own ranges can differ slightly, so avoid switching back and forth.
        </p>
      )}
      <Button
        type="submit"
        disabled={update.isPending || !valid || !changed || !!(chosen && !chosen.selectable)}
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
          Reset all to the server's values
        </Button>
      )}
      {saved && <p className="positive small">Saved. It applies to the next refresh.</p>}
      {update.error && <p className="negative small">{update.error.message}</p>}
      {data.warning && <p className="negative small">{data.warning}</p>}
      <p className="section-footnote">
        {data.overridden.length > 0
          ? `Saved here: ${data.overridden.join(", ").replaceAll("_", " ")}${
              data.updated_at ? ` (${formatDateTime(data.updated_at)})` : ""
            }. Everything else follows the server's environment.`
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
      <div className="eyebrow">DATA PROVIDERS</div>
      <h2>Market data</h2>
      {settings.error ? <ErrorState error={settings.error} /> : <LoadingState />}
    </section>
  );
}
