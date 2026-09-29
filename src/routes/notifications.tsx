import { createFileRoute } from "@tanstack/react-router";
import { NotificationsPage } from "@/components/workspace-pages";
export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications | Ẹ̀KỌ́ Market Intelligence" },
      { name: "description", content: "Review signal alert history and delivery preferences." },
      { property: "og:title", content: "Notifications | Ẹ̀KỌ́ Market Intelligence" },
      {
        property: "og:description",
        content: "Review signal alert history and delivery preferences.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NotificationsPage,
});
