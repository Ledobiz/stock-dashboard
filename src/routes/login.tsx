import { createFileRoute } from "@tanstack/react-router";
import { LoginPage } from "@/components/workspace-pages";
export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Private Sign In | Ẹ̀KỌ́ Market Intelligence" },
      {
        name: "description",
        content: "Private access to your personal Nigerian market workspace.",
      },
      { property: "og:title", content: "Private Sign In | Ẹ̀KỌ́ Market Intelligence" },
      {
        property: "og:description",
        content: "Private access to your personal Nigerian market workspace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});
