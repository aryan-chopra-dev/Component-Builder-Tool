"use client";

import { useEffect, useRef, useState } from "react";
import { Crosshair } from "lucide-react";
import { type BrandConfig } from "@/lib/brandConfig";
import { type Viewport } from "./ViewportToggle";

interface LivePreviewProps {
  code: string;
  isStreaming: boolean;
  brandConfig?: BrandConfig;
  viewport?: Viewport;
  /** If true, skips selection UI (used in VariantsPanel mini previews) */
  minimal?: boolean;
}

const RADIUS_PX: Record<string, string> = {
  none: "0px", sm: "4px", md: "6px", lg: "8px", xl: "12px", "2xl": "16px", full: "9999px",
};

const GOOGLE_FONT_URL: Record<string, string> = {
  Inter: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
  Roboto: "https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap",
  Poppins: "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap",
  "DM Sans": "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap",
  Outfit: "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap",
  "Space Grotesk": "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap",
  "JetBrains Mono": "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap",
};

const VIEWPORT_WIDTH: Record<Viewport, string> = {
  mobile: "375px",
  tablet: "768px",
  desktop: "100%",
};

export default function LivePreview({ code, isStreaming, brandConfig, viewport = "desktop", minimal = false }: LivePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const lastSentCode = useRef<string>("");
  const [selectionMode, setSelectionMode] = useState(true);

  useEffect(() => {
    if (!iframeRef.current || !code.trim()) return;
    if (isStreaming) return;
    if (code === lastSentCode.current) return;
    lastSentCode.current = code;

    const clean = code
      .replace(/^```(?:tsx?|jsx?|typescript|javascript)?\n?/gim, "")
      .replace(/```$/gim, "")
      .replace(/export\s+default\s+function/g, "function")
      .replace(/export\s+default\s+[a-zA-Z0-9_]+;?/g, "")
      .replace(/export\s+const/g, "const")
      .replace(/export\s+function/g, "function")
      .replace(/import\s+[\s\S]*?from\s+['"].*?['"];?/g, "")
      .trim();

    const brandEnabled = brandConfig?.enabled ?? false;
    const brandCssVars = brandEnabled && brandConfig ? `
    :root {
      --brand-primary: ${brandConfig.primaryColor};
      --brand-secondary: ${brandConfig.secondaryColor};
      --brand-bg: ${brandConfig.bgColor};
      --brand-text: ${brandConfig.textColor};
      --brand-radius: ${RADIUS_PX[brandConfig.borderRadius] ?? "8px"};
      --brand-font: '${brandConfig.fontFamily}', sans-serif;
    }
    body { font-family: var(--brand-font) !important; }
    ` : "";

    const fontUrl = brandEnabled && brandConfig
      ? (GOOGLE_FONT_URL[brandConfig.fontFamily] ?? GOOGLE_FONT_URL["Inter"])
      : GOOGLE_FONT_URL["Inter"];

    // axe-core audit script — runs after React renders and posts results to parent
    const axeScript = minimal ? "" : `
    window.addEventListener('load', function() {
      setTimeout(function() {
        if (typeof axe === 'undefined') return;
        axe.run(document.body, { reporter: 'v2' }, function(err, results) {
          if (err) return;
          var violations = (results.violations || []).map(function(v) {
            return {
              id: v.id,
              impact: v.impact,
              description: v.description,
              helpUrl: v.helpUrl,
              nodes: (v.nodes || []).slice(0, 3).map(function(n) {
                return { html: n.html, failureSummary: n.failureSummary || '' };
              })
            };
          });
          window.parent.postMessage({
            type: 'AXE_RESULTS',
            violations: violations,
            passes: (results.passes || []).length,
            incomplete: (results.incomplete || []).length
          }, '*');
        });
      }, 800);
    });
    `;

    // Selection script with multi-select
    const selectionScript = minimal ? "" : `
    var selectedElements = [];
    var selectionEnabled = true;

    window.addEventListener('message', function(e) {
      if (e.data && e.data.type === 'SET_SELECTION_MODE') {
        selectionEnabled = e.data.enabled;
        if (!selectionEnabled) {
          selectedElements.forEach(function(el) { el.classList.remove('orchids-selected'); });
          selectedElements = [];
        }
        document.body.style.cursor = selectionEnabled ? 'crosshair' : '';
      }
    });

    function postSelections() {
      var htmlList = selectedElements.map(function(el) {
        var clone = el.cloneNode(false);
        clone.classList.remove('orchids-hover', 'orchids-selected');
        if (clone.classList.length === 0) clone.removeAttribute('class');
        var s = clone.outerHTML;
        if (el.children.length > 0) {
          var tag = clone.tagName.toLowerCase();
          var closeTag = '<' + '/' + tag + '>';
          var gtIdx = s.indexOf('>');
          if (gtIdx !== -1) { s = s.slice(0, gtIdx + 1) + ' ... ' + closeTag; }
        }
        return s;
      });
      window.parent.postMessage({ type: 'ELEMENT_SELECTED', htmlList: htmlList }, '*');
    }

    document.addEventListener('mouseover', function(e) {
      if (!selectionEnabled) return;
      if (e.target === document.body || e.target.id === 'root') return;
      e.target.classList.add('orchids-hover');
    });
    document.addEventListener('mouseout', function(e) {
      if (!selectionEnabled) return;
      e.target.classList.remove('orchids-hover');
    });
    document.addEventListener('click', function(e) {
      if (!selectionEnabled) return;
      e.preventDefault(); e.stopPropagation();
      if (e.target === document.body || e.target.id === 'root') {
        selectedElements.forEach(function(el) { el.classList.remove('orchids-selected'); });
        selectedElements = [];
        postSelections(); return;
      }
      var idx = selectedElements.indexOf(e.target);
      if (idx !== -1) {
        e.target.classList.remove('orchids-selected');
        selectedElements.splice(idx, 1);
      } else {
        e.target.classList.add('orchids-selected');
        selectedElements.push(e.target);
      }
      postSelections();
    }, true);
    `;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://cdn.tailwindcss.com"></script>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  ${minimal ? "" : '<script src="https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.9.1/axe.min.js"></script>'}
  <link href="${fontUrl}" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 16px;
      background: ${brandEnabled && brandConfig ? brandConfig.bgColor : "#f8fafc"};
      font-family: '${brandEnabled && brandConfig ? brandConfig.fontFamily : "Inter"}', sans-serif;
      min-height: 100vh;
    }
    #root { min-height: 100%; }
    .error-box {
      background: #fef2f2; border: 1px solid #fecaca;
      border-radius: 8px; padding: 16px; color: #dc2626;
      font-family: monospace; font-size: 13px; white-space: pre-wrap;
    }
    .orchids-hover {
      outline: 2px dashed #8b5cf6 !important;
      outline-offset: 2px !important; cursor: crosshair !important;
    }
    .orchids-selected {
      outline: 2px solid #ec4899 !important;
      outline-offset: 2px !important;
      background-color: rgba(236, 72, 153, 0.08) !important;
    }
    ${brandCssVars}
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-presets="react,typescript">
    const { useState, useEffect, useRef, useCallback, useMemo } = React;

    ${clean}

    const rootEl = document.getElementById('root');
    const root = ReactDOM.createRoot(rootEl);
    function App() { return <GeneratedComponent />; }
    try { root.render(<App />); }
    catch (e) { rootEl.innerHTML = '<div class="error-box">Render Error:\\n' + e.message + '</div>'; }
  </script>
  <script>
    window.addEventListener('error', function(e) {
      var root = document.getElementById('root');
      if (root && !root.children.length) {
        root.innerHTML = '<div class="error-box">Runtime Error:\\n' + e.message + '</div>';
      }
    });
    ${axeScript}
    ${selectionScript}
  </script>
</body>
</html>`;

    iframeRef.current.srcdoc = html;
  }, [code, isStreaming, brandConfig, minimal]);

  useEffect(() => {
    if (minimal) return;
    iframeRef.current?.contentWindow?.postMessage(
      { type: "SET_SELECTION_MODE", enabled: selectionMode },
      "*"
    );
  }, [selectionMode, minimal]);

  const iframeWidth = VIEWPORT_WIDTH[viewport];
  const isConstrained = viewport !== "desktop";

  return (
    <div className="relative w-full h-full flex flex-col items-center overflow-auto bg-[#f0f0fa]">
      {/* Viewport frame */}
      <div
        className={`relative h-full flex-shrink-0 bg-white ${isConstrained ? "rounded-b-xl shadow-xl border-x border-b border-gray-200 overflow-hidden" : "w-full"}`}
        style={{ width: iframeWidth, minHeight: "100%" }}
      >
        {/* Device top bar for mobile/tablet */}
        {isConstrained && (
          <div className="h-5 bg-gray-100 border-b border-gray-200 flex items-center justify-center">
            <div className="w-12 h-1 rounded-full bg-gray-300" />
          </div>
        )}

        {/* Selection toggle — only in non-minimal mode */}
        {!minimal && (
          <button
            onClick={() => setSelectionMode((v) => !v)}
            title={selectionMode ? "Selection ON" : "Selection OFF"}
            className={`absolute top-2 right-2 z-10 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-all shadow-sm ${
              selectionMode
                ? "bg-pink-600/90 border-pink-500 text-white hover:bg-pink-500"
                : "bg-white/80 border-gray-200 text-gray-400 hover:text-gray-600"
            }`}
          >
            <Crosshair size={12} />
            {selectionMode ? "Selecting" : "Select"}
          </button>
        )}

        <iframe
          ref={iframeRef}
          className="w-full border-0"
          style={{ height: isConstrained ? "calc(100% - 20px)" : "100%" }}
          sandbox="allow-scripts allow-same-origin"
          title="Component Preview"
        />
      </div>
    </div>
  );
}
