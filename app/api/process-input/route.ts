import { NextResponse } from "next/server";
import { generatePosts, type Platform } from "@/lib/generatePost";
import { extractTextFromFile } from "@/lib/extractText";

type RequestBody = {
  text?: string;
  platforms?: string[];
};

const ALLOWED_PLATFORMS: Platform[] = ["twitter", "linkedin", "reddit", "youtube", "telegram"];

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    const isMultipart = contentType.includes("multipart/form-data");
    const isJson = contentType.includes("application/json");

    if (!isMultipart && !isJson) {
      return NextResponse.json(
        { error: "Expected multipart/form-data or application/json" },
        { status: 415 }
      );
    }

    let text = "";
    let platformsRaw: unknown = [];

    if (isMultipart) {
      const form = await req.formData();

      // Text field
      const textField = form.get("text");
      text = typeof textField === "string" ? textField.trim() : "";

      // Platforms field (string or JSON array)
      const platformsField = form.get("platforms");
      if (typeof platformsField === "string") {
        try {
          const parsed = JSON.parse(platformsField);
          if (Array.isArray(parsed)) platformsRaw = parsed;
        } catch {
          // fallback: comma separated
          platformsRaw = platformsField.split(",").map((p) => p.trim());
        }
      }

      // Files
      const files = form
        .getAll("files")
        .filter((f): f is File => f instanceof File);

      if (files.length > 0) {
        const extractedTexts = await Promise.all(
          files.map(async (file) => {
            const extracted = await extractTextFromFile(file);
            return extracted?.trim() || "";
          })
        );

        const merged = [text, ...extractedTexts].filter(Boolean).join("\n\n");
        text = merged.trim();
      }
    } else {
      // JSON body
      const body: RequestBody = await req.json();
      text = typeof body.text === "string" ? body.text.trim() : "";
      platformsRaw = Array.isArray(body.platforms) ? body.platforms : [];
    }

    if (!text) {
      return NextResponse.json({ error: "Missing or empty text content" }, { status: 400 });
    }

    // Normalize platforms
    let platforms: Platform[] = [];
    if (Array.isArray(platformsRaw)) {
      platforms = platformsRaw
        .map((p) => String(p).toLowerCase().trim())
        .filter((p): p is Platform => ALLOWED_PLATFORMS.includes(p as Platform));
    }

    if (platforms.length === 0) {
      return NextResponse.json(
        { error: `No valid platforms specified. Allowed: ${ALLOWED_PLATFORMS.join(", ")}` },
        { status: 400 }
      );
    }

    // Generate the posts
    const posts = await generatePosts({ text, platforms });

    const requestId = typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `req_${Date.now()}`;

    return NextResponse.json({
      success: true,
      requestId,
      posts,
      sourceTextLength: text.length,
      platformsUsed: platforms,
    });
  } catch (err) {
    console.error("[POST /api/generate]", err);
    return NextResponse.json(
      { error: "Internal server error", details: err instanceof Error ? err.message : undefined },
      { status: 500 }
    );
  }
}