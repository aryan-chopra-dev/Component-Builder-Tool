"use client";

import { Monitor, Tablet, Smartphone } from "lucide-react";

export type Viewport = "mobile" | "tablet" | "desktop";

interface ViewportToggleProps {
  value: Viewport;
  onChange: (v: Viewport) => void;
}

const OPTIONS: { id: Viewport; icon: React.ReactNode; label: string; width: string }[] = [
  { id: "mobile",  icon: <Smartphone size={13} />, label: "375px",  width: "375px"  },
  { id: "tablet",  icon: <Tablet      size={13} />, label: "768px",  width: "768px"  },
  { id: "desktop", icon: <Monitor     size={13} />, label: "Full",   width: "100%"   },
];

export default function ViewportToggle({ value, onChange }: ViewportToggleProps) {
  return (
    <div className="flex items-center gap-0.5 bg-[#13132a] border border-[#2d2d4e] rounded-md p-0.5 ml-2">
      {OPTIONS.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          title={o.label}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${
            value === o.id
              ? "bg-violet-600 text-white"
              : "text-gray-500 hover:text-gray-300"
          }`}
        >
          {o.icon}
          <span className="hidden sm:inline text-[10px]">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

export { OPTIONS };
