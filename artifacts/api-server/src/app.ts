
import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import path from "path";

const app: Express = express();


app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public"))); 
app.use("/api", router);
// Sende die Sitemap direkt als Text, unabhängig von der Ordnerstruktur
app.get("/sitemap.xml", (req, res) => {
  res.header("Content-Type", "application/xml");
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://sitemaps.org">
   <url>
      <loc>https://replit.app</loc>
      <lastmod>2026-09-17</lastmod>
      <changefreq>weekly</changefreq>
      <priority>1.0</priority>
   </url>
</urlset>`);
});

// Deine bestehende Zeile:
app.use("/api", router);


app.use("/api", router);

export default app;
