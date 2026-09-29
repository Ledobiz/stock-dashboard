import { createFileRoute } from "@tanstack/react-router";
import { ScannerPage } from "@/components/workspace-pages";
export const Route = createFileRoute("/scanner")({
  head: () => ({
    meta: [
      { title: "Market Scanner | Ẹ̀KỌ́ Market Intelligence" },
      {
        name: "description",
        content: "Explore Nigerian stock signals and multi-horizon assessments.",
      },
      { property: "og:title", content: "Market Scanner | Ẹ̀KỌ́ Market Intelligence" },
      {
        property: "og:description",
        content: "Explore Nigerian stock signals and multi-horizon assessments.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ScannerPage,
});
