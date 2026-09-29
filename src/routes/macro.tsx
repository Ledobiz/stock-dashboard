import { createFileRoute } from "@tanstack/react-router";
import { MacroPage } from "@/components/workspace-pages";
export const Route = createFileRoute("/macro")({
  head: () => ({
    meta: [
      { title: "Macro Environment | Ẹ̀KỌ́ Market Intelligence" },
      {
        name: "description",
        content: "Explore Nigerian economic indicators and sector sensitivity.",
      },
      { property: "og:title", content: "Macro Environment | Ẹ̀KỌ́ Market Intelligence" },
      {
        property: "og:description",
        content: "Explore Nigerian economic indicators and sector sensitivity.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MacroPage,
});
