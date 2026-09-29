import { createFileRoute } from "@tanstack/react-router";
import { EventDetailPage } from "@/components/workspace-pages";
export const Route = createFileRoute("/events/$id")({
  head: () => ({
    meta: [
      { title: "Event Intelligence | Ẹ̀KỌ́ Market Intelligence" },
      {
        name: "description",
        content: "Investigate market events, sources and portfolio exposure.",
      },
      { property: "og:title", content: "Event Intelligence | Ẹ̀KỌ́ Market Intelligence" },
      {
        property: "og:description",
        content: "Investigate market events, sources and portfolio exposure.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
function Page() {
  const { id } = Route.useParams();
  return <EventDetailPage id={id} />;
}
