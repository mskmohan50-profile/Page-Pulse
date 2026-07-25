import { useState, useRef, FormEvent } from "react";
import { Search, Loader2, AlertCircle, Activity, Bold } from "lucide-react";
import { AuditReport } from "@/types";
const AUDIT_URL =
  import.meta.env.VITE_API_URL ||
  "https://page-pulse-3-d5y6.onrender.com/audit";
import ReportCard from "./componts/ReportCard";

const EXAMPLES = [
  "https://example.com",
  "https://github.com",
  "https://wikipedia.org",
];

export default function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setReport(null);
    setErrorMsg(null);

    try {
      const res = await fetch(AUDIT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();

      if (!res.ok || (data.error && !data.httpStatus)) {
        setErrorMsg(data.error ?? `Request failed (${res.status})`);
        return;
      }

      setReport(data as AuditReport);
    } catch {
      setErrorMsg("Could not connect to the audit service. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function tryExample(ex: string) {
    setUrl(ex);
    inputRef.current?.focus();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex flex-col">
      <header className="border-b border-white/10 px-6 py-4 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">
            Page<span className="text-sky-400">Pulse</span>
          </span>
        </div>
        <span className="ml-auto text-xs text-slate-400 hidden sm:block">
          URL Auditor — HTTP, SEO & Performance
        </span>
      </header>

      <main className="flex-1 flex flex-col items-center px-4 py-16 sm:py-24">
        <div className="w-full max-w-2xl">

          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest text-sky-400 uppercase mb-4">
              <span className="w-4 h-px bg-sky-400/60" />
              Instant Web Audit
              <span className="w-4 h-px bg-sky-400/60" />
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight">
              Check any URL in{" "}
              <span className="text-sky-400">seconds</span>
            </h1>
            <p className="mt-4 text-slate-400 text-lg">
              Get HTTP status, response time, SEO basics, and accessibility
              signals — all in one report.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="relative">
            <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl px-4 py-3 gap-3 focus-within:border-sky-500/60 focus-within:bg-white/8 transition-colors">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter any URL — e.g. https://example.com"
                className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none text-base"
                autoFocus
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="submit"
                disabled={loading || !url.trim()}
                className="shrink-0 bg-sky-500 hover:bg-sky-400 disabled:bg-sky-500/30 disabled:cursor-not-allowed text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Activity className="w-4 h-4" />
                )}
                {loading ? "Auditing…" : "Audit"}
              </button>
            </div>
          </form>

          <div className="flex flex-wrap items-center gap-2 mt-3 px-1">
            <span className="text-xs text-slate-500">Try:</span>
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => tryExample(ex)}
                className="text-xs text-sky-400/80 hover:text-sky-300 transition-colors underline underline-offset-2"
              >
                {ex.replace("https://", "")}
              </button>
            ))}
          </div>
          {errorMsg && (
            <div className="mt-8 flex items-start gap-3 bg-red-950/60 border border-red-800/60 rounded-xl px-4 py-4 text-red-300 text-sm animate-fadeIn">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {report && (
            <div className="mt-8">
              <ReportCard report={report} />
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-white/10 px-6 py-5 text-center text-xs text-slate-500">
  <p>
    Built for{" "}
    <a
      href="https://digitalheroesco.com"
      target="_blank"
      rel="noopener noreferrer"
      className="text-cyan-400 hover:text-cyan-300 underline"
    >
      Digital Heroes Training Task
    </a>
  </p>

  <p className="mt-2">
    Live Demo:{" "}
    <a
      href="https://page-pulse-black-seven.vercel.app/"
      target="_blank"
      rel="noopener noreferrer"
      className="text-cyan-400 hover:text-cyan-300 underline"
    >
      https://page-pulse-black-seven.vercel.app/
    </a>
  </p>
</footer>
    </div>
  );
}
