# remix-provider

Provides the ability to distribute environment variables etc. to clients when using Remix / React Router + Cloudflare

- ServerProvider

  - Set the values you want to send from the server side to the client.

- RootProvider
  - Distribute the values set by the ServerProvider to the client.
- RootValue
  - Output the values set in ServerProvider at rendering time.
- useRootContext
  - Hook to receive the values set by the ServerProvider in the component.

## Sample

- source code

https://github.com/SoraKumo001/remix-provider  
https://github.com/SoraKumo001/react-router7-hono

- execution result

https://remix-provider.pages.dev/

### entry.server.tsx

```tsx
import type { AppLoadContext, EntryContext } from "react-router";
import { ServerRouter } from "react-router";
import { isbot } from "isbot";
import { renderToReadableStream } from "react-dom/server";
import { ServerProvider } from "remix-provider";

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  _loadContext: AppLoadContext
) {
  let shellRendered = false;
  const userAgent = request.headers.get("user-agent");

  const body = await renderToReadableStream(
    <ServerProvider
      value={Object.fromEntries(
        Object.entries(process.env).filter(([key]) =>
          key.startsWith("REACT_ROUTER_PUBLIC_")
        )
      )}
    >
      <ServerRouter context={routerContext} url={request.url} />
    </ServerProvider>,
    {
      onError(error: unknown) {
        responseStatusCode = 500;
        // Log streaming rendering errors from inside the shell.  Don't log
        // errors encountered during initial shell rendering since they'll
        // reject and get logged in handleDocumentRequest.
        if (shellRendered) {
          console.error(error);
        }
      },
    }
  );
  shellRendered = true;

  // Ensure requests from bots and SPA Mode renders wait for all content to load before responding
  // https://react.dev/reference/react-dom/server/renderToPipeableStream#waiting-for-all-content-to-load-for-crawlers-and-static-generation
  if ((userAgent && isbot(userAgent)) || routerContext.isSpaMode) {
    await body.allReady;
  }

  responseHeaders.set("Content-Type", "text/html");
  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
```

### root.tsx

```tsx
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import { RootProvider, RootValue } from "remix-provider";

import type { Route } from "./+types/root";
import stylesheet from "./app.css?url";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
  { rel: "stylesheet", href: stylesheet },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <RootProvider>
      <html lang="en">
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <Meta />
          <Links />
          <RootValue />
        </head>
        <body>
          {children}
          <ScrollRestoration />
          <Scripts />
        </body>
      </html>
    </RootProvider>
  );
}

export default function App() {
  return <Outlet />;
}
```

### routes/\_index.tsx

```tsx
import { useRootContext } from "remix-provider";

export default function Index() {
  // Get the value distributed to clients.
  const value = useRootContext();
  return <div className="whitespace-pre">{JSON.stringify(value, null, 2)}</div>;
}
```

### Execution Result

- Output

```json
{
  "env": {
    "ASSETS": {},
    "CF_PAGES": "1",
    "CF_PAGES_BRANCH": "master",
    "CF_PAGES_COMMIT_SHA": "dfc64ad01b02b6832fae2fd3a61453ac14f6fb35",
    "CF_PAGES_URL": "https://f3f206fa.remix-provider.pages.dev"
  },
  "host": "remix-provider.pages.dev"
}
```
