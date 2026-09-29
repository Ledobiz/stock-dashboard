import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/components/dashboard-page";
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard | Ẹ̀KỌ́ Market Intelligence" },
      {
        name: "description",
        content: "Personal Nigerian equity portfolio, risk alerts, and market opportunities.",
      },
      { property: "og:title", content: "Dashboard | Ẹ̀KỌ́ Market Intelligence" },
      {
        property: "og:description",
        content: "Personal Nigerian equity portfolio, risk alerts, and market opportunities.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});
