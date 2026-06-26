import { defineConfig } from "vite";

const apiRoutes = {
  "/api/recebimento": () => import("./api/recebimento.js"),
};

export default defineConfig({
  plugins: [
    {
      name: "local-api-routes",
      configureServer(server) {
        server.middlewares.use(async (request, response, next) => {
          const pathname = request.url?.split("?")[0];
          const loadRoute = apiRoutes[pathname];

          if (!loadRoute) {
            next();
            return;
          }

          try {
            request.body = await readRequestBody(request);
            const route = await loadRoute();
            const apiResponse = createApiResponse(response);

            await route.default(request, apiResponse);
          } catch (error) {
            response.statusCode = 500;
            response.setHeader("Content-Type", "application/json");
            response.end(
              JSON.stringify({
                error: "Falha ao executar rota local.",
                detail: error instanceof Error ? error.message : String(error),
              }),
            );
          }
        });
      },
    },
  ],
  server: {
    port: 4173,
  },
  preview: {
    port: 4173,
  },
});

function createApiResponse(response) {
  return {
    status(code) {
      response.statusCode = code;
      return this;
    },
    setHeader(name, value) {
      response.setHeader(name, value);
      return this;
    },
    json(payload) {
      if (!response.hasHeader("Content-Type")) {
        response.setHeader("Content-Type", "application/json");
      }

      response.end(JSON.stringify(payload));
      return this;
    },
  };
}

function readRequestBody(request) {
  if (!["POST", "PUT", "PATCH"].includes(request.method || "")) {
    return Promise.resolve(undefined);
  }

  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
    });

    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });

    request.on("error", reject);
  });
}
