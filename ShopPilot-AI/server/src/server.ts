import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { db, products } from "./data/store.js";
import { router } from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { catalog } from "./seed/catalog.js";

async function ensureCatalog() {
  const existing = await products.all();
  if (!existing.length) {
    console.log("[boot] Catalog empty — loading built-in seed products. Run `npm run seed` for full demo analytics.");
    await products.replaceAll(catalog);
  }
}

async function boot() {
  await db.connect();
  await ensureCatalog();

  const app = express();
  app.use(
    cors({
      origin: env.clientUrl.split(",").map((s) => s.trim()),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));

  app.get("/", (_req, res) => {
    res.json({
      name: "ShopPilot AI",
      status: "ok",
      db: db.mode,
      docs: "/api/health",
    });
  });

  app.use("/api", router);
  app.use(notFoundHandler);
  app.use(errorHandler);

  app.listen(env.port, () => {
    console.log(`ShopPilot API listening on :${env.port} (${db.mode} db)`);
  });
}

boot().catch((err) => {
  console.error("Failed to start server", err);
  process.exit(1);
});
