import { createFileRoute } from "@tanstack/react-router";
import { PortfolioPage } from "@/components/workspace-pages";
export const Route = createFileRoute("/portfolio")({
  validateSearch: (search: Record<string, unknown>): { add?: string } =>
    typeof search["add"] === "string" ? { add: search["add"] as string } : {},
  head: () => ({
    meta: [
      { title: "Portfolio | Ẹ̀KỌ́ Market Intelligence" },
      {
        name: "description",
        content: "Monitor your recorded positions and current risk assessments.",
      },
      { property: "og:title", content: "Portfolio | Ẹ̀KỌ́ Market Intelligence" },
      {
        property: "og:description",
        content: "Monitor your recorded positions and current risk assessments.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
function Page() {
  const { add } = Route.useSearch();
  return <PortfolioPage addTicker={add} />;
}
