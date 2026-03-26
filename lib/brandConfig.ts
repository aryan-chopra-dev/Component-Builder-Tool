export interface BrandConfig {
  enabled: boolean;
  primaryColor: string;      // hex, e.g. "#7c3aed"
  secondaryColor: string;    // hex, e.g. "#2563eb"
  bgColor: string;           // hex, e.g. "#ffffff"
  textColor: string;         // hex, e.g. "#111827"
  fontFamily: string;        // CSS font-family string, e.g. "Inter"
  borderRadius: string;      // tailwind token: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "full"
}

export const DEFAULT_BRAND: BrandConfig = {
  enabled: false,
  primaryColor: "#7c3aed",
  secondaryColor: "#2563eb",
  bgColor: "#ffffff",
  textColor: "#111827",
  fontFamily: "Inter",
  borderRadius: "lg",
};

const RADIUS_CLASS: Record<string, string> = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
  full: "rounded-full",
};

export function buildBrandPromptBlock(config: BrandConfig): string {
  const radiusClass = RADIUS_CLASS[config.borderRadius] ?? "rounded-lg";
  return `
# STRICT BRAND CONSTRAINTS — YOU MUST FOLLOW THESE EXACTLY
You are generating a component for a product with a strict design system. You MUST obey every rule below. Violating any rule is unacceptable.

1. PRIMARY COLOR: Use ONLY "${config.primaryColor}" as the primary accent. Apply it via inline style (e.g. \`style={{ backgroundColor: "${config.primaryColor}" }}\`) for any colored buttons, highlights, active states, or key accents. NEVER use violet, purple, indigo, blue, or any other Tailwind color classes for primary accents.
2. SECONDARY COLOR: Use ONLY "${config.secondaryColor}" for secondary accents (e.g. borders, secondary buttons, hover states). Apply via inline style.
3. BACKGROUND COLOR: The root container background must be "${config.bgColor}" via inline style.
4. TEXT COLOR: Default body text must be "${config.textColor}" via inline style.
5. FONT: Add \`style={{ fontFamily: "'${config.fontFamily}', sans-serif" }}\` to the root container. Do NOT use Tailwind font classes.
6. BORDER RADIUS: Use the Tailwind class \`${radiusClass}\` (and variants like \`${radiusClass.replace("rounded", "rounded-t")}\`) for ALL rounded corners. Do not deviate.
7. DO NOT use Tailwind color utility classes (e.g. bg-violet-600, text-blue-500) anywhere in the output. Use inline \`style\` for all brand colors.
`;
}
