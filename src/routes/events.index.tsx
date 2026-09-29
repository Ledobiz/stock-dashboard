import { createFileRoute } from "@tanstack/react-router";
import { EventsPage } from "@/components/workspace-pages";
export const Route = createFileRoute("/events/")({
  head: () => ({
    meta: [
      { title: "Events & News | Ẹ̀KỌ́ Market Intelligence" },
      {
        name: "description",
        content: "Review Nigerian market events and regulatory intelligence.",
      },
      { property: "og:title", content: "Events & News | Ẹ̀KỌ́ Market Intelligence" },
      {
        property: "og:description",
        content: "Review Nigerian market events and regulatory intelligence.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EventsPage,
});
