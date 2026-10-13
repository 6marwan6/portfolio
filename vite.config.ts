import type { IncomingMessage, ServerResponse } from "node:http";
import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

/** Serves /api/agent and /api/recruiter during `npm run dev` by running the same handlers Vercel runs in production. */
function apiDev(): Plugin {
  return {
    name: "portfolio-api-dev",
    configureServer(server) {
      Object.assign(process.env, loadEnv("development", process.cwd(), ""));
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const url = req.url ?? "";
        const name = url.split("?")[0]!.replace(/^\/api\//, "");
        if (!url.startsWith("/api/") || !["agent", "recruiter"].includes(name)) return next();
        try {
          const mod = (await server.ssrLoadModule(`/api/${name}.ts`)) as Record<string, (r: Request) => Promise<Response>>;
          const chunks: Buffer[] = [];
          for await (const c of req) chunks.push(c as Buffer);
          const headers = new Headers();
          for (const [k, v] of Object.entries(req.headers)) if (typeof v === "string") headers.set(k, v);
          const method = req.method ?? "GET";
          const request = new Request(`http://localhost${url}`, { method, headers, body: method === "GET" || method === "HEAD" ? undefined : Buffer.concat(chunks) });
          const handler = mod[method === "POST" ? "POST" : "GET"];
          const response = handler ? await handler(request) : new Response("Not found", { status: 404 });
          res.statusCode = response.status;
          response.headers.forEach((value, key) => res.setHeader(key, value));
          if (response.body) {
            const reader = response.body.getReader();
            for (;;) {
              const { done, value } = await reader.read();
              if (done) break;
              res.write(value);
            }
          }
          res.end();
        } catch (error) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: "dev_server_error", message: String(error) }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), apiDev()],
  test: { environment: "node", include: ["tests/**/*.test.ts"] },
});
