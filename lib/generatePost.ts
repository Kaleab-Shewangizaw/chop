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
      if (groqResults.length > 0) return groqResults;
    } catch (err) {
      console.error("[Groq generation failed]", err);
      // continue to fallback
    }
  }

  console.warn("[generatePosts] Falling back to deterministic generation (no Groq or failed)");
  return fallbackGenerate(cleanedText, safePlatforms);
}

async function callGroq(text: string, platforms: Platform[]): Promise<GenerateResult[]> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not set");

  const model = process.env.GROQ_MODEL || DEFAULT_MODEL;

  const systemPrompt = `
You are an expert at creating engaging, platform-optimized social media content.
Follow platform conventions, tone, length limits, and best practices.
Output **only valid JSON**, no explanations, no markdown, no fences.
  `.trim();

  const userPrompt = buildPrompt(text, platforms);

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
}

function buildPrompt(sourceText: string, platforms: Platform[]): string {
  const platformInstructions = platforms
    .map((p) => {
      switch (p) {
        case "twitter":
          return "- twitter: short thread (3–8 tweets), engaging hooks, emojis, calls to action";
        case "linkedin":
          return "- linkedin: professional tone, 100–1300 chars, storytelling, value-first";
        case "reddit":
          return "- reddit: catchy title (<300 chars), detailed self-post body, subreddit-friendly";
        case "youtube":
          return "- youtube: full video script (~5–12 min), with timestamps, hooks, outro";
        case "telegram":
          return "- telegram: concise post, markdown supported, channels/groups friendly";
      }
    })
    .join("\n");

  return `
Source content to adapt:
----------------------------------------
${sourceText}
----------------------------------------

Create optimized content ONLY for these platforms:
${platforms.map((p) => `- ${p}`).join("\n")}

Guidelines:
${platformInstructions}

Return JSON in this exact shape (only this object, nothing else):
{
  "results": [
    { "platform": "twitter", "threads": ["tweet 1", "tweet 2", ...] },
    { "platform": "linkedin", "post": "full post text" },
    { "platform": "reddit", "title": "...", "post": "..." },
    { "platform": "youtube", "script": "Intro...\n00:00 ... \n..." },
    { "platform": "telegram", "post": "..." }
  ]
}
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
    .filter((item): item is {
        script: string;
        title: string;
        post: string;
        threads: any; platform: Platform 
} => {
      return typeof item === "object" && item !== null && requested.includes(item.platform);
    })
    .map((item) => {
      const { platform } = item;

      switch (platform) {
        case "twitter": {
          const threads = Array.isArray(item.threads)
            ? item.threads.filter((t): t is string => typeof t === "string" && t.trim().length > 0)
            : [];
          return threads.length > 0 ? { platform, threads } : null;
        }

        case "linkedin": {
          const post = String(item.post ?? "").trim();
          return post ? { platform, post } : null;
        }

        case "reddit": {
          const title = String(item.title ?? "").trim();
          const post = String(item.post ?? "").trim();
          return title && post ? { platform, title, post } : null;
        }

        case "youtube": {
          const script = String(item.script ?? "").trim();
          return script ? { platform, script } : null;
        }

        case "telegram": {
          const post = String(item.post ?? "").trim();
          return post ? { platform, post } : null;
        }

        default:
          return null;
      }
    })
    .filter((r): r is GenerateResult => r !== null);
}

function fallbackGenerate(text: string, platforms: Platform[]): GenerateResult[] {
  const preview = text.slice(0, 280).trim() + (text.length > 280 ? "..." : "");

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
          post: `${text.slice(0, 1800)}\n\nCurious to read the community's perspective!`,
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
          post: `${preview}\n\nFull details: ${text.slice(0, 800)}`,
        };
    }
  });
}