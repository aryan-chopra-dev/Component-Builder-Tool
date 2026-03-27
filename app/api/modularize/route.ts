import { GoogleGenerativeAI } from "@google/generative-ai";

const MODULARIZE_SYSTEM_PROMPT = `You are an expert React architect. Your job is to split a monolithic React component into well-named atomic sub-components.

RULES:
1. Analyze the component and identify logical pieces (layout, cards, buttons, forms, navigation, etc.)
2. Split it into 2-6 focused, reusable components plus one main Page/App file that imports them all.
3. Output ONLY a single valid JSON object — no markdown, no code fences, no explanations.
4. The JSON must be: { "ComponentName.tsx": "full code string", ... }
5. Each file must be a complete, standalone React component with proper exports.
6. Remove all imports from file content — React hooks (useState, useEffect, etc.) are globally available.
7. The main page file should be named after the component (e.g. "PricingPage.tsx") and import all sub-components using: const SubComp = window.SubComp; (since there's no bundler).
8. Make sure every referenced sub-component is actually defined in its own file in the output.
9. Keep all logic and data in the appropriate component. Don't create empty or trivial components.

OUTPUT FORMAT — respond with ONLY this JSON, nothing else:
{
  "MainPage.tsx": "function MainPage() { ... } export default MainPage;",
  "Button.tsx": "function Button({ children, onClick }) { ... } export default Button;",
  "Card.tsx": "function Card({ title, value }) { ... } export default Card;"
}`;

export async function POST(req: Request) {
  const { code } = await req.json();

  if (!code || typeof code !== "string") {
    return new Response(JSON.stringify({ error: "code is required" }), {
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

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: MODULARIZE_SYSTEM_PROMPT,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
      }
    });

    const result = await model.generateContent(`Split this component into atomic files:\n\n${code}`);
    const raw = result.response.text();

    let files: Record<string, string>;
    try {
      files = JSON.parse(raw);
    } catch {
      // Try to extract JSON from surrounding text
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) {
        return new Response(JSON.stringify({ error: "Failed to parse JSON from model response" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
      files = JSON.parse(match[0]);
    }

    return new Response(JSON.stringify({ files }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Modularization failed";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
