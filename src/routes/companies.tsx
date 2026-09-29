import { createFileRoute } from "@tanstack/react-router";
import { CompaniesPage } from "@/components/workspace-pages";
export const Route = createFileRoute("/companies")({
  head: () => ({
    meta: [
      { title: "Companies | Ẹ̀KỌ́ Market Intelligence" },
      { name: "description", content: "Browse Nigerian Exchange company assessments." },
      { property: "og:title", content: "Companies | Ẹ̀KỌ́ Market Intelligence" },
      { property: "og:description", content: "Browse Nigerian Exchange company assessments." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CompaniesPage,
});
