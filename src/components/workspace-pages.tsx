// The routed pages. Each reads the FastAPI backend through the hooks in lib/queries.ts.
export { ScannerPage, SignalsPage, WatchlistPage, CompaniesPage } from "./pages/market-pages";
export { PortfolioPage } from "./pages/portfolio-page";
export { StockDetailPage } from "./pages/stock-detail-page";
export { EventsPage, EventDetailPage } from "./pages/events-pages";
export { MacroPage } from "./pages/macro-page";
export { BacktestsPage } from "./pages/backtests-page";
export { NotificationsPage } from "./pages/notifications-page";
export { SourcesPage } from "./pages/sources-page";
export { SettingsPage, LoginPage } from "./pages/settings-page";
