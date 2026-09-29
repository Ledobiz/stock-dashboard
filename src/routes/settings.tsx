import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/components/workspace-pages";
export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings | Ẹ̀KỌ́ Market Intelligence" },
      { name: "description", content: "Personalise your market intelligence workspace." },
      { property: "og:title", content: "Settings | Ẹ̀KỌ́ Market Intelligence" },
      { property: "og:description", content: "Personalise your market intelligence workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});
