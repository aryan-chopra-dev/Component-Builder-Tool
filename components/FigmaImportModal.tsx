"use client";

import { useState } from "react";
import { Figma, X, Loader2, Sparkles, ChevronRight } from "lucide-react";

interface FigmaImportModalProps {
  onImport: (prompt: string) => void;
  onClose: () => void;
}

const INSTRUCTIONS = [
  "In Figma, select the frame or component you want to import",
  'Right-click → "Copy/Paste as" → "Copy as JSON" (or use Ctrl+Shift+C with the Tokens plugin)',
  "Paste the copied JSON below and click Convert",
];

export default function FigmaImportModal({ onImport, onClose }: FigmaImportModalProps) {
  const [json, setJson] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConvert = async () => {
    if (!json.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/figma-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ figmaJson: json.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import failed");
      onImport(data.prompt);
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-[520px] max-w-[95vw] bg-[#0c0c1f] border border-[#2d2d4e] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e1e3a]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#ff7262] to-[#a259ff] flex items-center justify-center">
              <Figma size={14} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Import from Figma</h2>
              <p className="text-[11px] text-gray-500">Convert a Figma component to a React prompt</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors p-1">
            <X size={16} />
          </button>
        </div>

        {/* Instructions */}
        <div className="px-5 py-3 bg-[#0a0a18] border-b border-[#1e1e3a]">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-medium mb-2">How to get Figma JSON</p>
          <ol className="flex flex-col gap-1.5">
            {INSTRUCTIONS.map((step, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-[#1e1e3a] text-[10px] text-violet-400 font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-[11px] text-gray-400">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* JSON input */}
        <div className="px-5 py-4 flex flex-col gap-3">
          <label className="text-xs text-gray-400 font-medium">Paste Figma JSON</label>
          <textarea
            value={json}
            onChange={(e) => setJson(e.target.value)}
            placeholder={'{\n  "id": "1:2",\n  "name": "Card",\n  "type": "FRAME",\n  ...\n}'}
            rows={8}
            className="w-full bg-[#13132a] border border-[#2d2d4e] rounded-lg p-3 text-xs text-gray-300 font-mono resize-none focus:outline-none focus:border-violet-500 placeholder-gray-700 transition-colors"
          />

          {error && (
            <div className="text-xs text-red-400 bg-red-900/20 border border-red-900/40 rounded-lg px-3 py-2">
              ⚠ {error}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-2 text-sm text-gray-400 border border-[#2d2d4e] rounded-lg hover:border-[#4d4d7e] hover:text-gray-300 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleConvert}
              disabled={!json.trim() || isLoading}
              className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg
                bg-gradient-to-r from-[#ff7262] to-[#a259ff] text-white
                hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <><Loader2 size={13} className="animate-spin" /> Converting…</>
              ) : (
                <><Sparkles size={13} /> Convert to Prompt <ChevronRight size={13} /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
