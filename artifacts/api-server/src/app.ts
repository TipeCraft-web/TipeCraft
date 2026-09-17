import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// DIESER CODE KOMMT GANZ NACH OBEN (direkt unter const app = express();)
app.get('/sitemap.xml', (req, res) => {
  // Wir senden den XML-Inhalt direkt als reinen Text aus dem Code heraus!
  const xmlSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://sitemaps.org">
  <url>
    <loc>https://${req.get('host')}/</loc>
    <changefreq>wöchentlich</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;

  res.header('Content-Type', 'application/xml');
  res.send(xmlSitemap);
});

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

app.use("/api", router);

export default app;
