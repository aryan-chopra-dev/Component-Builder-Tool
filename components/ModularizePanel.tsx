"use client";

import { useState } from "react";
import { FileCode2, Copy, Check, Download, ChevronRight, Layers, AlertCircle } from "lucide-react";

interface ModularizePanelProps {
  files: Record<string, string> | null;
  isLoading: boolean;
  error: string | null;
}

// Shared highlight function (mirrors CodePanel)
const highlight = (raw: string): string =>
  raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(
      /(&quot;[^&]*&quot;|'[^']*'|`[^`]*`)/g,
      '<span style="color:#a3e635">$1</span>'
    )
    .replace(
      /\b(const|let|var|function|return|export|default|import|from|if|else|for|while|class|interface|type|async|await|new|true|false|null|undefined)\b/g,
      '<span style="color:#c084fc">$1</span>'
    )
    .replace(
      /(&lt;\/?[A-Z][A-Za-z0-9]*|&lt;\/?[a-z]+)/g,
      '<span style="color:#60a5fa">$1</span>'
    )
    .replace(/\b(\d+)\b/g, '<span style="color:#f97316">$1</span>')
    .replace(
      /(\/\/[^\n]*)/g,
      '<span style="color:#6b7280;font-style:italic">$1</span>'
    );

function FileIcon({ name }: { name: string }) {
  const ext = name.split(".").pop() ?? "";
  const color =
    ext === "tsx" ? "text-blue-400" : ext === "ts" ? "text-blue-300" : "text-gray-400";
  return <FileCode2 size={13} className={color} />;
}

function countLines(code: string) {
  return code.split("\n").length;
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col h-full animate-pulse">
      <div className="flex items-center gap-2 p-4 border-b border-[#1e1e3a]">
        <Layers size={14} className="text-violet-400" />
        <span className="text-xs text-gray-400">Analyzing component structure…</span>
        <span className="ml-auto flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: "300ms" }} />
        </span>
      </div>
      <div className="flex flex-1 overflow-hidden">
        {/* File tree skeleton */}
        <div className="w-44 flex-shrink-0 border-r border-[#1e1e3a] p-3 flex flex-col gap-2">
          {[80, 60, 70, 55, 65].map((w, i) => (
            <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded">
              <div className="w-3.5 h-3.5 rounded bg-[#2d2d4e]" />
              <div className="h-2.5 rounded bg-[#2d2d4e]" style={{ width: `${w}%` }} />
            </div>
          ))}
        </div>
        {/* Code skeleton */}
        <div className="flex-1 p-4 flex flex-col gap-2">
          {[90, 70, 85, 60, 75, 80, 55, 70, 65, 80].map((w, i) => (
            <div key={i} className="h-2.5 rounded bg-[#1e1e3a]" style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ModularizePanel({ files, isLoading, error }: ModularizePanelProps) {
  const fileNames = files ? Object.keys(files) : [];
  const [activeFile, setActiveFile] = useState<string>(() => fileNames[0] ?? "");
  const [copied, setCopied] = useState(false);

  // Keep active file in sync when files change
  const resolvedActive =
    fileNames.includes(activeFile) ? activeFile : fileNames[0] ?? "";

  const activeCode = files?.[resolvedActive] ?? "";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(activeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([activeCode], { type: "text/typescript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = resolvedActive;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = () => {
    if (!files) return;
    const combined = Object.entries(files)
      .map(([name, code]) => `// ===== ${name} =====\n\n${code}`)
      .join("\n\n\n");
    const blob = new Blob([combined], { type: "text/typescript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modularized-components.tsx";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-red-400 p-8">
        <AlertCircle size={28} className="opacity-60" />
        <p className="text-sm font-medium">Modularization failed</p>
        <p className="text-xs text-red-400/60 text-center max-w-xs">{error}</p>
      </div>
    );
  }

  if (!files || fileNames.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-600 p-8">
        <Layers size={36} className="opacity-30" />
        <p className="text-sm font-medium text-gray-500">Auto-Modularization</p>
        <p className="text-xs text-gray-600 text-center max-w-xs">
          Click <span className="text-violet-400 font-medium">Split into Files</span> to have the AI
          break your component into atomic, reusable pieces.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a2e] border-b border-[#2d2d4e] flex-shrink-0">
        <div className="flex items-center gap-2">
          <Layers size={13} className="text-violet-400" />
          <span className="text-xs text-gray-400 font-medium">
            {fileNames.length} files extracted
          </span>
        </div>
        <button
          onClick={handleDownloadAll}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-[#2d2d4e] text-gray-300 hover:bg-[#3d3d6e] transition-all"
        >
          <Download size={11} />
          Download All
        </button>
      </div>

      {/* Body: file tree + code */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* File tree */}
        <div className="w-44 flex-shrink-0 border-r border-[#1e1e3a] overflow-y-auto bg-[#0a0a1a] py-2">
          {fileNames.map((name) => {
            const isActive = name === resolvedActive;
            return (
              <button
                key={name}
                onClick={() => setActiveFile(name)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors group ${
                  isActive
                    ? "bg-violet-600/20 text-violet-200"
                    : "text-gray-400 hover:bg-[#1e1e3a] hover:text-gray-200"
                }`}
              >
                <FileIcon name={name} />
                <span className="text-[11px] font-medium truncate flex-1 font-mono">{name}</span>
                {isActive && <ChevronRight size={10} className="text-violet-400 flex-shrink-0" />}
              </button>
            );
          })}

          {/* Line count footer */}
          <div className="px-3 pt-3 pb-1 border-t border-[#1e1e3a] mt-2">
            {fileNames.map((name) => (
              <div key={name} className="flex justify-between items-center py-0.5">
                <span className="text-[10px] text-gray-600 font-mono truncate">{name}</span>
                <span className="text-[10px] text-gray-600 ml-2 flex-shrink-0">
                  {countLines(files[name])}L
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Code viewer */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* File toolbar */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-[#0f0f24] border-b border-[#1e1e3a] flex-shrink-0">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
              <span className="ml-2 text-[11px] text-gray-400 font-mono">{resolvedActive}</span>
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] rounded bg-[#2d2d4e] text-gray-300 hover:bg-[#3d3d6e] transition-all"
              >
                {copied ? <Check size={10} className="text-green-400" /> : <Copy size={10} />}
                {copied ? "Copied!" : "Copy"}
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] rounded bg-[#2d2d4e] text-gray-300 hover:bg-[#3d3d6e] transition-all"
              >
                <Download size={10} />
                .tsx
              </button>
            </div>
          </div>

          {/* Code */}
          <div className="flex-1 overflow-auto bg-[#0d0d1a]">
            <pre
              className="code-font text-xs text-gray-300 p-4 m-0 whitespace-pre-wrap leading-relaxed min-h-full"
              dangerouslySetInnerHTML={{ __html: highlight(activeCode) }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
