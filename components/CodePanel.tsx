"use client";

import { useState } from "react";
import { Copy, Check, Download } from "lucide-react";

interface CodePanelProps {
  code: string;
  isStreaming: boolean;
}

export default function CodePanel({ code, isStreaming }: CodePanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: "text/typescript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "GeneratedComponent.tsx";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Simple keyword-based syntax highlighting
  const highlight = (raw: string): string => {
    return raw
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      // strings
      .replace(
        /(&quot;[^&]*&quot;|'[^']*'|`[^`]*`)/g,
        '<span style="color:#a3e635">$1</span>'
      )
      // keywords
      .replace(
        /\b(const|let|var|function|return|export|default|import|from|if|else|for|while|class|interface|type|async|await|new|true|false|null|undefined)\b/g,
        '<span style="color:#c084fc">$1</span>'
      )
      // JSX tags
      .replace(
        /(&lt;\/?[A-Z][A-Za-z0-9]*|&lt;\/?[a-z]+)/g,
        '<span style="color:#60a5fa">$1</span>'
      )
      // numbers
      .replace(
        /\b(\d+)\b/g,
        '<span style="color:#f97316">$1</span>'
      )
      // comments
      .replace(
        /(\/\/[^\n]*)/g,
        '<span style="color:#6b7280;font-style:italic">$1</span>'
      );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a2e] border-b border-[#2d2d4e] rounded-t-lg">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
          <div className="w-3 h-3 rounded-full bg-[#28c840]" />
          <span className="ml-2 text-xs text-gray-400 font-mono">
            GeneratedComponent.tsx
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            disabled={!code}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-[#2d2d4e] text-gray-300 hover:bg-[#3d3d6e] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {copied ? (
              <Check size={12} className="text-green-400" />
            ) : (
              <Copy size={12} />
            )}
            {copied ? "Copied!" : "Copy"}
          </button>
          <button
            onClick={handleDownload}
            disabled={!code}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-[#2d2d4e] text-gray-300 hover:bg-[#3d3d6e] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Download size={12} />
            .tsx
          </button>
        </div>
      </div>

      {/* Code area */}
      <div className="flex-1 overflow-auto bg-[#0d0d1a] rounded-b-lg">
        {code ? (
          <pre
            className={`code-font text-sm text-gray-300 p-4 m-0 whitespace-pre-wrap leading-relaxed min-h-full ${
              isStreaming ? "cursor-blink" : ""
            }`}
            dangerouslySetInnerHTML={{ __html: highlight(code) }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-600 p-8">
            <div className="text-4xl">{"</>"}</div>
            <p className="text-sm text-center">
              Generated code will appear here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
