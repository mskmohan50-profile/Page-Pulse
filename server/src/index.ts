import express from "express";
import type { NextFunction, Request, Response } from "express";
import cors from "cors";
import * as cheerio from "cheerio";

const PORT = Number(process.env.PORT ?? 3000);
const FETCH_TIMEOUT_MS = 10_000;
const MAX_BODY_BYTES = 5 * 1024 * 1024; 

interface AuditReport {
  url: string;
  httpStatus: number;
  responseTimeMs: number;
  title: string | null;
  metaDescription: string | null;
  h1Count: number;
  imagesMissingAlt: number;
  wordCount: number;
  error?: string;
}

interface AuditErrorBody {
  error: string;
}

const app = express();
app.use(cors());
app.use(express.json({ limit: "10kb" }));

/** Validates the incoming string is a well-formed absolute http/https URL. */
function parseTargetUrl(raw: unknown): URL | null {
  if (typeof raw !== "string" || raw.trim().length === 0) return null;
  let candidate = raw.trim();
  // Be forgiving: if someone types "example.com" assume https.
  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `https://${candidate}`;
  }
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    if (!parsed.hostname || !parsed.hostname.includes(".")) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Fetches a URL with a hard timeout, never throwing past this boundary uncaught. */
async function fetchWithTimeout(url: string, ms: number): Promise<globalThis.Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; PagePulseAuditBot/1.0; +https://digitalheroesco.com)",
        Accept: "text/html,application/xhtml+xml,*/*;q=0.8",
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

/** Reads the response body up to a byte cap, so huge pages can't blow up memory. */
async function readBodyCapped(res: globalThis.Response, capBytes: number): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return await res.text();

  const decoder = new TextDecoder();
  let received = 0;
  let out = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    out += decoder.decode(value, { stream: true });
    if (received >= capBytes) {
      try {
        await reader.cancel();
      } catch {
        /* ignore */
      }
      break;
    }
  }
  out += decoder.decode();
  return out;
}

function analyzeHtml(html: string) {
  const $ = cheerio.load(html);

  const title = $("title").first().text().trim() || null;

  const metaDescription =
    $('meta[name="description"]').attr("content")?.trim() ||
    $('meta[property="og:description"]').attr("content")?.trim() ||
    null;

  const h1Count = $("h1").length;

  let imagesMissingAlt = 0;
  $("img").each((_, el) => {
    const alt = $(el).attr("alt");
    if (alt === undefined || alt.trim().length === 0) imagesMissingAlt += 1;
  });

  $("script, style, noscript, template").remove();
  const text = $("body").text().replace(/\s+/g, " ").trim();
  const wordCount = text.length === 0 ? 0 : text.split(" ").length;

  return { title, metaDescription, h1Count, imagesMissingAlt, wordCount };
}

app.post(
  "/audit",
  async (req: Request, res: Response<AuditReport | AuditErrorBody>) => {
    const targetUrl = parseTargetUrl(req.body?.url);

    if (!targetUrl) {
      res.status(400).json({
        error: "Please enter a valid URL, e.g. https://example.com",
      });
      return;
    }

    const started = Date.now();

    try {
      const upstream = await fetchWithTimeout(targetUrl.toString(), FETCH_TIMEOUT_MS);
      const responseTimeMs = Date.now() - started;
      const contentType = upstream.headers.get("content-type") ?? "";
      const httpStatus = upstream.status;

      const isHtml = contentType.toLowerCase().includes("text/html");

      if (!isHtml) {
        res.status(200).json({
          url: targetUrl.toString(),
          httpStatus,
          responseTimeMs,
          title: null,
          metaDescription: null,
          h1Count: 0,
          imagesMissingAlt: 0,
          wordCount: 0,
          error: contentType
            ? `Response is not HTML (content-type: ${contentType.split(";")[0]}). SEO metrics unavailable.`
            : "Response has no content-type header; SEO metrics unavailable.",
        });
        return;
      }

      const html = await readBodyCapped(upstream, MAX_BODY_BYTES);
      const { title, metaDescription, h1Count, imagesMissingAlt, wordCount } =
        analyzeHtml(html);

      const report: AuditReport = {
        url: targetUrl.toString(),
        httpStatus,
        responseTimeMs,
        title,
        metaDescription,
        h1Count,
        imagesMissingAlt,
        wordCount,
      };

      if (httpStatus >= 400) {
        report.error = `The server responded with status ${httpStatus}.`;
      }

      res.status(200).json(report);
    } catch (err: unknown) {
      const responseTimeMs = Date.now() - started;
      const name = (err as { name?: string })?.name;

      if (name === "AbortError") {
        res.status(200).json({
          error: `Request timed out after ${FETCH_TIMEOUT_MS / 1000}s.`,
        });
        return;
      }

      const code = (err as { cause?: { code?: string }; code?: string })?.cause?.code ??
        (err as { code?: string })?.code;

      let message = "Could not reach that URL. Please check it and try again.";
      if (code === "ENOTFOUND" || code === "EAI_AGAIN") {
        message = "That domain could not be found (DNS lookup failed).";
      } else if (code === "ECONNREFUSED") {
        message = "Connection was refused by the server.";
      } else if (code === "CERT_HAS_EXPIRED" || code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE") {
        message = "The site's SSL certificate could not be verified.";
      }

      // Log full detail server-side, but never leak stack traces to the client.
      console.error(`[audit] failed for ${targetUrl.toString()} after ${responseTimeMs}ms:`, err);

      res.status(200).json({ error: message });
    }
  }
);

app.get("/health", (_req: Request, res: Response) => {
  res.json({ ok: true });
});

// Catch-all 404 for anything else.
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

// Last-resort error handler so a thrown error never crashes the process.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[unhandled]", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`PagePulse audit server listening on http://localhost:${PORT}`);
});

process.on("unhandledRejection", (reason) => {
  console.error("[unhandledRejection]", reason);
});
process.on("uncaughtException", (err) => {
  console.error("[uncaughtException]", err);
});