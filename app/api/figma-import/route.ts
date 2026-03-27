import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_PROMPT = `You are a design-to-code expert. Your job is to analyze a Figma component's JSON node structure and convert it into a concise, precise React + Tailwind component generation prompt.

RULES:
1. Extract the visual intent: layout type (flex/grid/card/nav/etc.), colors as hex values, font sizes, spacing patterns, border radius, shadows
2. Describe interactive states if visible (hover, active, selected)
3. Output ONLY the generation prompt — no JSON, no explanation, no code
4. The prompt should be 2-4 sentences, extremely specific about design details
5. Start with the component type (e.g. "A pricing card...", "A navigation bar...", "A hero section...")

EXAMPLE OUTPUT:
A dashboard stats card with a dark background (#1e1e3a), rounded-xl corners, and a purple (#7c3aed) left accent border. Shows a metric title in gray-400, a large white number, and a small percentage badge in green. Uses a subtle glass-morphism effect with a semi-transparent background. Includes a sparkline chart area at the bottom.`;

export async function POST(req: Request) {
  const { figmaJson } = await req.json();

  if (!figmaJson || typeof figmaJson !== "string") {
    return new Response(JSON.stringify({ error: "figmaJson is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!process.env.GEMINI_API_KEY) {
    return new Response(JSON.stringify({ error: "GEMINI_API_KEY is not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let finalJsonString = figmaJson;

  // Check if it's a URL instead of JSON
  const urlMatch = figmaJson.match(/(?:file|design)\/([a-zA-Z0-9]+)\/.*[?&]node-id=([^&]+)/);
  if (urlMatch) {
    const fileKey = urlMatch[1];
    const nodeIdRaw = urlMatch[2];
    // Figma browser URLs use `-` (e.g. 123-456) or `%3A` instead of the required API colon `:`
    // We global-replace all hyphens because some deeply nested nodes have multiple (e.g. 10-20-30)
    const nodeId = decodeURIComponent(nodeIdRaw).replace(/-/g, ":").trim();

    if (!process.env.FIGMA_ACCESS_TOKEN) {
      return new Response(
        JSON.stringify({ error: "You provided a Figma URL, but FIGMA_ACCESS_TOKEN is missing in .env.local" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    try {
      const resp = await fetch(`https://api.figma.com/v1/files/${fileKey}/nodes?ids=${nodeId}`, {
        headers: { "X-Figma-Token": process.env.FIGMA_ACCESS_TOKEN },
      });
      if (!resp.ok) {
        throw new Error(`Figma API error: ${resp.status}`);
      }
      const data = await resp.json();
      const node = data.nodes[nodeId]?.document;
      if (!node) throw new Error(`Node ID '${nodeId}' not found in file.`);
      finalJsonString = JSON.stringify(node);
    } catch (e: any) {
      return new Response(JSON.stringify({ error: `Figma fetch failed: ${e.message}` }), {
        status: 500, headers: { "Content-Type": "application/json" }
      });
    }
  } else {
    // Validate it looks like JSON if not a URL
    try {
      JSON.parse(figmaJson);
    } catch {
      return new Response(
        JSON.stringify({ error: "Input must be valid JSON or a Figma URL." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  // Truncate if very large to fit context window
  const truncated = finalJsonString.length > 8000
    ? finalJsonString.slice(0, 8000) + "\n... (truncated)"
    : finalJsonString;

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 300,
      }
    });

    const result = await model.generateContent(`Convert this Figma JSON into a React component prompt:\n\n${truncated}`);
    const prompt = result.response.text().trim() ?? "";

    return new Response(JSON.stringify({ prompt }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Figma import failed";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
