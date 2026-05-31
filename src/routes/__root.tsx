import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AppShell } from "@/components/AppShell";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl bg-brand px-4 py-2 text-sm font-medium text-brand-foreground transition-colors hover:opacity-90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-xl bg-brand px-4 py-2 text-sm font-medium text-brand-foreground transition-colors hover:opacity-90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "FamilyFlow AI — Your family, beautifully organized" },
      {
        name: "description",
        content:
          "FamilyFlow AI brings your family's calendar, chores, and shopping lists into one AI-powered hub.",
      },
      { property: "og:title", content: "FamilyFlow AI — Your family, beautifully organized" },
      {
        property: "og:description",
        content:
          "AI-powered family productivity: shared calendar, chores with points, and smart shopping lists.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      { name: "twitter:title", content: "FamilyFlow AI — Your family, beautifully organized" },
      { name: "description", content: "FamilyFlow AI is an AI-powered web app for organizing family life and boosting household productivity." },
      { property: "og:description", content: "FamilyFlow AI is an AI-powered web app for organizing family life and boosting household productivity." },
      { name: "twitter:description", content: "FamilyFlow AI is an AI-powered web app for organizing family life and boosting household productivity." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/5f44333a-ac01-46ba-a22b-f8e8c714c8c3/id-preview-77d0286a--ee6a7075-ec81-4faa-b18e-bb1fe9f58d8b.lovable.app-1780239963859.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/5f44333a-ac01-46ba-a22b-f8e8c714c8c3/id-preview-77d0286a--ee6a7075-ec81-4faa-b18e-bb1fe9f58d8b.lovable.app-1780239963859.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AppShell />
    </QueryClientProvider>
  );
}
