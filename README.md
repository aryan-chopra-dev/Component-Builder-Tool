# AI Component Generator

Generate beautiful React + Tailwind UI components from plain English descriptions — with live preview and streaming code output.

Built with **Next.js 14**, **TypeScript**, **Groq (Llama-3.3-70B)**, and **Tailwind CSS**.

## Features

- ⚡ **Streaming generation** — code appears token by token, <2s to first output
- 🎨 **Live preview** — component renders instantly in a sandboxed iframe
- 📋 **Copy or download** as `.tsx` with one click
- 💡 **6 example prompts** to get started fast
- 🌙 **Dark IDE-style UI** with syntax highlighting

## Setup

### 1. Clone and install

```bash
git clone <your-repo-url>
cd ai-component-gen
npm install
```

### 2. Get a Groq API key (free)

Sign up at [https://console.groq.com](https://console.groq.com) — the free tier is generous.

### 3. Configure environment

```bash
cp .env.local.example .env.local
# Edit .env.local and add your GROQ_API_KEY
```

### 4. Run locally

```bash
npm run dev
# Open http://localhost:3000
```

### 5. Deploy to Vercel

```bash
npx vercel
# Set GROQ_API_KEY in Vercel dashboard → Settings → Environment Variables
```

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| LLM | Groq API — Llama 3.3 70B |
| Styling | Tailwind CSS |
| Preview sandbox | Babel Standalone + React CDN |
| Deployment | Vercel |

## How it works

1. User describes a component in plain English
2. Next.js API route streams the LLM response chunk-by-chunk using Groq's streaming API
3. The frontend accumulates tokens in real time via `ReadableStream`
4. The generated code is injected into a sandboxed `<iframe>` with Babel, React, and Tailwind loaded from CDN
5. The component renders live — no build step needed
