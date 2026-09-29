// React Query hooks over the backend API. Every screen reads through these.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  api,
  ApiError,
  request,
  setToken,
  type AuthCheckOut,
  type LoginOut,
  type AnalysisOut,
  type BacktestConfigOut,
  type ApiAction,
  type ApiHorizon,
  type BacktestEquityOut,
  type BacktestIn,
  type BacktestRunDetailOut,
  type BacktestRunOut,
  type BacktestTradeOut,
  type EventDetailOut,
  type EventOut,
  type FundamentalsOut,
  type MacroIndicatorOut,
  type MacroObservationOut,
  type MacroSnapshotOut,
  type NotificationConfigOut,
  type NotificationOut,
  type NotificationPreferencesOut,
  type OverviewOut,
  type Page,
  type PortfolioSummaryOut,
  type PositionDetailOut,
  type PositionIn,
  type PositionOut,
  type ReadinessOut,
  type ScanOut,
  type ScannerConfigOut,
  type SeriesOut,
  type SignalExplanationOut,
  type SignalOut,
  type SourceOut,
  type SourceRunOut,
  type StatusOut,
  type WatchlistOut,
  type WorkspacePreferencesOut,
} from "./api";

const MINUTE = 60_000;

export function useAuthCheck() {
  return useQuery({
    queryKey: ["auth"],
    queryFn: () => api.get<AuthCheckOut>("/auth/check"),
    retry: false,
  });
}

// Signing in or out replaces the whole cache: nothing read with another session is kept.
export function useLogin() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: { email: string; password: string }) =>
      request<LoginOut>("POST", "/auth/login", { body, token: null }),
    onSuccess: (data) => {
      setToken(data.token);
      client.clear();
    },
  });
}

export function useLogout() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<null>("/auth/logout"),
    onSettled: () => {
      setToken(null);
      client.clear();
    },
  });
}

export function useStatus() {
  return useQuery({
    queryKey: ["status"],
    queryFn: () => api.get<StatusOut>("/status"),
    refetchInterval: MINUTE,
  });
}

export function useReadiness() {
  return useQuery({
    queryKey: ["readiness"],
    // /health/ready answers 503 with the same body when a check fails; keep that body.
    queryFn: () =>
      request<ReadinessOut>("GET", "/health/ready", { root: true }).catch((e: unknown) => {
        if (e instanceof ApiError && e.status === 503 && e.body) return e.body as ReadinessOut;
        throw e;
      }),
    retry: false,
    refetchInterval: MINUTE,
  });
}

export function useOverview(
  params: { watched_only?: boolean | undefined; ticker?: string | undefined } = {},
) {
  return useQuery({
    queryKey: ["overview", params],
    queryFn: () => api.get<OverviewOut>("/overview", params),
    refetchInterval: 5 * MINUTE,
  });
}

export function useSignalChanges(params: {
  horizon?: ApiHorizon | undefined;
  action?: ApiAction | undefined;
  since?: string | undefined;
  owned?: boolean | undefined;
  limit?: number | undefined;
}) {
  return useQuery({
    queryKey: ["signal-changes", params],
    queryFn: () => api.get<Page<SignalOut>>("/signals/changes", { limit: 100, ...params }),
  });
}

export function useExplanation(ticker: string, horizon: ApiHorizon) {
  return useQuery({
    queryKey: ["explain", ticker, horizon],
    queryFn: () => api.get<SignalExplanationOut>(`/signals/${ticker}/explain`, { horizon }),
    retry: false,
  });
}

export function useAnalysis(ticker: string, enabled = true, positionQuantity?: number) {
  return useQuery({
    queryKey: ["analysis", ticker, positionQuantity],
    queryFn: () =>
      api.get<AnalysisOut>(`/analysis/${ticker}`, { position_quantity: positionQuantity }),
    enabled,
    retry: false,
  });
}

export function useSeries(
  ticker: string,
  params: {
    start: string;
    sma: number[];
    ema: number[];
    rsi?: number | undefined;
    macd?: boolean | undefined;
  },
) {
  return useQuery({
    queryKey: ["series", ticker, params],
    queryFn: () =>
      api.get<SeriesOut>(`/analysis/${ticker}/series`, {
        start: params.start,
        sma: params.sma,
        ema: params.ema,
        rsi: params.rsi,
        macd: params.macd,
      }),
    retry: false,
    placeholderData: (previous) => previous,
  });
}

export function useFundamentals(ticker: string, enabled = true) {
  return useQuery({
    queryKey: ["fundamentals", ticker],
    queryFn: () => api.get<FundamentalsOut>(`/fundamentals/${ticker}`),
    enabled,
    retry: false,
  });
}

export function useEvents(params: {
  kind?: string | undefined;
  category?: string | undefined;
  ticker?: string | undefined;
  usage?: string | undefined;
  limit?: number | undefined;
}) {
  return useQuery({
    queryKey: ["events", params],
    queryFn: () => api.get<Page<EventOut>>("/events", { limit: 50, ...params }),
  });
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: ["event", id],
    queryFn: () => api.get<EventDetailOut>(`/events/${id}`),
    retry: false,
  });
}

export function useSources() {
  return useQuery({
    queryKey: ["sources"],
    queryFn: () => api.get<SourceOut[]>("/sources"),
    refetchInterval: 5 * MINUTE,
  });
}

export function useSourceRuns(code: string | null) {
  return useQuery({
    queryKey: ["source-runs", code],
    queryFn: () => api.get<Page<SourceRunOut>>(`/sources/${code}/runs`, { limit: 10 }),
    enabled: !!code,
  });
}

export function useMacroIndicators() {
  return useQuery({
    queryKey: ["macro-indicators"],
    queryFn: () => api.get<{ as_of: string; indicators: MacroIndicatorOut[] }>("/macro/indicators"),
  });
}

export function useMacroObservations(code: string | null) {
  return useQuery({
    queryKey: ["macro-observations", code],
    queryFn: () =>
      api.get<Page<MacroObservationOut>>(`/macro/indicators/${code}/observations`, {
        limit: 200,
      }),
    enabled: !!code,
  });
}

export function useMacroSnapshot() {
  return useQuery({
    queryKey: ["macro-snapshot"],
    queryFn: () => api.get<MacroSnapshotOut>("/macro/snapshot"),
    retry: false,
  });
}

// --- workspace ------------------------------------------------------------------------------

export function useWatchlist() {
  return useQuery({ queryKey: ["watchlist"], queryFn: () => api.get<WatchlistOut>("/watchlist") });
}

export function useWatchMutations() {
  const client = useQueryClient();
  const refresh = () => {
    void client.invalidateQueries({ queryKey: ["watchlist"] });
    void client.invalidateQueries({ queryKey: ["overview"] });
  };
  const add = useMutation({
    mutationFn: (ticker: string) => api.post<WatchlistOut>("/watchlist", { ticker }),
    onSuccess: refresh,
  });
  const remove = useMutation({
    mutationFn: (ticker: string) => api.delete<WatchlistOut>(`/watchlist/${ticker}`),
    onSuccess: refresh,
  });
  return { add, remove };
}

export function usePreferences() {
  return useQuery({
    queryKey: ["preferences"],
    queryFn: () => api.get<WorkspacePreferencesOut>("/preferences"),
  });
}

export function useUpdatePreferences() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Pick<WorkspacePreferencesOut, "default_horizon" | "theme">>) =>
      api.put<WorkspacePreferencesOut>("/preferences", body),
    onSuccess: (data) => client.setQueryData(["preferences"], data),
  });
}

// --- portfolio ------------------------------------------------------------------------------

export function usePositions() {
  return useQuery({
    queryKey: ["positions"],
    queryFn: () => api.get<Page<PositionOut>>("/portfolio/positions", { limit: 200 }),
  });
}

export function usePosition(id: string | null) {
  return useQuery({
    queryKey: ["position", id],
    queryFn: () => api.get<PositionDetailOut>(`/portfolio/positions/${id}`),
    enabled: !!id,
  });
}

export function usePortfolioSummary() {
  return useQuery({
    queryKey: ["portfolio-summary"],
    queryFn: () => api.get<PortfolioSummaryOut>("/portfolio/summary"),
  });
}

function usePortfolioRefresh() {
  const client = useQueryClient();
  // A deleted position's detail is dropped, not refetched (it would 404).
  return (deletedId?: string) => {
    if (deletedId) client.removeQueries({ queryKey: ["position", deletedId] });
    for (const key of ["positions", "portfolio-summary", "overview", "position"]) {
      void client.invalidateQueries({
        queryKey: [key],
        predicate: (q) => !deletedId || q.queryKey[1] !== deletedId,
      });
    }
  };
}

export function useAddPosition() {
  const refresh = usePortfolioRefresh();
  return useMutation({
    mutationFn: (body: PositionIn) => api.post<PositionDetailOut>("/portfolio/positions", body),
    onSuccess: () => refresh(),
  });
}

export function useDeletePosition() {
  const refresh = usePortfolioRefresh();
  return useMutation({
    mutationFn: (id: string) => api.delete<null>(`/portfolio/positions/${id}`),
    onSuccess: (_, id) => refresh(id),
  });
}

// --- notifications --------------------------------------------------------------------------

export function useNotifications(action?: ApiAction) {
  return useQuery({
    queryKey: ["notifications", action],
    queryFn: () => api.get<Page<NotificationOut>>("/notifications", { action, limit: 50 }),
  });
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: ["notification-preferences"],
    queryFn: () => api.get<NotificationPreferencesOut>("/notifications/preferences"),
  });
}

export function useUpdateNotificationPreferences() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<NotificationPreferencesOut>) =>
      api.put<NotificationPreferencesOut>("/notifications/preferences", body),
    onSuccess: (data) => client.setQueryData(["notification-preferences"], data),
  });
}

export function useNotificationConfig() {
  return useQuery({
    queryKey: ["notification-config"],
    queryFn: () => api.get<NotificationConfigOut>("/notifications/config"),
  });
}

export function useSendTestNotification() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<NotificationOut>("/notifications/test", {}),
    onSuccess: () => void client.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

// --- scanner and backtests ------------------------------------------------------------------

export function useLatestScan() {
  return useQuery({
    queryKey: ["latest-scan"],
    // 404 means no scan has been stored yet, which is a state, not an error.
    queryFn: () =>
      api.get<ScanOut>("/scanner/scans/latest", { top: 1 }).catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 404) return null;
        throw err;
      }),
    retry: false,
  });
}

export function useScannerConfig() {
  return useQuery({
    queryKey: ["scanner-config"],
    queryFn: () => api.get<ScannerConfigOut>("/scanner/config"),
  });
}

export function useBacktests() {
  return useQuery({
    queryKey: ["backtests"],
    queryFn: () => api.get<Page<BacktestRunOut>>("/backtests", { limit: 50 }),
    // Poll while a run is queued or running (the Celery worker runs it).
    refetchInterval: (query) =>
      query.state.data?.items.some((r) => r.status === "queued" || r.status === "running")
        ? 5000
        : false,
  });
}

export function useBacktest(id: string | null) {
  return useQuery({
    queryKey: ["backtest", id],
    queryFn: () => api.get<BacktestRunDetailOut>(`/backtests/${id}`),
    enabled: !!id,
    refetchInterval: (query) =>
      query.state.data?.status === "queued" || query.state.data?.status === "running"
        ? 5000
        : false,
  });
}

export function useBacktestEquity(id: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ["backtest-equity", id],
    queryFn: () => api.get<BacktestEquityOut>(`/backtests/${id}/equity`),
    enabled: !!id && enabled,
  });
}

export function useBacktestTrades(id: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ["backtest-trades", id],
    queryFn: () => api.get<Page<BacktestTradeOut>>(`/backtests/${id}/trades`, { limit: 200 }),
    enabled: !!id && enabled,
  });
}

export function useBacktestConfig() {
  return useQuery({
    queryKey: ["backtest-config"],
    queryFn: () => api.get<BacktestConfigOut>("/backtests/config"),
  });
}

export function useRequestBacktest() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: BacktestIn) => api.post<BacktestRunOut>("/backtests", body),
    onSuccess: () => void client.invalidateQueries({ queryKey: ["backtests"] }),
  });
}
