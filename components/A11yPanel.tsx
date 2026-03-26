"use client";

import { AlertCircle, AlertTriangle, Info, CheckCircle2, RefreshCw, ExternalLink } from "lucide-react";

export interface AxeViolation {
  id: string;
  impact: "critical" | "serious" | "moderate" | "minor";
  description: string;
  helpUrl: string;
  nodes: { html: string; failureSummary: string }[];
}

export interface A11yResults {
  violations: AxeViolation[];
  passes: number;
  incomplete: number;
}

interface A11yPanelProps {
  results: A11yResults | null;
  isRunning: boolean;
  onRerun: () => void;
}

const IMPACT_CONFIG = {
  critical: { color: "text-red-400", bg: "bg-red-900/20 border-red-800/40", icon: <AlertCircle size={12} />, label: "Critical" },
  serious:  { color: "text-orange-400", bg: "bg-orange-900/20 border-orange-800/40", icon: <AlertTriangle size={12} />, label: "Serious" },
  moderate: { color: "text-yellow-400", bg: "bg-yellow-900/20 border-yellow-800/40", icon: <AlertTriangle size={12} />, label: "Moderate" },
  minor:    { color: "text-blue-400", bg: "bg-blue-900/20 border-blue-800/40", icon: <Info size={12} />, label: "Minor" },
};

function ViolationCard({ v }: { v: AxeViolation }) {
  const cfg = IMPACT_CONFIG[v.impact] ?? IMPACT_CONFIG.minor;
  return (
    <div className={`rounded-lg border p-3 flex flex-col gap-2 ${cfg.bg}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className={cfg.color}>{cfg.icon}</span>
          <span className={`text-[10px] font-bold uppercase tracking-wide ${cfg.color}`}>{cfg.label}</span>
          <span className="text-[10px] text-gray-500 font-mono">{v.id}</span>
        </div>
        <a
          href={v.helpUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-600 hover:text-violet-400 transition-colors flex-shrink-0"
          title="Learn more"
        >
          <ExternalLink size={11} />
        </a>
      </div>
      <p className="text-xs text-gray-300">{v.description}</p>
      {v.nodes.slice(0, 2).map((n, i) => (
        <div key={i} className="bg-[#0d0d1a] rounded p-2">
          <code className="text-[10px] text-gray-400 font-mono block truncate">{n.html}</code>
          {n.failureSummary && (
            <p className="text-[10px] text-gray-600 mt-1">{n.failureSummary.replace(/^Fix (all|any) of the following:\s*/i, "")}</p>
          )}
        </div>
      ))}
      {v.nodes.length > 2 && (
        <p className="text-[10px] text-gray-600">+{v.nodes.length - 2} more element(s)</p>
      )}
    </div>
  );
}

export default function A11yPanel({ results, isRunning, onRerun }: A11yPanelProps) {
  if (isRunning) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-500 p-8">
        <RefreshCw size={24} className="animate-spin text-violet-400" />
        <p className="text-sm">Running accessibility audit…</p>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-600 p-8">
        <CheckCircle2 size={36} className="opacity-30" />
        <p className="text-sm font-medium text-gray-500">Accessibility Auditor</p>
        <p className="text-xs text-gray-600 text-center max-w-xs">
          Generate a component and the audit will run automatically using{" "}
          <span className="text-violet-400 font-medium">axe-core</span>.
        </p>
      </div>
    );
  }

  const { violations, passes, incomplete } = results;
  const critical = violations.filter(v => v.impact === "critical").length;
  const serious  = violations.filter(v => v.impact === "serious").length;
  const allGood  = violations.length === 0;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Summary bar */}
      <div className={`px-4 py-3 border-b flex items-center justify-between flex-shrink-0 ${
        allGood ? "border-green-900/30 bg-green-900/10" : "border-[#1e1e3a] bg-[#0c0c1f]"
      }`}>
        <div className="flex items-center gap-3">
          {allGood ? (
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle2 size={16} />
              <span className="text-sm font-medium">All checks passed</span>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-sm">
              {critical > 0 && (
                <span className="flex items-center gap-1 text-red-400">
                  <AlertCircle size={13} /> {critical} critical
                </span>
              )}
              {serious > 0 && (
                <span className="flex items-center gap-1 text-orange-400">
                  <AlertTriangle size={13} /> {serious} serious
                </span>
              )}
              {violations.length - critical - serious > 0 && (
                <span className="text-gray-400">{violations.length - critical - serious} other</span>
              )}
            </div>
          )}
          <span className="text-[10px] text-gray-600">{passes} rules passed · {incomplete} incomplete</span>
        </div>
        <button
          onClick={onRerun}
          className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-300 transition-colors"
        >
          <RefreshCw size={11} /> Re-run
        </button>
      </div>

      {/* Violations list */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {allGood ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-green-400/60">
            <CheckCircle2 size={40} />
            <p className="text-sm font-medium text-green-400">No accessibility violations found</p>
            <p className="text-xs text-gray-600">{passes} rules checked and passed</p>
          </div>
        ) : (
          ["critical", "serious", "moderate", "minor"].map(impact =>
            violations
              .filter(v => v.impact === impact)
              .map(v => <ViolationCard key={v.id} v={v} />)
          )
        )}
      </div>
    </div>
  );
}
