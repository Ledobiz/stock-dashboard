import { createFileRoute } from "@tanstack/react-router";
import { SignalsPage } from "@/components/workspace-pages";
export const Route = createFileRoute("/signals")({
  head: () => ({
    meta: [
      { title: "Signals | Ẹ̀KỌ́ Market Intelligence" },
      { name: "description", content: "Review signal changes and their supporting reasons." },
      { property: "og:title", content: "Signals | Ẹ̀KỌ́ Market Intelligence" },
      {
        property: "og:description",
        content: "Review signal changes and their supporting reasons.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SignalsPage,
});
