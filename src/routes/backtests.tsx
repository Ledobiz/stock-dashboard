import { createFileRoute } from "@tanstack/react-router";
import { BacktestsPage } from "@/components/workspace-pages";
export const Route = createFileRoute("/backtests")({
  head: () => ({
    meta: [
      { title: "Backtests | Ẹ̀KỌ́ Market Intelligence" },
      { name: "description", content: "Review illustrative historical strategy results and risk." },
      { property: "og:title", content: "Backtests | Ẹ̀KỌ́ Market Intelligence" },
      {
        property: "og:description",
        content: "Review illustrative historical strategy results and risk.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BacktestsPage,
});
