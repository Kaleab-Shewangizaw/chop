import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

type TextResult = {
  text: string;
  note?: string;
};

const MAX_CHARS = 3000;
const GROQ_WHISPER_ENABLED = false; // Groq temporarily disabled; enable to use Groq Whisper.

export async function extractTextFromFile(file: File): Promise<string> {
  const type = file.type || "";
  const name = file.name || "attachment";

  // Plain text / JSON
  if (type.startsWith("text/") || type === "application/json") {
    const raw = await file.text();
    return truncate(raw, MAX_CHARS);
  }

  // =========================
  // PDF
  // =========================
  if (type === "application/pdf") {
    const buf = await toBuffer(file);
    try {
      const parser = new PDFParse({ data: buf });
      const out = await parser.getText();
      const text = typeof out?.text === "string" ? out.text : "";
      return ensureText(text, name, "PDF");
    } catch (err) {
      console.error("PDF parse error", err);
      return `PDF attached: ${name} (failed to parse, please review manually)`;
    }
  }

  // =========================
  // DOCX
  // =========================
  if (
    type.includes("word") ||
    type.includes("officedocument.wordprocessingml")
  ) {
    const buf = await toBuffer(file);
    try {
      const { value } = await mammoth.extractRawText({ buffer: buf });
      return ensureText(value, name, "DOCX");
    } catch (err) {
      console.error("DOCX parse error", err);
      return `Doc attached: ${name} (failed to parse, please review manually)`;
    }
  }

  // =========================
  // Images (OCR)
  // =========================
  if (type.startsWith("image/")) {
    if (process.env.OCR_SPACE_API_KEY) {
      return await ocrSpace(file);
    }

    const tesseractText = await tesseractOcrSafe(file);
    if (tesseractText) return tesseractText;

    return `Image attached: ${name} (OCR unavailable)`;
  }

  // =========================
  // Audio / Video (Groq Whisper)
  // =========================
  if (type.startsWith("audio/") || type.startsWith("video/")) {
    if (GROQ_WHISPER_ENABLED && process.env.GROQ_API_KEY) {
      try {
        return await groqWhisper(file);
      } catch (err) {
        console.error("Groq transcription error", err);
        return `Media attached: ${name} (transcription failed)`;
      }
    }

    return `Media attached: ${name} (transcription not enabled)`;
  }

  // Presentation fallback
  if (type.includes("presentation") || type.includes("ppt")) {
    return `Presentation attached: ${name} (parser not configured)`;
  }

  return `Attachment: ${name} (${type || "unknown type"})`;
}

// =====================================================
// Helpers
// =====================================================

async function toBuffer(file: File): Promise<Buffer> {
  const ab = await file.arrayBuffer();
  return Buffer.from(ab);
}

function truncate(text: string, max: number): string {
  if (!text) return "";
  if (text.length <= max) return text;
  return `${text.slice(0, max)}...`;
}

function ensureText(text: string, name: string, kind: string): string {
  const safe = (text || "").trim();
  if (safe) return truncate(safe, MAX_CHARS);
  return `${kind} attached: ${name} (no extractable text found)`;
}

// =====================================================
// OCR.space
// =====================================================

async function ocrSpace(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  form.append("OCREngine", "2");

  const res = await fetch("https://api.ocr.space/parse/image", {
    method: "POST",
    headers: {
      apikey: process.env.OCR_SPACE_API_KEY as string,
    },
    body: form,
  });

  if (!res.ok) {
    console.error("OCR.space error status", res.status);
    return `Image attached: ${file.name} (OCR failed)`;
  }

  const json = await res.json();
  const parsedText = json?.ParsedResults?.[0]?.ParsedText as
    | string
    | undefined;

  if (parsedText) return truncate(parsedText, MAX_CHARS);

  return `Image attached: ${file.name} (no text detected)`;
}

// =====================================================
// Groq Whisper
// =====================================================

async function groqWhisper(file: File): Promise<string> {
  const buf = await toBuffer(file);

  const form = new FormData();
  form.append(
    "file",
    new File([new Uint8Array(buf)], file.name, { type: file.type })
  );
  form.append("model", "whisper-large-v3");
  form.append("response_format", "text");

  const res = await fetch(
    "https://api.groq.com/openai/v1/audio/transcriptions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: form,
    }
  );

  if (!res.ok) {
    console.error("Groq whisper status", res.status);
    return `Media attached: ${file.name} (transcription failed)`;
  }

  const text = await res.text();
  return truncate(text, MAX_CHARS);
}

// =====================================================
// Tesseract (Local OCR Fallback)
// =====================================================

async function tesseractOcrSafe(file: File): Promise<string | null> {
  try {
    const { createWorker } = await import("tesseract.js");

    const worker = await createWorker("eng");

    const buffer = await toBuffer(file);
    const { data } = await worker.recognize(buffer);

    await worker.terminate();

    const text = data?.text || "";
    const cleaned = text.trim();

    return cleaned ? truncate(cleaned, MAX_CHARS) : null;
  } catch (err) {
    console.error("Tesseract OCR error", err);
    return null;
  }
}