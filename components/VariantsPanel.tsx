"use client";

import { useState } from "react";
import { Loader2, Check, Sparkles, RefreshCw } from "lucide-react";
import LivePreview from "./LivePreview";
import { type BrandConfig } from "@/lib/brandConfig";

interface Variant {
  label: string;
  code: string;
  streaming: boolean;
}

interface VariantsPanelProps {
  variants: Variant[];
  isGenerating: boolean;
  onPickVariant: (code: string) => void;
  brandConfig?: BrandConfig;
}

function VariantCard({
  variant,
  index,
  onPick,
  brandConfig,
}: {
  variant: Variant;
  index: number;
  onPick: () => void;
  brandConfig?: BrandConfig;
}) {
  return (
    <div className="flex flex-col h-full border border-[#2d2d4e] rounded-xl overflow-hidden bg-[#0c0c1f] group">
      {/* Card header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#13132a] border-b border-[#2d2d4e] flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${index === 0 ? "bg-violet-400" : "bg-blue-400"}`} />
          <span className="text-xs font-medium text-gray-300">{variant.label}</span>
          {variant.streaming && (
            <span className="ml-1 flex gap-0.5">
              {[0, 150, 300].map(d => (
                <span key={d} className="w-1 h-1 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />
              ))}
            </span>
          )}
        </div>
        <button
          onClick={onPick}
          disabled={!variant.code || variant.streaming}
          className="flex items-center gap-1 px-2.5 py-1 text-[11px] rounded-md font-medium transition-all
            bg-gradient-to-r from-violet-600 to-blue-600 text-white
            hover:from-violet-500 hover:to-blue-500
            disabled:opacity-40 disabled:cursor-not-allowed
            shadow-sm"
        >
          <Check size={11} />
          Use This
        </button>
      </div>

      {/* Mini preview */}
      <div className="flex-1 overflow-hidden bg-white">
        {variant.code && !variant.streaming ? (
          <LivePreview code={variant.code} isStreaming={false} brandConfig={brandConfig} />
        ) : variant.streaming ? (
          <div className="w-full h-full flex items-center justify-center bg-[#f8fafc]">
            <div className="flex flex-col items-center gap-3 text-gray-400">
              <Loader2 size={20} className="animate-spin text-violet-400" />
              <p className="text-xs">Generating variant…</p>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#f8fafc]">
            <div className="text-4xl text-gray-300">✦</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VariantsPanel({
  variants,
  isGenerating,
  onPickVariant,
  brandConfig,
}: VariantsPanelProps) {
  if (!variants.length && !isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-600 p-8">
        <Sparkles size={36} className="opacity-30" />
        <p className="text-sm font-medium text-gray-500">A/B Variant Generator</p>
        <p className="text-xs text-gray-600 text-center max-w-xs">
          Click <span className="text-violet-400 font-medium">Generate Variants</span> to create 2 alternative designs from the same prompt. Pick your favourite.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a2e] border-b border-[#2d2d4e] flex-shrink-0">
        <div className="flex items-center gap-2">
          <RefreshCw size={13} className={`text-violet-400 ${isGenerating ? "animate-spin" : ""}`} />
          <span className="text-xs text-gray-400 font-medium">
            {isGenerating ? "Generating variants…" : `${variants.length} variants — pick one to use`}
          </span>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex-1 overflow-hidden p-3 grid grid-cols-2 gap-3 min-h-0">
        {variants.map((v, i) => (
          <VariantCard
            key={i}
            variant={v}
            index={i}
            onPick={() => onPickVariant(v.code)}
            brandConfig={brandConfig}
          />
        ))}
        {/* Skeleton placeholders while generating */}
        {isGenerating && variants.length < 2 &&
          Array.from({ length: 2 - variants.length }).map((_, i) => (
            <div key={`sk-${i}`} className="border border-[#2d2d4e] rounded-xl bg-[#0c0c1f] animate-pulse flex flex-col">
              <div className="h-10 bg-[#13132a] border-b border-[#2d2d4e] rounded-t-xl" />
              <div className="flex-1 flex items-center justify-center text-gray-700">
                <Loader2 size={20} className="animate-spin" />
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}
