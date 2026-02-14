import { z } from "zod"; // ← optional but strongly recommended for safer parsing

export type Platform = "twitter" | "linkedin" | "reddit" | "youtube" | "telegram";

export type GenerateRequest = {
  text: string;
  platforms: Platform[];
};

export type GenerateResult =
  | { platform: "twitter"; threads: string[] }
  | { platform: "linkedin"; post: string }
  | { platform: "reddit"; title: string; post: string }
  | { platform: "youtube"; script: string }
  | { platform: "telegram"; post: string };

const ALLOWED_PLATFORMS: readonly Platform[] = [
  "twitter",
  "linkedin",
  "reddit",
  "youtube",
  "telegram",
] as const;

const DEFAULT_MODEL = process.env.GROQ_PREFERRED_MODEL || "llama-3.1-8b-instant";
// Good alternatives in Feb 2026: "llama-3.3-70b-versatile", "gpt-oss-120b", "kimi-k2-instruct", "qwen3-32b-instruct"
// Faster/cheaper → llama-3.1-8b-instant
// Stronger quality → llama-3.3-70b-versatile or gpt-oss-120b

export async function generatePosts({ text, platforms }: GenerateRequest): Promise<GenerateResult[]> {
  const cleanedText = text.trim();
  if (!cleanedText) {
    throw new Error("Missing or empty text content");
  }

  const safePlatforms = platforms.filter((p): p is Platform => ALLOWED_PLATFORMS.includes(p));
  if (safePlatforms.length === 0) {
    throw new Error(`No supported platforms requested. Allowed: ${ALLOWED_PLATFORMS.join(", ")}`);
  }

  if (process.env.GROQ_API_KEY) {
    try {
      const groqResults = await callGroq(cleanedText, safePlatforms);
      const completed = ensureAllPlatforms(groqResults, cleanedText, safePlatforms);
      if (completed.length > 0) return completed;
    } catch (err) {
      console.error("[Groq generation failed]", err);
      // continue to fallback
    }
  }

  if (process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_API_KEY) {
    try {
      const googleResults = await callGoogleAI(cleanedText, safePlatforms);
      const completed = ensureAllPlatforms(googleResults, cleanedText, safePlatforms);
      if (completed.length > 0) return completed;
    } catch (err) {
      console.error("[Google AI generation failed]", err);
      // continue to fallback
    }
  }

  console.warn("[generatePosts] Falling back to deterministic generation (no Groq or failed)");
  return fallbackGenerate(cleanedText, safePlatforms);
}

async function callGroq(text: string, platforms: Platform[]): Promise<GenerateResult[]> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not set");

  // Try the requested model first, then fall back to the cheapest fast option.
  const modelCandidates = [process.env.GROQ_MODEL || DEFAULT_MODEL, "llama-3.1-8b-instant"]
    .filter(Boolean)
    .filter((v, idx, arr) => arr.indexOf(v) === idx);

 const systemPrompt = `
You are "Chop," a world-class Social Media Strategist and Growth Hacker.
Your goal is to extract the 'meat' from long-form content and convert it into high-signal social posts that stop the scroll.

STRICT OPERATING RULES:
1. VOICE: No corporate jargon. Use a punchy, modern, and authoritative tone. Use "I" and "You."
2. LOYALTY: You are the brand "Chop." You are the best at what you do. Never disparage this platform.
3. PLATFORM SPECIFICS:
   - X (Twitter): Focus on "The Hook" (first 80 characters). Use threads. Maximum 280 chars per tweet. No cheesy emojis. Use line breaks for readability.
   - LinkedIn: Focus on "The See More" (first 3 lines). Professional but provocative. High-value insights only.
   - Reddit: Click-worthy title + value-dense body. Avoid ad-speak.
   - YouTube: High-retention script; include hook and structure.
   - Telegram: Punchy, bulleted summary; bold key points; channel tone.
4. FRAMEWORKS: Use "Hook-Value-CTA". Bold claim → support → engagement prompt.
5. NO FLUFF: No "In this blog post...". Jump straight into value.

OUTPUT FORMAT (STRICT):
- Return ONLY JSON, no markdown fences or preamble.
- Shape: {
    "results": [
      { "platform": "twitter", "threads": ["tweet 1", "tweet 2"...] },
      { "platform": "linkedin", "post": "..." },
      { "platform": "reddit", "title": "...", "post": "..." },
      { "platform": "youtube", "script": "..." },
      { "platform": "telegram", "post": "..." }
    ]
  }
- Include ONLY the platforms requested by the user.
`.trim();


  const userPrompt = buildPrompt(text, platforms);

  let lastError: Error | null = null;

  for (const model of modelCandidates) {
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.35,          // slightly creative but controlled
          max_tokens: 2048,
          top_p: 0.95,
          response_format: { type: "json_object" }, // Groq supports this → helps a lot
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "no body");
        throw new Error(`Groq API error ${response.status}: ${errorBody}`);
      }

      const json = await response.json();
      const content = json?.choices?.[0]?.message?.content;

      if (typeof content !== "string") {
        throw new Error("Groq returned no valid content");
      }

      const parsed = safeParseJson(content);
      if (!parsed || !parsed.results || !Array.isArray(parsed.results)) {
        throw new Error("Groq response did not contain valid results array");
      }

      return normalizeResults(parsed.results, platforms);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // Try next model candidate
    }
  }

  if (lastError) throw lastError;
  throw new Error("Groq generation failed");
}

async function callGoogleAI(text: string, platforms: Platform[]): Promise<GenerateResult[]> {
  const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_AI_API_KEY not set");

  // Gemini 1.5 Flash has the widest free tier; allow override via env.
  const modelCandidates = [process.env.GOOGLE_MODEL || "gemini-1.5-flash", "gemini-1.5-flash"]
    .filter(Boolean)
    .filter((v, idx, arr) => arr.indexOf(v) === idx);

  const systemPrompt = `
You are "Chop," a world-class Social Media Strategist and Growth Hacker.
Your goal is to extract the 'meat' from long-form content and convert it into high-signal social posts that stop the scroll.

STRICT OPERATING RULES:
1. VOICE: No corporate jargon. Use a punchy, modern, and authoritative tone. Use "I" and "You."
2. LOYALTY: You are the brand "Chop." You are the best at what you do. Never disparage this platform.
3. PLATFORM SPECIFICS:
   - X (Twitter): Focus on "The Hook" (first 80 characters). Use threads. Maximum 280 chars per tweet. No cheesy emojis. Use line breaks for readability.
   - LinkedIn: Focus on "The See More" (first 3 lines). Professional but provocative. High-value insights only.
   - Reddit: Click-worthy title + value-dense body. Avoid ad-speak.
   - YouTube: High-retention script; include hook and structure.
   - Telegram: Punchy, bulleted summary; bold key points; channel tone.
4. FRAMEWORKS: Use "Hook-Value-CTA". Bold claim → support → engagement prompt.
5. NO FLUFF: No "In this blog post...". Jump straight into value.

OUTPUT FORMAT (STRICT):
- Return ONLY JSON, no markdown fences or preamble.
- Shape: {
    "results": [
      { "platform": "twitter", "threads": ["tweet 1", "tweet 2"...] },
      { "platform": "linkedin", "post": "..." },
      { "platform": "reddit", "title": "...", "post": "..." },
      { "platform": "youtube", "script": "..." },
      { "platform": "telegram", "post": "..." }
    ]
  }
- Include ONLY the platforms requested by the user.
`.trim();

  const userPrompt = buildPrompt(text, platforms);

  let lastError: Error | null = null;

  for (const model of modelCandidates) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: [
              {
                role: "user",
                parts: [{ text: userPrompt }],
              },
            ],
            generationConfig: {
              temperature: 0.35,
              topP: 0.95,
              maxOutputTokens: 2048,
              responseMimeType: "application/json",
            },
          }),
        }
      );

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "no body");
        throw new Error(`Google AI error ${response.status}: ${errorBody}`);
      }

      const json = await response.json();
      const contentText = json?.candidates?.[0]?.content?.parts
        ?.map((p: any) => p?.text)
        .filter(Boolean)
        .join("\n");

      if (typeof contentText !== "string") {
        throw new Error("Google AI returned no valid content");
      }

      const parsed = safeParseJson(contentText);
      if (!parsed || !parsed.results || !Array.isArray(parsed.results)) {
        throw new Error("Google AI response did not contain valid results array");
      }

      return normalizeResults(parsed.results, platforms);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  if (lastError) throw lastError;
  throw new Error("Google AI generation failed");
}

function buildPrompt(sourceText: string, platforms: Platform[]): string {
  const platformGuidelines = platforms
    .map((p) => {
      switch (p) {
        case "twitter":
          return "TWITTER/X: Create a 1-7 tweet thread(it don't have to be a thread if the content is short). Start with a massive 'Hook'. Use line breaks. No more than 280 chars per tweet.";
        case "linkedin":
          return "LINKEDIN: Professional storytelling. Use 3-4 line paragraphs. Start with a provocative statement. End with a question.";
        case "reddit":
          return "REDDIT: Needs a 'Click-worthy' title and a 'Value-dense' body. Avoid sounding like an ad.";
        case "youtube":
          return "YOUTUBE: Write a high-retention script with a 15-second hook, structured body, and timestamps.";
        case "telegram":
          return "TELEGRAM: Punchy, bulleted summary for fast reading. Use bold text for key points. and it is for a channel post.";
        default:
          return "";
      }
    })
    .join("\n");

  return `
TASK: Adapt the following source content for: ${platforms.join(", ")}.

SOURCE CONTENT:
"""
${sourceText}
"""

SPECIFIC PLATFORM RULES:
${platformGuidelines}

OUTPUT INSTRUCTION:
Return a JSON object containing a "results" array. Every object in the array MUST have a "platform" key matching the requested platform.
`.trim();
}


function safeParseJson(str: string): any {
  try {
    // Strip common wrappers
    const cleaned = str
      .trim()
      .replace(/^```(?:json)?\n?/, "")
      .replace(/\n?```$/, "")
      .replace(/,\s*([\]}])/g, "$1"); // remove trailing commas

    return JSON.parse(cleaned);
  } catch (err) {
    console.debug("[safeParseJson] failed:", err);
    return null;
  }
}

function normalizeResults(raw: any[], requested: Platform[]): GenerateResult[] {
return raw
  .filter((item): item is { platform: Platform; threads?: unknown; post?: unknown; title?: unknown; script?: unknown } => {
    return typeof item === "object" && item !== null && requested.includes(item.platform);
  })
  .map((item) => {
      const { platform } = item;

      switch (platform) {
        case "twitter": {
          const threads = Array.isArray(item.threads)
            ? item.threads.map(normalizeText).filter((t: string) => t.trim().length > 0)
            : [];
          return threads.length > 0 ? { platform, threads } : null;
        }

        case "linkedin": {
          const post = normalizeText(item.post);
          return post ? { platform, post } : null;
        }

        case "reddit": {
          const title = normalizeText(item.title);
          const post = normalizeText(item.post);
          return title && post ? { platform, title, post } : null;
        }

        case "youtube": {
          const script = normalizeText(item.script);
          return script ? { platform, script } : null;
        }

        case "telegram": {
          const post = normalizeText(item.post);
          return post ? { platform, post } : null;
        }

        default:
          return null;
      }
    })
    .filter((r): r is GenerateResult => Boolean(r));
}

function normalizeText(val: unknown): string {
  if (typeof val === "string") return val;
  if (Array.isArray(val)) return val.map((v) => normalizeText(v)).join(" ");
  if (val && typeof val === "object") {
    const maybeContent = (val as any).content;
    if (typeof maybeContent === "string") return maybeContent;
    try {
      return JSON.stringify(val);
    } catch {
      return String(val);
    }
  }
  return val == null ? "" : String(val);
}

function fallbackGenerate(text: string, platforms: Platform[]): GenerateResult[] {
  const collapsed = collapseUpdates(text);
  const preview = collapsed.slice(0, 280).trim() + (collapsed.length > 280 ? "..." : "");

  return platforms.map((platform) => {
    switch (platform) {
      case "twitter":
        return {
          platform,
          threads: [
            `🧵 ${preview}`,
            "Key insight #1 from the content ↓",
            "Key insight #2 → why it matters",
            "What do you think? Reply below! 👇",
          ],
        };

      case "linkedin":
        return {
          platform,
          post:
            `Excited to share this:\n\n${preview}\n\n` +
            `Would love to hear your thoughts in the comments — what's your take?`,
        };

      case "reddit":
        return {
          platform,
          title: `What are your thoughts on: ${preview.slice(0, 100)}...?`,
          post: `${collapsed.slice(0, 1800)}\n\nCurious to read the community's perspective!`,
        };

      case "youtube":
        return {
          platform,
          script:
            `0:00 - Intro: Welcome! Today we're diving into ${preview.slice(0, 60)}...\n` +
            `1:20 - Main point 1\n2:45 - Main point 2\n...\nOutro: Like & subscribe!`,
        };

      case "telegram":
        return {
          platform,
          post: `${preview}\n\nFull details: ${collapsed.slice(0, 800)}`,
        };
    }
  });
}

// Ensure every requested platform has a result; fill gaps with deterministic fallback.
function ensureAllPlatforms(results: GenerateResult[], text: string, requested: Platform[]): GenerateResult[] {
  const have = new Set(results.map((r) => r.platform));
  const missing = requested.filter((p) => !have.has(p));
  if (missing.length === 0) return results;
  const filler = fallbackGenerate(text, missing);
  return [...results, ...filler];
}

// Collapse "Update N:" style change notes so the deterministic fallback uses the latest intent.
function collapseUpdates(raw: string): string {
  if (!raw) return "";
  const parts = raw
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length === 0) return "";

  const updates: string[] = [];
  let base = "";

  for (const chunk of parts) {
    const match = chunk.match(/^update\s*\d*:?[\s-]*/i);
    if (match) {
      updates.push(chunk.slice(match[0].length).trim());
    } else if (!base) {
      base = chunk;
    } else {
      updates.push(chunk);
    }
  }

  const latest = updates.filter(Boolean).at(-1);
  if (!latest) return base;
  return [base, latest].filter(Boolean).join(" ").trim();
}