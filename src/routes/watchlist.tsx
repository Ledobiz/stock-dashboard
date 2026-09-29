import { createFileRoute } from "@tanstack/react-router";
import { WatchlistPage } from "@/components/workspace-pages";
export const Route = createFileRoute("/watchlist")({
  head: () => ({
    meta: [
      { title: "Watchlist | Ẹ̀KỌ́ Market Intelligence" },
      { name: "description", content: "Track Nigerian securities across three trading horizons." },
      { property: "og:title", content: "Watchlist | Ẹ̀KỌ́ Market Intelligence" },
      {
        property: "og:description",
        content: "Track Nigerian securities across three trading horizons.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WatchlistPage,
});
