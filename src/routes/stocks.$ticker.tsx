import { createFileRoute } from "@tanstack/react-router";
import { StockDetailPage } from "@/components/workspace-pages";
export const Route = createFileRoute("/stocks/$ticker")({
  validateSearch: (search: Record<string, unknown>): { focus?: string } =>
    typeof search["focus"] === "string" ? { focus: search["focus"] as string } : {},
  head: () => ({
    meta: [
      { title: "Stock Analysis | Ẹ̀KỌ́ Market Intelligence" },
      {
        name: "description",
        content: "Review price, signals, risks and supporting factors for a Nigerian security.",
      },
      { property: "og:title", content: "Stock Analysis | Ẹ̀KỌ́ Market Intelligence" },
      {
        property: "og:description",
        content: "Review price, signals, risks and supporting factors for a Nigerian security.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
function Page() {
  const { ticker } = Route.useParams();
  const { focus } = Route.useSearch();
  return <StockDetailPage ticker={ticker} focus={focus} />;
}
