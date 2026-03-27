import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { SYSTEM_PROMPT } from "@/lib/systemPrompt";
import { buildBrandPromptBlock, type BrandConfig } from "@/lib/brandConfig";

export async function POST(req: Request) {
  const { prompt, currentCode, history, brandConfig, temperature } = await req.json() as { prompt: string; currentCode?: string; history?: {role: string; content: string}[]; brandConfig?: BrandConfig; temperature?: number };

  if (!prompt || typeof prompt !== "string") {
    return new Response(JSON.stringify({ error: "Prompt is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!process.env.GEMINI_API_KEY) {
    return new Response(
      JSON.stringify({ error: "GEMINI_API_KEY is not configured in .env.local" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    let systemMessage = SYSTEM_PROMPT;
    if (brandConfig?.enabled) {
      systemMessage += buildBrandPromptBlock(brandConfig);
    }
    if (currentCode) {
      systemMessage += `\n\n# CURRENT CODE\nThe user already has this code. Modify it based on their new request. DO NOT start from scratch. Output the ENTIRE completely modified React component.\n\n\`\`\`tsx\n${currentCode}\n\`\`\``;
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemMessage,
      generationConfig: {
        temperature: temperature ?? 0.7,
        maxOutputTokens: 8192,
      },
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ]
    });

    const finalPrompt = currentCode ? `Update the component: ${prompt}` : `Generate a React + Tailwind component for: ${prompt}`;
    
    // Convert history format if present
    const contents = [];
    if (history && Array.isArray(history)) {
      history.forEach(msg => {
        contents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }]
        });
      });
    }
    contents.push({ role: "user", parts: [{ text: finalPrompt }] });

    const result = await model.generateContentStream({ contents });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
        } catch (e: any) {
           console.error("Stream error:", e);
           // Ignore abortion errors
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
