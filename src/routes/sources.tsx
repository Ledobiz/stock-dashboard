import { createFileRoute } from "@tanstack/react-router";
import { SourcesPage } from "@/components/workspace-pages";
export const Route = createFileRoute("/sources")({
  head: () => ({
    meta: [
      { title: "Data Sources | Ẹ̀KỌ́ Market Intelligence" },
      {
        name: "description",
        content: "Inspect market data provenance, freshness, and system status.",
      },
      { property: "og:title", content: "Data Sources | Ẹ̀KỌ́ Market Intelligence" },
      {
        property: "og:description",
        content: "Inspect market data provenance, freshness, and system status.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SourcesPage,
});
