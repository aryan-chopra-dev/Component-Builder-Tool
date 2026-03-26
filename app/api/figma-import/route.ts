import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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

  if (!process.env.GROQ_API_KEY) {
    return new Response(JSON.stringify({ error: "GROQ_API_KEY is not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Validate it looks like JSON before sending to LLM
  try {
    JSON.parse(figmaJson);
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON — make sure you copied the Figma node JSON correctly." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Truncate if very large to fit context window
  const truncated = figmaJson.length > 8000
    ? figmaJson.slice(0, 8000) + "\n... (truncated)"
    : figmaJson;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Convert this Figma JSON into a React component prompt:\n\n${truncated}` },
      ],
      stream: false,
      max_tokens: 300,
      temperature: 0.4,
    });

    const prompt = completion.choices[0]?.message?.content?.trim() ?? "";

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
