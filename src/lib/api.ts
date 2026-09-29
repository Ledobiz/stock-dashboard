// HTTP client and response types for the FastAPI backend (backend/app/api).
// Decimals arrive as strings and are converted with `num`; null always means "unavailable" and is
// shown as such, never replaced with a guess.

const DEFAULT_API_URL = "http://127.0.0.1:8088";
const TOKEN_KEY = "eko.apiToken";

export const API_URL = (
  (import.meta.env["VITE_API_URL"] as string | undefined) || DEFAULT_API_URL
).replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body: unknown = null,
  ) {
    super(message);
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

type Params = Record<string, string | number | boolean | null | undefined | (string | number)[]>;

function query(params?: Params): string {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) value.forEach((v) => search.append(key, String(v)));
    else search.append(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : "";
}

function detail(body: unknown, fallback: string): string {
  if (body && typeof body === "object" && "detail" in body) {
    const d = (body as { detail: unknown }).detail;
    if (typeof d === "string") return d;
    if (Array.isArray(d))
      return d
        .map((x) => (x && typeof x === "object" && "msg" in x ? String(x.msg) : String(x)))
        .join("; ");
  }
  return fallback;
}

export async function request<T>(
  method: string,
  path: string,
  options: {
    params?: Params | undefined;
    body?: unknown;
    token?: string | null | undefined;
    root?: boolean | undefined;
  } = {},
): Promise<T> {
  const token = options.token === undefined ? getToken() : options.token;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  const url = `${API_URL}${options.root ? "" : "/api/v1"}${path}${query(options.params)}`;
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: options.body === undefined ? null : JSON.stringify(options.body),
    });
  } catch {
    throw new ApiError(0, `The API at ${API_URL} is unreachable`);
  }
  const text = await response.text();
  const body: unknown = text ? JSON.parse(text) : null;
  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new Event("eko:unauthorized"));
    }
    throw new ApiError(
      response.status,
      detail(body, `${response.status} ${response.statusText}`),
      body,
    );
  }
  return body as T;
}

export const api = {
  get: <T>(path: string, params?: Params) => request<T>("GET", path, { params }),
  post: <T>(path: string, body?: unknown, params?: Params) =>
    request<T>("POST", path, { body, params }),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, { body }),
  delete: <T>(path: string, params?: Params) => request<T>("DELETE", path, { params }),
};

// --- value helpers ------------------------------------------------------------------------

export type Dec = string | number | null | undefined;

export function num(value: Dec): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

// --- shared -------------------------------------------------------------------------------

export type ApiAction = "BUY" | "BUY_MORE" | "HOLD" | "WATCH" | "SELL" | "URGENT_RISK";
export type ApiHorizon = "1w" | "1m" | "3m";
export type Page<T> = { items: T[]; total: number; limit: number; offset: number };

export type SecurityOut = {
  id: string;
  ticker: string;
  exchange: string;
  company_id: string;
  company_name: string;
  sector: string | null;
  industry: string | null;
  isin: string | null;
  security_type: string;
  board: string | null;
  status: string;
  currency: string;
  listing_date: string | null;
  delisting_date: string | null;
};

// --- signals ------------------------------------------------------------------------------

export type ComponentName = "technical" | "fundamental" | "liquidity" | "event" | "macro" | "risk";

export type SignalComponentOut = {
  component: ComponentName;
  is_available: boolean;
  score: Dec;
  signed_score: Dec;
  weight: Dec;
  contribution: Dec;
  confidence: Dec;
  explanation: string | null;
};

export type SignalOut = {
  signal_id: string;
  decision_id: string | null;
  ticker: string;
  exchange: string;
  company_name: string;
  sector: string | null;
  horizon: ApiHorizon;
  action: ApiAction;
  previous_action: ApiAction | null;
  is_state_change: boolean | null;
  is_owned: boolean;
  overall_score: Dec;
  signed_score: Dec;
  confidence: Dec;
  coverage: Dec;
  components: SignalComponentOut[];
  explanation: string | null;
  supporting_factors: string[];
  risk_factors: string[];
  data_quality_warnings: string[];
  source_references: Record<string, unknown>[];
  as_of: string;
  generated_at: string;
  decided_at: string | null;
  strategy_version: string;
  is_mock: boolean;
};

export type SignalExplanationOut = {
  signal: SignalOut;
  base_action: ApiAction | null;
  rules_applied: { code: string; message: string; before?: string; after?: string }[];
  components: (SignalComponentOut & {
    supporting?: string[];
    risks?: string[];
    warnings?: string[];
  })[];
  previous_decision: { decided_at?: string; action?: ApiAction } | null;
  parameters: Record<string, unknown>;
  disclaimer: string;
};

export type SignalConfigOut = {
  strategy_version: string;
  engine_version: string;
  horizons: Record<string, unknown>;
  scoring: Record<string, unknown>;
  overrides: Record<string, unknown>;
};

// --- auth ---------------------------------------------------------------------------------

export type AuthCheckOut = {
  authenticated: boolean;
  // False only in development with no account and no API_TOKEN: the API is open.
  auth_required: boolean;
  method: "session" | "api_token" | "open";
  email: string | null;
};

export type LoginOut = { token: string; expires_at: string; email: string };

// --- workspace ----------------------------------------------------------------------------

export type PriceSummaryOut = {
  price: Dec;
  change: Dec;
  change_pct: Dec;
  trading_date: string;
  as_of: string;
  kind: "quote" | "close";
  provider: string;
  is_stale: boolean;
  is_mock: boolean;
};

export type EventRefOut = {
  id: string;
  kind: string;
  category: string;
  title: string;
  known_at: string;
  severity: string;
  impact_direction: string;
  usage: string;
  is_mock: boolean;
};

export type SecurityOverviewOut = {
  security: SecurityOut;
  price: PriceSummaryOut | null;
  signals: SignalOut[];
  latest_event: EventRefOut | null;
  is_watched: boolean;
  is_held: boolean;
  is_mock: boolean;
};

export type OverviewOut = { as_of: string; items: SecurityOverviewOut[] };

export type RunRefOut = {
  status: string;
  started_at: string;
  finished_at: string | null;
  error: string | null;
  is_mock: boolean;
};

export type StatusOut = {
  as_of: string;
  environment: string;
  market: {
    timezone: string;
    today: string;
    is_trading_day: boolean;
    is_open: boolean;
    open_time: string;
    close_time: string;
    last_completed_session: string | null;
  };
  providers: Record<string, string | string[]>;
  latest_quote_at: string | null;
  latest_bar_date: string | null;
  latest_signal_at: string | null;
  runs: Record<string, RunRefOut | null>;
  latest_scan: {
    id: string;
    as_of: string;
    status: string;
    finished_at: string | null;
    is_mock: boolean;
  } | null;
  signal_changes_24h: number;
  notifications_sent_24h: number;
  uses_mock_data: boolean;
};

export type WatchlistOut = {
  name: string;
  items: {
    ticker: string;
    exchange: string;
    company_name: string;
    sector: string | null;
    added_at: string;
    notes: string | null;
  }[];
};

export type WorkspacePreferencesOut = {
  default_horizon: ApiHorizon;
  theme: "dark" | "light";
  updated_at: string | null;
};

export type SeriesOut = {
  ticker: string;
  exchange: string;
  start: string;
  end: string;
  indicators: string[];
  points: {
    trading_date: string;
    open: number | null;
    high: number | null;
    low: number | null;
    close: number | null;
    volume: number | null;
    indicators: Record<string, number | null>;
  }[];
  is_mock: boolean;
};

// --- analysis -----------------------------------------------------------------------------

// Names match backend TECHNICAL_METRICS / LIQUIDITY_METRICS and the per-horizon windows.
export type TechnicalMetric =
  | "close"
  | "return_1d"
  | "period_return"
  | "sma_fast"
  | "sma_slow"
  | "close_vs_sma_fast"
  | "close_vs_sma_slow"
  | "sma_fast_vs_slow"
  | "ema"
  | "close_vs_ema"
  | "rsi"
  | "macd"
  | "macd_signal"
  | "macd_histogram"
  | "atr"
  | "atr_pct"
  | "volatility"
  | "momentum"
  | "volume_average"
  | "relative_volume"
  | "volume_change"
  | "drawdown"
  | "max_drawdown"
  | "range_high"
  | "range_low"
  | "range_position"
  | "range_from_high";
export type LiquidityMetric =
  | "average_daily_volume"
  | "median_daily_volume"
  | "average_daily_value"
  | "average_trades"
  | "trading_frequency"
  | "bar_coverage"
  | "volume_cv";
export type AnalysisParam =
  | "return_window"
  | "sma_fast"
  | "sma_slow"
  | "ema"
  | "rsi"
  | "macd_fast"
  | "macd_slow"
  | "macd_signal"
  | "atr"
  | "volatility"
  | "momentum"
  | "volume_average"
  | "drawdown"
  | "liquidity";

export type AnalysisHorizonOut = {
  horizon: ApiHorizon;
  technical: {
    last_bar_date: string | null;
    stale_sessions: number | null;
    bars_used: number;
    range_sessions: number;
    params: Partial<Record<AnalysisParam, number>>;
    metrics: Partial<Record<TechnicalMetric, Dec>>;
    unavailable: string[];
  };
  liquidity: {
    window_start: string | null;
    sessions_expected: number;
    sessions_with_bar: number;
    sessions_traded: number;
    zero_volume_sessions: number;
    missing_sessions: number;
    value_estimated_sessions: number;
    metrics: Partial<Record<LiquidityMetric, Dec>>;
    unavailable: string[];
    position: {
      quantity: Dec;
      volume_ratio: Dec;
      days_to_exit: Dec;
      max_participation_pct: Dec;
    } | null;
  };
};

export type AnalysisOut = {
  security: SecurityOut;
  as_of_date: string;
  data_status: string;
  analysis_version: string;
  horizons: AnalysisHorizonOut[];
  is_mock: boolean;
};

// --- fundamentals -------------------------------------------------------------------------

export type MetricValueOut = {
  code: string;
  category: string;
  status: "available" | "unavailable" | "not_applicable";
  value: Dec;
  origin: string | null;
  formula: string | null;
  inputs: Record<string, unknown>;
  note: string | null;
};

export type FundamentalPeriodOut = {
  period_type: string;
  fiscal_year: number;
  period_start: string | null;
  period_end: string;
  months: number;
  basis: string;
  currency: string;
  is_audited: boolean | null;
  is_mock: boolean;
  provenance: {
    source: string;
    source_url: string | null;
    published_on: string | null;
    retrieved_at: string | null;
  };
  metrics: Record<string, MetricValueOut>;
};

export type FundamentalsOut = {
  security: SecurityOut;
  as_of: string;
  profile: { profile: string; top_line: string; not_applicable: string[]; note: string | null };
  is_mock: boolean;
  periods: FundamentalPeriodOut[];
  valuation: {
    price: { close: Dec; trading_date: string; source: string; is_mock: boolean } | null;
    notes: string[];
    metrics: Record<string, MetricValueOut>;
  } | null;
  recent_dividends: {
    id: string;
    dividend_type: string;
    fiscal_year: number | null;
    amount_per_share: Dec;
    currency: string;
    declared_on: string;
  }[];
};

// --- events and sources -------------------------------------------------------------------

export type EventOut = {
  id: string;
  kind: "corporate" | "regulatory" | "macroeconomic";
  category: string;
  title: string;
  summary: string | null;
  published_at: string | null;
  first_seen_at: string;
  known_at: string;
  impact_direction: string;
  severity: string;
  confidence: Dec;
  time_horizon: string | null;
  source_confidence: Dec;
  affected_companies: {
    company_id: string;
    company_name: string;
    tickers: string[];
    match_method: string;
    confidence: Dec;
  }[];
  affected_sectors: string[];
  verification_status: string;
  corroboration_count: number;
  usage: string;
  usage_reasons: string[];
  regulator: string | null;
  indicator: string | null;
  source_code: string;
  source_name: string;
  document_id: string;
  document_url: string;
  news_article_id: string | null;
  interpreter: string;
  interpreter_version: string;
  is_mock: boolean;
};

export type EventDetailOut = EventOut & {
  // How the deterministic rules classified the document: cues, scores and matched companies.
  evidence: {
    companies?: { method: string; company: string; matched: string; confidence: Dec }[];
    classification?: { scores?: Record<string, number>; runner_up?: string | null };
    corroborated_by?: unknown[];
    [key: string]: unknown;
  };
};

export type SourceHealth = "healthy" | "delayed" | "stale" | "failing" | "never_run" | "disabled";

export type SourceOut = {
  code: string;
  name: string;
  category: string;
  access_method: string;
  trust_level: string;
  is_official: boolean;
  priority: number;
  base_url: string | null;
  official_domains: string[];
  enabled: boolean;
  collector_kind: string | null;
  collector_url: string | null;
  poll_interval_seconds: number | null;
  last_polled_at: string | null;
  last_success_at: string | null;
  consecutive_failures: number;
  is_mock: boolean;
  notes: string | null;
  last_run: SourceRunOut | null;
  health: SourceHealth;
};

export type SourceRunOut = {
  id: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  triggered_by: string | null;
  error: string | null;
  stats: Record<string, unknown>;
};

export type ReadinessOut = {
  status: string;
  checks: Record<string, { status: string; latency_ms: number | null; detail: string | null }>;
  scheduler?: { status: string; last_heartbeat: string | null };
};

// --- macro --------------------------------------------------------------------------------

export type MacroIndicatorOut = {
  code: string;
  name: string;
  category: string;
  unit: string;
  frequency: string;
  publisher: string | null;
  description: string | null;
  max_age_days: number | null;
  is_step: boolean;
  latest: {
    observation_date: string;
    value: Dec;
    source: string;
    published_on: string | null;
    available_on: string | null;
    is_mock: boolean;
  } | null;
};

export type MacroObservationOut = {
  id: string;
  indicator: string;
  observation_date: string;
  value: Dec;
  unit: string;
  source: string;
  source_url: string | null;
  retrieved_at: string | null;
  published_on: string | null;
  available_on: string | null;
  is_mock: boolean;
};

export type MacroDriverOut = {
  factor: string;
  weight: number;
  status: string;
  raw: number | null;
  score: number | null;
  reason: string | null;
  description: string;
};

export type MacroSnapshotOut = {
  as_of_date: string;
  stance: "supportive" | "neutral" | "restrictive" | "insufficient_data";
  score: Dec;
  confidence: Dec;
  coverage: Dec;
  is_mixed: boolean;
  factors: Record<
    string,
    {
      weight: number;
      score: number | null;
      coverage: number;
      drivers: Record<string, MacroDriverOut>;
    }
  >;
  notes: string[];
  model_version: string;
  is_mock: boolean;
  sectors: {
    sector: string;
    stance: string;
    score: Dec;
    confidence: Dec;
    coverage: Dec;
    is_mixed: boolean;
  }[];
};

// --- portfolio ----------------------------------------------------------------------------

export type ThesisStatus = "strengthened" | "intact" | "weakened" | "invalidated";

export type PositionOut = {
  id: string;
  ticker: string;
  exchange: string;
  company_name: string;
  sector: string | null;
  currency: string;
  status: "open" | "closed";
  entry_date: string;
  entry_price: Dec;
  quantity: Dec;
  fees: Dec;
  capital_committed: Dec;
  target_horizon: ApiHorizon;
  initial_signal_id: string | null;
  initial_action: ApiAction | null;
  initial_score: Dec;
  investment_thesis: string | null;
  notes: string | null;
  valuation: {
    as_of: string;
    quantity: Dec;
    entry_price: Dec;
    fees: Dec;
    cost_basis: Dec;
    price: {
      price: Dec;
      as_of: string;
      trading_date: string;
      kind: string;
      source: string;
      is_mock: boolean;
    } | null;
    market_value: Dec;
    unrealised_pnl: Dec;
    unrealised_pnl_pct: Dec;
    price_return_pct: Dec;
    warnings: string[];
  } | null;
  realised: Record<string, unknown> | null;
  thesis_status: ThesisStatus | null;
  last_reviewed_at: string | null;
  created_at: string;
};

export type PositionSnapshotOut = {
  as_of: string;
  action: ApiAction | null;
  signed_score: Dec;
  confidence: Dec;
  thesis_status: ThesisStatus | null;
  thesis_reasons: { code: string; status: ThesisStatus | null; message: string }[];
};

export type PositionDetailOut = PositionOut & {
  entry_snapshot: Record<string, unknown>;
  latest_snapshot: PositionSnapshotOut | null;
  disclaimer: string;
};

export type PortfolioSummaryOut = {
  as_of: string;
  currency: string | null;
  open_positions: number;
  priced_positions: number;
  is_complete: boolean;
  cost_basis: Dec;
  priced_cost_basis: Dec;
  market_value: Dec;
  unrealised_pnl: Dec;
  unrealised_pnl_pct: Dec;
  closed_positions: number;
  realised_pnl: Dec;
  thesis_status_counts: Record<string, number>;
  allocations: { position_id: string; ticker: string; market_value: Dec; weight: Dec }[];
  is_mock: boolean;
  warnings: string[];
  disclaimer: string;
};

export type PositionIn = {
  ticker: string;
  quantity: string;
  entry_price: string;
  entry_date: string;
  target_horizon: ApiHorizon;
  fees?: string | undefined;
  notes?: string | null | undefined;
  thesis?: string | null | undefined;
};

// --- notifications ------------------------------------------------------------------------

export type NotificationOut = {
  id: string;
  kind: string;
  ticker: string | null;
  action: ApiAction | null;
  horizons: ApiHorizon[];
  priority: string;
  status: string;
  suppressed_reason: string | null;
  title: string;
  body: string;
  is_mock: boolean;
  created_at: string;
  sent_at: string | null;
  deliveries: { channel: string; provider: string; status: string; last_error: string | null }[];
};

export type NotificationPreferencesOut = {
  enabled: boolean;
  mode: "push" | "email" | "both";
  email_address: string | null;
  email_name: string | null;
  push_external_id: string | null;
  actions: ApiAction[];
  horizons: ApiHorizon[];
  push_min_priority: string;
  email_min_priority: string;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  urgent_bypass_quiet_hours: boolean;
  updated_at: string;
};

export type NotificationConfigOut = {
  enabled: boolean;
  channels: { channel: string; provider: string; enabled: boolean; is_mock: boolean }[];
  onesignal_app_id: string | null;
  dispatch_seconds: number;
  cooldown_minutes: number;
  urgent_cooldown_minutes: number;
};

export type MarketDataProviderOut = {
  code: string;
  label: string;
  key_name: string | null;
  key_configured: boolean;
  selectable: boolean;
  note: string | null;
};

export type MarketDataValues = {
  provider: string;
  history_requests_per_run: number;
  min_request_interval_seconds: number;
  skip_current_history: boolean;
};

export type MarketDataSettingsOut = {
  effective: MarketDataValues;
  environment: MarketDataValues;
  overridden: (keyof MarketDataValues)[];
  providers: MarketDataProviderOut[];
  warning: string | null;
  updated_at: string | null;
};

// null clears a saved value, so the server environment's applies again.
export type MarketDataSettingsIn = {
  [K in keyof MarketDataValues]?: MarketDataValues[K] | null;
};

// --- scanner ------------------------------------------------------------------------------

export type ScanOut = {
  id: string;
  as_of: string;
  as_of_date: string;
  started_at: string;
  finished_at: string | null;
  status: string;
  strategy_version: string;
  scanner_version: string;
  stats: Record<string, unknown>;
  error: string | null;
  is_mock: boolean;
};

export type ScanResultOut = {
  id: string;
  ticker: string;
  exchange: string;
  company_name: string;
  sector: string | null;
  horizon: ApiHorizon;
  outcome: "candidate" | "screened_out" | "excluded" | "failed";
  rank: number | null;
  action: ApiAction | null;
  overall_score: Dec;
  confidence: Dec;
  rationale: string | null;
  reasons: { code?: string; message?: string }[];
  is_mock: boolean;
};

export type CandidatesOut = Page<ScanResultOut> & { scan: ScanOut; disclaimer: string };

export type ScannerConfigOut = {
  scanner_version: string;
  strategy_version: string;
  interval_seconds?: number;
  [key: string]: unknown;
};

// --- backtests ----------------------------------------------------------------------------

export type BacktestStatus = "queued" | "running" | "succeeded" | "failed";

export type BacktestRunOut = {
  id: string;
  name: string | null;
  strategy: string;
  strategy_version: string;
  status: BacktestStatus;
  triggered_by: string | null;
  start_date: string;
  end_date: string;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  horizons: ApiHorizon[];
  tickers: string[];
  summary: Record<string, number | null> | null;
  error: string | null;
  is_mock: boolean;
};

export type BacktestMetrics = Record<string, number | null | Record<string, number>>;

export type BacktestRunDetailOut = BacktestRunOut & {
  parameters: { backtest?: { starting_capital?: number } } & Record<string, unknown>;
  metrics: {
    overall?: BacktestMetrics;
    by_horizon?: Record<string, BacktestMetrics>;
    by_year?: Record<string, BacktestMetrics>;
    by_sector?: Record<string, BacktestMetrics>;
  };
  disclaimer: string;
};

export type BacktestTradeOut = {
  id: string;
  horizon: ApiHorizon;
  ticker: string;
  sector: string | null;
  entry_decided_on: string;
  entry_date: string;
  entry_price: Dec;
  quantity: Dec;
  entry_value: Dec;
  entry_fees: Dec;
  exit_decided_on: string | null;
  exit_date: string;
  exit_price: Dec;
  exit_value: Dec;
  exit_fees: Dec;
  slippage_cost: Dec;
  net_pnl: Dec;
  return_pct: Dec;
  holding_days: number;
  exit_reason: string;
  exit_fills: number;
  notes: unknown[];
  is_mock: boolean;
};

export type BacktestEquityOut = {
  run_id: string;
  starting_capital: number;
  horizons: Record<
    string,
    { day: string; cash: Dec; market_value: Dec; equity: Dec; positions: number }[]
  >;
};

export type BacktestConfigOut = {
  backtest_version: string;
  strategy_version: string;
  params: Record<string, unknown> & { starting_capital?: number };
  max_days: number;
};

export type BacktestIn = {
  start: string;
  end: string;
  horizons?: ApiHorizon[];
  tickers?: string[];
  name?: string | null;
};
