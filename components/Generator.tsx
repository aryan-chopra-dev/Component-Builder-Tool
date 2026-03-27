"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Sparkles, Loader2, RotateCcw, Code2, Eye, Zap,
  Layers, Columns2, ShieldCheck, Figma, AlertCircle
} from "lucide-react";
import LivePreview from "./LivePreview";
import CodePanel from "./CodePanel";
import BrandPanel from "./BrandPanel";
import ModularizePanel from "./ModularizePanel";
import VariantsPanel from "./VariantsPanel";
import A11yPanel, { type A11yResults } from "./A11yPanel";
import FigmaImportModal from "./FigmaImportModal";
import ViewportToggle, { type Viewport } from "./ViewportToggle";
import { DEFAULT_BRAND, type BrandConfig } from "@/lib/brandConfig";

const EXAMPLE_PROMPTS = [
  "A pricing card with 3 tiers: Free, Pro, and Enterprise with a toggle for monthly/yearly",
  "A dark-themed stats dashboard with 4 metric cards showing revenue, users, orders, and growth",
  "An animated login form with email/password fields and social login buttons",
  "A kanban board with 3 columns: Todo, In Progress, Done — with draggable-looking cards",
  "A testimonial carousel with avatar, quote, and star rating",
  "A gradient hero section with headline, subtext, CTA buttons, and floating badge",
];

type Tab = "preview" | "code" | "modules" | "variants" | "a11y";
type Version = { prompt: string; code: string };
interface Variant { label: string; code: string; streaming: boolean }

export default function Generator() {
  const [prompt, setPrompt] = useState("");
  const [versions, setVersions] = useState<Version[]>([]);
  const [activeVersionIndex, setActiveVersionIndex] = useState(-1);
  const [selectedElements, setSelectedElements] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("preview");
  const [generationTime, setGenerationTime] = useState<number | null>(null);
  const [brandConfig, setBrandConfig] = useState<BrandConfig>(DEFAULT_BRAND);

  // Feature 1: Responsive viewport
  const [viewport, setViewport] = useState<Viewport>("desktop");

  // Feature 2: A/B Variants
  const [variants, setVariants] = useState<Variant[]>([]);
  const [isGeneratingVariants, setIsGeneratingVariants] = useState(false);

  // Feature 3: Accessibility
  const [a11yResults, setA11yResults] = useState<A11yResults | null>(null);
  const [isRunningA11y, setIsRunningA11y] = useState(false);

  // Feature 4: Figma import
  const [showFigmaModal, setShowFigmaModal] = useState(false);
  const [figmaImported, setFigmaImported] = useState(false);

  // Phase 4: Modularization
  const [moduleFiles, setModuleFiles] = useState<Record<string, string> | null>(null);
  const [isModularizing, setIsModularizing] = useState(false);
  const [moduleError, setModuleError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  // PostMessage handler for ELEMENT_SELECTED + AXE_RESULTS
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === "ELEMENT_SELECTED") {
        setSelectedElements(e.data.htmlList ?? []);
      }
      if (e.data?.type === "AXE_RESULTS") {
        setA11yResults({
          violations: e.data.violations ?? [],
          passes: e.data.passes ?? 0,
          incomplete: e.data.incomplete ?? 0,
        });
        setIsRunningA11y(false);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const generate = async (inputPrompt?: string) => {
    const basePrompt = inputPrompt ?? prompt;
    if (!basePrompt.trim() || isStreaming) return;

    let finalPrompt = basePrompt;
    if (selectedElements.length > 0) {
      const targets = selectedElements
        .map((html, i) => `Element ${i + 1}:\n\`\`\`html\n${html}\n\`\`\``)
        .join("\n\n");
      finalPrompt = `Targeting these ${selectedElements.length} specific element(s):\n\n${targets}\n\nInstruction: ${basePrompt}`;
    }

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setIsStreaming(true);
    setError(null);
    setGenerationTime(null);
    setModuleFiles(null);
    setModuleError(null);
    setVariants([]);
    setA11yResults(null);
    setFigmaImported(false);

    const history = versions.slice(0, activeVersionIndex + 1);
    const newVersionIndex = history.length;
    const t0 = Date.now();

    setVersions([...history, { prompt: finalPrompt, code: "" }]);
    setActiveVersionIndex(newVersionIndex);
    setSelectedElements([]);

    try {
      const currentCode = history.length > 0 ? history[history.length - 1].code : undefined;

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: finalPrompt, 
          currentCode, // We only send the current code, avoiding huge redundant history arrays
          brandConfig: brandConfig.enabled ? brandConfig : undefined,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setVersions(prev => {
          const next = [...prev];
          next[newVersionIndex].code = accumulated;
          return next;
        });
      }

      setGenerationTime(Math.round((Date.now() - t0) / 100) / 10);
      setActiveTab("preview");
      setIsRunningA11y(true); // will be resolved by AXE_RESULTS message
      setPrompt("");
    } catch (err: unknown) {
      if ((err as Error).name === "AbortError") return;
      setError((err as Error).message ?? "Something went wrong");
    } finally {
      setIsStreaming(false);
    }
  };

  const handleGenerateVariants = async () => {
    const lastCode = versions[activeVersionIndex]?.code;
    const lastPrompt = versions[activeVersionIndex]?.prompt;
    if (!lastPrompt || isGeneratingVariants) return;

    setIsGeneratingVariants(true);
    setVariants([
      { label: "Variant A", code: "", streaming: true },
      { label: "Variant B", code: "", streaming: true },
    ]);
    setActiveTab("variants");

    const variantPrompts = [
      `VARIANT A: Drastically redesign this. Change the layout entirely (e.g. from vertical to horizontal grid). Use very different spacing, a minimalist structured look, subtle borders, and new styling for: ${lastPrompt}`,
      `VARIANT B: Drastically redesign this. Use a completely different layout. Make it look bold, modern, and high-end with soft shadows, glassmorphism, or floating rounded elements for: ${lastPrompt}`,
    ];

    const body = (vp: string) => JSON.stringify({
      prompt: vp,
      currentCode: lastCode,
      brandConfig: brandConfig.enabled ? brandConfig : undefined,
      temperature: 0.95,
    });

    const fetchVariant = async (vp: string, index: number) => {
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: body(vp),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let acc = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          setVariants(prev => {
            const next = [...prev];
            next[index] = { ...next[index], code: acc };
            return next;
          });
        }
        setVariants(prev => {
          const next = [...prev];
          next[index] = { ...next[index], streaming: false };
          return next;
        });
      } catch {
        setVariants(prev => {
          const next = [...prev];
          next[index] = { ...next[index], streaming: false, code: lastCode ?? "" };
          return next;
        });
      }
    };

    await Promise.all(variantPrompts.map((vp, i) => fetchVariant(vp, i)));
    setIsGeneratingVariants(false);
  };

  const handlePickVariant = (code: string) => {
    const newVersionIndex = versions.length;
    setVersions(prev => [...prev, { prompt: "(Variant selected)", code }]);
    setActiveVersionIndex(newVersionIndex);
    setVariants([]);
    setActiveTab("preview");
  };

  const handleModularize = async () => {
    const code = versions[activeVersionIndex]?.code;
    if (!code || isModularizing) return;
    setIsModularizing(true);
    setModuleError(null);
    setModuleFiles(null);
    setActiveTab("modules");
    try {
      const res = await fetch("/api/modularize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setModuleFiles(data.files);
    } catch (err: unknown) {
      setModuleError((err as Error).message ?? "Modularization failed");
    } finally {
      setIsModularizing(false);
    }
  };

  const handleA11yRerun = useCallback(() => {
    setIsRunningA11y(true);
    setA11yResults(null);
    // The AXE_RESULTS will come from the iframe after it re-runs
    // Trigger a re-run by sending a message to the iframe
    const iframe = document.querySelector("iframe[title='Component Preview']") as HTMLIFrameElement;
    iframe?.contentWindow?.postMessage({ type: "RERUN_AXE" }, "*");
  }, []);

  const handleFigmaImport = (importedPrompt: string) => {
    setPrompt(importedPrompt);
    setFigmaImported(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); generate(); }
  };

  const handleExampleClick = (ex: string) => { setPrompt(ex); generate(ex); };

  const handleReset = () => {
    abortRef.current?.abort();
    setVersions([]); setActiveVersionIndex(-1);
    setError(null); setIsStreaming(false);
    setGenerationTime(null); setPrompt("");
    setSelectedElements([]); setModuleFiles(null);
    setModuleError(null); setVariants([]);
    setA11yResults(null); setIsRunningA11y(false);
    setFigmaImported(false);
  };

  const activeCode = versions[activeVersionIndex]?.code || "";
  const violationCount = a11yResults?.violations.length ?? 0;

  const TABS: { id: Tab; label: string; icon: React.ReactNode; badge?: React.ReactNode; show: boolean }[] = [
    { id: "preview",  label: "Preview",  icon: <Eye size={13} />,       show: true },
    { id: "code",     label: "Code",     icon: <Code2 size={13} />,     show: true },
    { id: "modules",  label: "Modules",  icon: <Layers size={13} />,    show: !!activeCode,
      badge: (moduleFiles || isModularizing) ? <span className={`w-1.5 h-1.5 rounded-full ${isModularizing ? "bg-violet-400 animate-pulse" : "bg-green-400"}`} /> : undefined },
    { id: "variants", label: "Variants", icon: <Columns2 size={13} />,  show: !!activeCode,
      badge: (variants.length || isGeneratingVariants) ? <span className={`w-1.5 h-1.5 rounded-full ${isGeneratingVariants ? "bg-violet-400 animate-pulse" : "bg-blue-400"}`} /> : undefined },
    { id: "a11y",     label: "A11y",     icon: <ShieldCheck size={13} />, show: !!activeCode,
      badge: a11yResults ? (
        violationCount > 0
          ? <span className="text-[9px] font-bold bg-red-600 text-white rounded-full px-1 min-w-[14px] text-center leading-[14px]">{violationCount}</span>
          : <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
      ) : isRunningA11y ? <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" /> : undefined },
  ];

  return (
    <div className="min-h-screen bg-[#08081a] text-white flex flex-col">
      {/* ── Header ── */}
      <header className="border-b border-[#1e1e3a] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
            <Sparkles size={16} />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-wide gradient-text">AI Component Generator</h1>
            <p className="text-xs text-gray-500">React + Tailwind, from plain English</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {brandConfig.enabled && (
            <div className="flex items-center gap-1.5 text-[11px] text-pink-300 bg-pink-900/20 border border-pink-800/40 rounded-full px-2.5 py-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: brandConfig.primaryColor }} />
              Brand Active
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Zap size={12} className="text-yellow-400" />
            Powered by Gemini 2.5 Flash
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 65px)" }}>
        {/* ── Left Panel ── */}
        <div className="w-[340px] flex-shrink-0 border-r border-[#1e1e3a] flex flex-col bg-[#0c0c1f]">
          <div className="p-4 flex flex-col gap-4 flex-1 overflow-auto">
            {/* Prompt area */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-widest">Describe your component</label>
                <button
                  onClick={() => setShowFigmaModal(true)}
                  title="Import from Figma"
                  className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-[#a259ff] transition-colors px-1.5 py-1 rounded border border-transparent hover:border-[#a259ff]/30 hover:bg-[#a259ff]/10"
                >
                  <Figma size={11} />
                  Figma
                </button>
              </div>

              {figmaImported && (
                <div className="text-[10px] text-[#a259ff] bg-[#a259ff]/10 border border-[#a259ff]/30 rounded-t-lg px-2.5 py-1.5 flex items-center gap-1.5">
                  <Figma size={10} /> Imported from Figma — edit prompt if needed
                </div>
              )}

              {selectedElements.length > 0 && (
                <div className={`bg-[#1e1e3a]/80 border-x border-t border-[#4d4d7e] shadow-inner ${figmaImported ? "" : "rounded-t-lg"}`}>
                  <div className="flex items-center justify-between px-2.5 pt-2 pb-1">
                    <span className="text-pink-400 font-semibold text-[10px] flex items-center gap-1.5">
                      <Zap size={10} className="fill-pink-400" />
                      {selectedElements.length} Target{selectedElements.length > 1 ? "s" : ""} Selected
                    </span>
                    <button onClick={() => setSelectedElements([])} className="text-[10px] text-gray-500 hover:text-pink-400 transition-colors">
                      Clear all
                    </button>
                  </div>
                  <div className="flex flex-col gap-0.5 px-2 pb-2 max-h-24 overflow-y-auto">
                    {selectedElements.map((html, i) => (
                      <div key={i} className="flex items-center gap-1.5 bg-[#0c0c1f]/60 rounded px-2 py-1">
                        <span className="text-[9px] text-pink-500 font-mono font-bold w-3 flex-shrink-0">{i + 1}</span>
                        <code className="text-pink-200/60 truncate font-mono text-[10px] flex-1">{html}</code>
                        <button onClick={() => setSelectedElements(prev => prev.filter((_, j) => j !== i))} className="text-gray-600 hover:text-pink-400 flex-shrink-0 transition-colors">✕</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <textarea
                value={prompt}
                onChange={(e) => { setPrompt(e.target.value); if (figmaImported) setFigmaImported(false); }}
                onKeyDown={handleKeyDown}
                placeholder="e.g. A pricing card with 3 tiers..."
                rows={6}
                className={`w-full bg-[#13132a] text-sm text-gray-200 border border-[#2d2d4e] p-3 resize-none focus:outline-none focus:border-violet-500 placeholder-gray-600 transition-colors ${(selectedElements.length > 0 || figmaImported) ? "rounded-b-lg border-t-0 bg-[#0f0f23]" : "rounded-lg"}`}
              />
              <p className="text-xs text-gray-600 mt-1.5">⌘ + Enter to generate</p>
            </div>

            {/* Generate */}
            <button
              onClick={() => generate()}
              disabled={!prompt.trim() || isStreaming}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm
                bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500
                disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-900/20"
            >
              {isStreaming ? <><Loader2 size={14} className="animate-spin" /> Generating…</> : <><Sparkles size={14} />{versions.length > 0 ? "Update Component" : "Generate Component"}</>}
            </button>

            {/* Action buttons row */}
            {activeCode && !isStreaming && (
              <div className="grid grid-cols-2 gap-2">
                <button onClick={handleGenerateVariants} disabled={isGeneratingVariants}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium border border-violet-600/40 text-violet-300 bg-violet-600/10 hover:bg-violet-600/20 hover:border-violet-500/60 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                  {isGeneratingVariants ? <Loader2 size={11} className="animate-spin" /> : <Columns2 size={11} />}
                  Variants
                </button>
                <button onClick={handleModularize} disabled={isModularizing}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium border border-violet-600/40 text-violet-300 bg-violet-600/10 hover:bg-violet-600/20 hover:border-violet-500/60 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                  {isModularizing ? <Loader2 size={11} className="animate-spin" /> : <Layers size={11} />}
                  Split Files
                </button>
              </div>
            )}

            {/* Reset */}
            {versions.length > 0 && (
              <button onClick={handleReset}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm text-gray-400 border border-[#2d2d4e] hover:border-[#4d4d7e] hover:text-gray-300 transition-all">
                <RotateCcw size={13} /> Reset
              </button>
            )}

            {generationTime !== null && generationTime > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-green-400 bg-green-900/20 border border-green-900/40 rounded-lg px-3 py-2">
                <Zap size={11} /> Generated in {generationTime}s
              </div>
            )}
            {error && (
              <div className="flex items-start gap-1.5 text-xs text-red-400 bg-red-900/20 border border-red-900/40 rounded-lg px-3 py-2">
                <AlertCircle size={12} className="flex-shrink-0 mt-0.5" /> {error}
              </div>
            )}

            {/* Brand panel */}
            <BrandPanel config={brandConfig} onChange={setBrandConfig} />

            {/* Examples */}
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-2">Examples</p>
              <div className="flex flex-col gap-1.5">
                {EXAMPLE_PROMPTS.map((ex) => (
                  <button key={ex} onClick={() => handleExampleClick(ex)} disabled={isStreaming}
                    className="text-left text-xs text-gray-400 px-3 py-2 rounded-md bg-[#13132a] hover:bg-[#1e1e3a] hover:text-gray-200 border border-[#2d2d4e] hover:border-[#4d4d7e] transition-all disabled:opacity-40 disabled:cursor-not-allowed line-clamp-2">
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Panel ── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Tab bar */}
          <div className="flex items-center border-b border-[#1e1e3a] px-4 bg-[#0c0c1f] gap-0 flex-wrap">
            {TABS.filter(t => t.show).map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-3 text-xs border-b-2 transition-all ${
                  activeTab === tab.id ? "border-violet-500 text-violet-400" : "border-transparent text-gray-500 hover:text-gray-300"
                }`}>
                {tab.icon}{tab.label}
                {tab.badge && <span className="ml-0.5">{tab.badge}</span>}
              </button>
            ))}

            {/* Viewport toggle — only on preview tab */}
            {activeTab === "preview" && activeCode && (
              <ViewportToggle value={viewport} onChange={setViewport} />
            )}

            {/* Version timeline */}
            {versions.length > 1 && (
              <div className="ml-auto flex items-center gap-1 text-xs text-gray-400 bg-[#13132a] rounded-full px-2 py-1 border border-[#2d2d4e]">
                <button onClick={() => setActiveVersionIndex(Math.max(0, activeVersionIndex - 1))} disabled={activeVersionIndex === 0}
                  className="p-1 hover:text-white disabled:opacity-30 transition-all rounded-full hover:bg-[#1e1e3a]">◀</button>
                <span className="font-medium whitespace-nowrap min-w-[60px] text-center text-[11px]">v{activeVersionIndex + 1}/{versions.length}</span>
                <button onClick={() => setActiveVersionIndex(Math.min(versions.length - 1, activeVersionIndex + 1))} disabled={activeVersionIndex === versions.length - 1}
                  className="p-1 hover:text-white disabled:opacity-30 transition-all rounded-full hover:bg-[#1e1e3a]">▶</button>
              </div>
            )}

            {isStreaming && (
              <div className="flex items-center gap-1.5 text-xs text-violet-400 ml-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" /> Streaming…
              </div>
            )}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-hidden p-4">
            {/* Preview */}
            <div className={`h-full rounded-lg overflow-hidden border border-[#1e1e3a] ${activeTab === "preview" ? "block" : "hidden"}`}>
              {activeCode ? (
                <LivePreview code={activeCode} isStreaming={isStreaming} brandConfig={brandConfig} viewport={viewport} />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-[#f8fafc]">
                  <div className="text-6xl text-gray-300">🎨</div>
                  <p className="text-gray-400 text-sm">Your component preview will appear here</p>
                  <p className="text-gray-300 text-xs">Try one of the examples on the left →</p>
                </div>
              )}
            </div>

            {/* Code */}
            <div className={`h-full rounded-lg overflow-hidden border border-[#1e1e3a] ${activeTab === "code" ? "block" : "hidden"}`}>
              <CodePanel code={activeCode} isStreaming={isStreaming} />
            </div>

            {/* Modules */}
            <div className={`h-full rounded-lg overflow-hidden border border-[#1e1e3a] bg-[#0d0d1a] ${activeTab === "modules" ? "block" : "hidden"}`}>
              <ModularizePanel files={moduleFiles} isLoading={isModularizing} error={moduleError} />
            </div>

            {/* Variants */}
            <div className={`h-full rounded-lg overflow-hidden border border-[#1e1e3a] bg-[#0d0d1a] ${activeTab === "variants" ? "block" : "hidden"}`}>
              <VariantsPanel variants={variants} isGenerating={isGeneratingVariants} onPickVariant={handlePickVariant} brandConfig={brandConfig} />
            </div>

            {/* A11y */}
            <div className={`h-full rounded-lg overflow-hidden border border-[#1e1e3a] bg-[#0d0d1a] ${activeTab === "a11y" ? "block" : "hidden"}`}>
              <A11yPanel results={a11yResults} isRunning={isRunningA11y} onRerun={handleA11yRerun} />
            </div>
          </div>
        </div>
      </div>

      {/* Figma import modal */}
      {showFigmaModal && (
        <FigmaImportModal
          onImport={handleFigmaImport}
          onClose={() => setShowFigmaModal(false)}
        />
      )}
    </div>
  );
}
