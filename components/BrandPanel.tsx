"use client";

import { useState } from "react";
import { Paintbrush, ChevronDown, ChevronUp, ToggleLeft, ToggleRight } from "lucide-react";
import { BrandConfig } from "@/lib/brandConfig";

interface BrandPanelProps {
  config: BrandConfig;
  onChange: (updated: BrandConfig) => void;
}

const FONTS = ["Inter", "Roboto", "Poppins", "DM Sans", "Outfit", "Space Grotesk", "JetBrains Mono"];
const RADII = ["none", "sm", "md", "lg", "xl", "2xl", "full"] as const;
const RADII_LABELS: Record<string, string> = {
  none: "None", sm: "Small", md: "Medium", lg: "Large", xl: "XL", "2xl": "2XL", full: "Full",
};

function ColorSwatch({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[11px] text-gray-400">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-gray-500 font-mono">{value}</span>
        <label className="relative w-6 h-6 rounded cursor-pointer border border-[#2d2d4e] overflow-hidden hover:scale-110 transition-transform">
          <div className="w-full h-full" style={{ backgroundColor: value }} />
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          />
        </label>
      </div>
    </div>
  );
}

export default function BrandPanel({ config, onChange }: BrandPanelProps) {
  const [open, setOpen] = useState(false);

  const set = <K extends keyof BrandConfig>(key: K, value: BrandConfig[K]) =>
    onChange({ ...config, [key]: value });

  return (
    <div className="border border-[#2d2d4e] rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-[#13132a] hover:bg-[#1a1a30] transition-colors group"
      >
        <div className="flex items-center gap-2">
          <Paintbrush size={12} className="text-violet-400" />
          <span className="text-xs font-medium text-gray-300">Brand System</span>
          {config.enabled && (
            <span className="text-[10px] bg-pink-600/30 text-pink-300 border border-pink-700/40 px-1.5 py-0.5 rounded-full font-medium">
              Active
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Mini palette preview */}
          <div className="flex gap-0.5">
            {[config.primaryColor, config.secondaryColor, config.bgColor, config.textColor].map((c, i) => (
              <div
                key={i}
                className="w-3 h-3 rounded-full border border-white/10"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          {open ? <ChevronUp size={12} className="text-gray-500" /> : <ChevronDown size={12} className="text-gray-500" />}
        </div>
      </button>

      {/* Body */}
      {open && (
        <div className="p-3 bg-[#0c0c1f] flex flex-col gap-4 border-t border-[#1e1e3a]">

          {/* Enable toggle */}
          <button
            onClick={() => set("enabled", !config.enabled)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-md border transition-all text-xs font-medium ${
              config.enabled
                ? "bg-pink-600/20 border-pink-600/40 text-pink-300"
                : "bg-[#13132a] border-[#2d2d4e] text-gray-400 hover:text-gray-200 hover:border-[#4d4d7e]"
            }`}
          >
            <span>{config.enabled ? "Brand Enforcement ON" : "Brand Enforcement OFF"}</span>
            {config.enabled
              ? <ToggleRight size={16} className="text-pink-400" />
              : <ToggleLeft size={16} className="text-gray-500" />
            }
          </button>

          {/* Colors */}
          <div className="flex flex-col gap-2">
            <p className="text-[10px] uppercase tracking-widest text-gray-600 font-medium">Colors</p>
            <ColorSwatch label="Primary" value={config.primaryColor} onChange={(v) => set("primaryColor", v)} />
            <ColorSwatch label="Secondary" value={config.secondaryColor} onChange={(v) => set("secondaryColor", v)} />
            <ColorSwatch label="Background" value={config.bgColor} onChange={(v) => set("bgColor", v)} />
            <ColorSwatch label="Text" value={config.textColor} onChange={(v) => set("textColor", v)} />
          </div>

          {/* Font */}
          <div className="flex flex-col gap-2">
            <p className="text-[10px] uppercase tracking-widest text-gray-600 font-medium">Font Family</p>
            <div className="flex flex-wrap gap-1.5">
              {FONTS.map((f) => (
                <button
                  key={f}
                  onClick={() => set("fontFamily", f)}
                  className={`text-[11px] px-2 py-1 rounded border transition-all ${
                    config.fontFamily === f
                      ? "bg-violet-600/30 border-violet-500/50 text-violet-300"
                      : "bg-[#13132a] border-[#2d2d4e] text-gray-400 hover:text-gray-200 hover:border-[#4d4d7e]"
                  }`}
                  style={{ fontFamily: `'${f}', sans-serif` }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Border Radius */}
          <div className="flex flex-col gap-2">
            <p className="text-[10px] uppercase tracking-widest text-gray-600 font-medium">Border Radius</p>
            <div className="flex gap-1.5 flex-wrap">
              {RADII.map((r) => (
                <button
                  key={r}
                  onClick={() => set("borderRadius", r)}
                  className={`text-[11px] px-2 py-1 border transition-all ${
                    config.borderRadius === r
                      ? "bg-violet-600/30 border-violet-500/50 text-violet-300"
                      : "bg-[#13132a] border-[#2d2d4e] text-gray-400 hover:text-gray-200 hover:border-[#4d4d7e]"
                  } ${r === "none" ? "rounded-none" : r === "sm" ? "rounded-sm" : r === "md" ? "rounded-md" : r === "lg" ? "rounded-lg" : r === "xl" ? "rounded-xl" : r === "2xl" ? "rounded-2xl" : "rounded-full"}`}
                >
                  {RADII_LABELS[r]}
                </button>
              ))}
            </div>
          </div>

          {/* Live preview swatch */}
          <div className="flex flex-col gap-1.5">
            <p className="text-[10px] uppercase tracking-widest text-gray-600 font-medium">Preview</p>
            <div
              className="p-3 flex items-center gap-2 border border-[#2d2d4e]"
              style={{
                backgroundColor: config.bgColor,
                fontFamily: `'${config.fontFamily}', sans-serif`,
                borderRadius: config.borderRadius === "none" ? "0" : config.borderRadius === "sm" ? "4px" : config.borderRadius === "md" ? "6px" : config.borderRadius === "lg" ? "8px" : config.borderRadius === "xl" ? "12px" : config.borderRadius === "2xl" ? "16px" : "9999px",
              }}
            >
              <button
                className="text-[11px] px-3 py-1.5 text-white font-medium shadow-sm"
                style={{
                  backgroundColor: config.primaryColor,
                  borderRadius: "inherit",
                }}
              >
                Primary
              </button>
              <button
                className="text-[11px] px-3 py-1.5 font-medium"
                style={{
                  backgroundColor: config.secondaryColor,
                  color: config.bgColor,
                  borderRadius: "inherit",
                }}
              >
                Secondary
              </button>
              <span className="text-[11px] font-medium" style={{ color: config.textColor }}>
                Aa {config.fontFamily}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
