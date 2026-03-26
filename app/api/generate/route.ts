import Groq from "groq-sdk";
import { SYSTEM_PROMPT } from "@/lib/systemPrompt";
import { buildBrandPromptBlock, type BrandConfig } from "@/lib/brandConfig";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  const { prompt, currentCode, history, brandConfig } = await req.json() as { prompt: string; currentCode?: string; history?: {role: string; content: string}[]; brandConfig?: BrandConfig };

  if (!prompt || typeof prompt !== "string") {
    return new Response(JSON.stringify({ error: "Prompt is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!process.env.GROQ_API_KEY) {
    return new Response(
      JSON.stringify({ error: "GROQ_API_KEY is not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    let systemMessage = SYSTEM_PROMPT;
    if (brandConfig?.enabled) {
      systemMessage += buildBrandPromptBlock(brandConfig);
    }
    if (currentCode) {
      systemMessage += `\n\n# CURRENT CODE\nThe user already has this code. Modify it based on their new request. DO NOT start from scratch. Output the ENTIRE completely modified React component.\n\n\`\`\`tsx\n${currentCode}\n\`\`\``;
    }

    const messages = [{ role: "system", content: systemMessage }];
    
    if (history && Array.isArray(history)) {
      messages.push(...history);
    }
    
    messages.push({
      role: "user",
      content: currentCode ? `Update the component: ${prompt}` : `Generate a React + Tailwind component for: ${prompt}`,
    });

    const stream = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: messages as any,
      stream: true,
      max_tokens: 2500,
      temperature: 0.7,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || "";
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Generation failed";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
