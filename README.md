# AI Component Generator

An advanced, production-grade AI development tool that transforms plain English and design files into modular, accessible, and brand-compliant React + Tailwind CSS components. 

Built as an extremely robust alternative to basic AI generators (like v0 or Bolt), this tool adds heavy engineering constraints like strict brand enforcement, visual DOM targeting, axe-core accessibility auditing, and auto-modularization algorithms.

## 🌟 Key Features

### 1. Visual DOM Targeting (Iterative Chat-to-Edit)
Instead of re-generating an entire UI to change a single button, click any element in the live preview iframe. The element's exact HTML is passed to the LLM (Gemini 2.5 Flash) along with your new instruction, ensuring hyper-precise edits without breaking the rest of the component.

### 2. Strict Brand Enforcement
Lock the AI into your company's design system. Configure your primary, secondary, background, and text colors along with font family and border radius. This injects hard constraints into the LLM system prompt and dynamically overrides CSS variables in the sandboxed preview, guaranteeing 100% brand adherence.

### 3. Auto-Modularization Engine
Don't settle for monolithic 500-line components. Click "Split Files" to pass the generated code through an LLM architect. It parses the monolithic file and returns a structured JSON map, breaking the UI down into atomic files (e.g., `Card.tsx`, `Button.tsx`, `Layout.tsx`).

### 4. A/B Variant Generation
Unsure of the design direction? Generate two alternative designs in parallel from the same prompt. Compare them side-by-side in real-time, pick your favourite ("Use This"), and continue editing from that specific branch.

### 5. Accessibility Auditor (`axe-core`)
After every generation, `axe-core` is automatically injected into the iframe to scan the new DOM. The "A11y" tab immediately flags Contrast, ARIA, and semantic HTML violations by severity (Critical, Serious, Moderate, Minor), mapping them alongside the exact code snippets that failed.

### 6. Figma JSON Import
Skip the prompt entirely. Copy the raw JSON structure of any node in Figma (via Right Click -> Copy as JSON) and paste it into the tool. The LLM intelligently parses the layout, colors, typography, and structure to write a highly detailed React prompt.

### 7. Responsive Viewport Constraints
Test how the AI's Tailwind utility classes hold up across devices. Toggle the live iframe preview directly between Mobile (375px), Tablet (768px), and Full Desktop constraints with a single click.

## 🛠️ Tech Stack

*   **Framework:** Next.js 14 (App Router)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS
*   **AI SDK:** Google Generative AI (`gemini-2.5-flash` model)
*   **Sandboxing:** React + Babel standalone compiled in-browser via `srcdoc` iframes
*   **Icons:** `lucide-react`

## 🚀 Getting Started

### Prerequisites
You will need Node.js installed on your machine and a free [Gemini API Key](https://aistudio.google.com/app/apikey).

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/aryan-chopra-dev/Component-Builder-Tool.git
    cd Component-Builder-Tool
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up Environment Variables:**
    Copy the sample environment file and add your Gemini API key:
    ```bash
    cp .env.local.example .env.local
    ```
    Open `.env.local` and add your key: `GEMINI_API_KEY=your_api_key_here`

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

5.  **Open the app:**
    Visit `http://localhost:3000` in your browser.

## 🏗️ Core Architecture Overview

This project bypasses common AI wrapper limitations by introducing middle-tier engineering constraints:

*   **Streaming & Token Optimization:** The `/api/generate` endpoint streams responses back to the client. Crucially, chat history is purposefully truncated; only the `currentCode` and the new instruction are sent to the LLM. This prevents token runaway during long chat sessions, drastically reducing daily token limits.
*   **In-Browser Compilation:** The `LivePreview` component does not rely on a complex Node backend to bundle code. It writes the React code, Tailwind CDN, and Babel compiler directly into an iframe's `srcdoc`, compiling React on the fly entirely in the client's browser.
*   **Cross-Frame Messaging:** The parent React app and the sandboxed iframe communicate securely via `window.postMessage`. This enables the visual targeting script (inside the iframe) to send hovering/click DOM nodes back up to the parent `Generator` state.
