export interface AuditReport {
  url: string;
  httpStatus: number;
  responseTimeMs: number;
  contentType: string;
  title: string | null;
  metaDescription: string | null;
  h1Count: number;
  imagesMissingAlt: number;
  wordCount: number;
  error: string | null;
}
