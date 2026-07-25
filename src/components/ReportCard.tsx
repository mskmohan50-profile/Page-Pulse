import { AuditReport } from "@/types";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Heading1,
  Image,
  Info,
  Type,
  XCircle,
} from "lucide-react";

interface Props {
  report: AuditReport;
}

function statusColor(code: number) {
  if (code >= 200 && code < 300) return "text-emerald-600";
  if (code >= 300 && code < 400) return "text-amber-500";
  return "text-red-500";
}

function statusBg(code: number) {
  if (code >= 200 && code < 300) return "bg-emerald-50 border-emerald-200";
  if (code >= 300 && code < 400) return "bg-amber-50 border-amber-200";
  return "bg-red-50 border-red-200";
}

function StatusIcon({ code }: { code: number }) {
  if (code >= 200 && code < 300)
    return <CheckCircle className="w-5 h-5 text-emerald-500" />;
  if (code >= 300 && code < 400)
    return <AlertTriangle className="w-5 h-5 text-amber-500" />;
  return <XCircle className="w-5 h-5 text-red-500" />;
}

function MetricCard({
  icon,
  label,
  value,
  sub,
  warn,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number | null;
  sub?: string;
  warn?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 flex flex-col gap-1 ${
        warn ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-center gap-2 text-slate-500 text-xs font-medium uppercase tracking-wide">
        {icon}
        {label}
      </div>
      <p
        className={`text-2xl font-bold mt-1 ${
          warn ? "text-amber-700" : "text-slate-800"
        }`}
      >
        {value ?? <span className="text-slate-400 text-base italic">—</span>}
      </p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function ReportCard({ report }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden animate-fadeIn">
      {/* Header */}
      <div className={`border-b px-6 py-4 flex items-center gap-3 ${statusBg(report.httpStatus)}`}>
        <StatusIcon code={report.httpStatus} />
        <div className="min-w-0">
          <p
            className={`text-lg font-bold ${statusColor(report.httpStatus)}`}
          >
            {report.httpStatus} — {httpLabel(report.httpStatus)}
          </p>
          <p className="text-xs text-slate-500 truncate">{report.url}</p>
        </div>
      </div>

      {/* Non-HTML warning */}
      {report.error && report.httpStatus !== 0 && (
        <div className="mx-6 mt-4 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          {report.error}
        </div>
      )}

      {/* Metrics grid */}
      <div className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
        <MetricCard
          icon={<Clock className="w-4 h-4" />}
          label="Response Time"
          value={`${report.responseTimeMs} ms`}
          sub={report.responseTimeMs < 500 ? "Fast" : report.responseTimeMs < 1500 ? "Moderate" : "Slow"}
          warn={report.responseTimeMs > 1500}
        />
        <MetricCard
          icon={<Type className="w-4 h-4" />}
          label="Page Title"
          value={report.title ?? "None"}
          sub={
            report.title
              ? `${report.title.length} chars`
              : "Missing title tag"
          }
          warn={!report.title}
        />
        <MetricCard
          icon={<Info className="w-4 h-4" />}
          label="Meta Description"
          value={
            report.metaDescription
              ? `${report.metaDescription.length} chars`
              : "None"
          }
          sub={
            report.metaDescription
              ? report.metaDescription.slice(0, 60) + (report.metaDescription.length > 60 ? "…" : "")
              : "Missing meta description"
          }
          warn={!report.metaDescription}
        />
        <MetricCard
          icon={<Heading1 className="w-4 h-4" />}
          label="H1 Count"
          value={report.h1Count}
          sub={
            report.h1Count === 1
              ? "Ideal — one H1"
              : report.h1Count === 0
              ? "No H1 found"
              : `Multiple H1s (${report.h1Count})`
          }
          warn={report.h1Count !== 1}
        />
        <MetricCard
          icon={<Image className="w-4 h-4" />}
          label="Images Missing Alt"
          value={report.imagesMissingAlt}
          sub={
            report.imagesMissingAlt === 0
              ? "All images have alt text"
              : `${report.imagesMissingAlt} image${report.imagesMissingAlt > 1 ? "s" : ""} without alt`
          }
          warn={report.imagesMissingAlt > 0}
        />
        <MetricCard
          icon={<FileText className="w-4 h-4" />}
          label="Word Count"
          value={report.wordCount.toLocaleString()}
          sub="Approximate"
        />
      </div>

      {/* Title text */}
      {report.title && (
        <div className="px-6 pb-4">
          <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-1">
            Full Title
          </p>
          <p className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2">
            {report.title}
          </p>
        </div>
      )}

      {/* Meta description text */}
      {report.metaDescription && (
        <div className="px-6 pb-6">
          <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-1">
            Meta Description
          </p>
          <p className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2">
            {report.metaDescription}
          </p>
        </div>
      )}
    </div>
  );
}

function httpLabel(code: number): string {
  const labels: Record<number, string> = {
    200: "OK",
    201: "Created",
    204: "No Content",
    301: "Moved Permanently",
    302: "Found",
    304: "Not Modified",
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    429: "Too Many Requests",
    500: "Internal Server Error",
    502: "Bad Gateway",
    503: "Service Unavailable",
    504: "Gateway Timeout",
  };
  return labels[code] ?? "Unknown";
}