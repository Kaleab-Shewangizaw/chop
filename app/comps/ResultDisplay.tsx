"use client";

import { GenerateResult } from "@/lib/generatePost";
import { Button } from "@/components/ui/button";
import { Check, ClipboardCopy, MonitorPlay } from "lucide-react";
import { useState } from "react";
import InterfaceShowcase from "./InterfaceShowcase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function toText(val: unknown): string {
  if (typeof val === "string") return val;
  if (Array.isArray(val)) return val.map((v) => toText(v)).join("\n");
  if (val && typeof val === "object") return JSON.stringify(val, null, 2);
  return String(val ?? "");
}

type YoutubeBlock = {
  title?: string;
  description?: string;
  hook?: string | string[] | { time?: number | string; text?: string } | Array<{ time?: number | string; text?: string }>;
  body?: Array<{ timestamp?: string; text?: string }> | Array<{ time?: number | string; text?: string }>;
  timestamped_body?: Array<{ time?: number | string; text?: string }>;
  call_to_action?: string | string[] | { time?: number | string; text?: string } | Array<{ time?: number | string; text?: string }>;
};

function parseYoutube(script: string): YoutubeBlock | null {
  try {
    const parsed = JSON.parse(script);
    if (parsed && typeof parsed === "object") return parsed as YoutubeBlock;
  } catch {
    return null;
  }
  return null;
}

function renderYoutube(script: string) {
  const parsed = parseYoutube(script);
  if (!parsed) {
    return <p className="text-sm text-gray-100 whitespace-pre-wrap leading-relaxed">{toText(script)}</p>;
  }

  const { title, description, hook, body, timestamped_body, call_to_action } = parsed;

  const renderHook = () => {
    if (!hook) return null;
    const hooks = Array.isArray(hook)
      ? hook.map((h) => (typeof h === "string" ? h : h?.text).filter(Boolean))
      : typeof hook === "string"
      ? [hook]
      : [hook.text].filter(Boolean);
    if (!hooks.length) return null;
    return (
      <div className="space-y-1">
        <div className="text-xs uppercase text-blue-300">Hook</div>
        {hooks.map((h, idx) => (
          <p key={idx} className="text-sm text-gray-100 whitespace-pre-wrap leading-relaxed">
            {h}
          </p>
        ))}
      </div>
    );
  };

  const renderBody = () => {
    const blocks = (body as Array<{ timestamp?: string; text?: string }> | undefined) || timestamped_body;
    if (!Array.isArray(blocks) || blocks.length === 0) return null;
    return (
      <div className="space-y-2">
        <div className="text-xs uppercase text-gray-400">Script</div>
        {blocks.map((b, idx) => (
          <div key={idx} className="rounded-md bg-[#13161c] border border-gray-800 p-3">
            <div className="text-xs text-emerald-300 font-semibold mb-1">{b.timestamp || b.time || ""}</div>
            <div className="text-sm whitespace-pre-wrap leading-relaxed">{b.text}</div>
          </div>
        ))}
      </div>
    );
  };

  const renderCTA = () => {
    if (!call_to_action) return null;
    const ctas = Array.isArray(call_to_action)
      ? call_to_action.map((c) => (typeof c === "string" ? c : c?.text).filter(Boolean))
      : typeof call_to_action === "string"
      ? [call_to_action]
      : [call_to_action.text].filter(Boolean);
    if (!ctas.length) return null;
    return (
      <div className="space-y-1">
        <div className="text-xs uppercase text-orange-300">Call to action</div>
        {ctas.map((c, idx) => (
          <p key={idx} className="text-sm text-gray-100 whitespace-pre-wrap leading-relaxed">
            {c}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {title && <div className="text-base font-semibold text-white">{title}</div>}
      {description && <div className="text-sm text-gray-300">{description}</div>}
      {renderHook()}
      {renderBody()}
      {renderCTA()}
    </div>
  );
}

function renderPlatform(
  result: GenerateResult,
  copyWithFeedback: (key: string, text: string) => void,
  keyPrefix: string
) {

  switch (result.platform) {
    case "twitter":
      return (
        <div className="space-y-2">
          <div className="text-sm font-semibold text-blue-400">Threads</div>
          <ol className="list-decimal list-inside space-y-3 text-sm text-gray-100">
            {result.threads.map((t, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="flex-1 whitespace-pre-wrap leading-relaxed">{t}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-gray-300 hover:text-white hover:bg-gray-800"
                  onClick={() => copyWithFeedback(`${keyPrefix}-twitter-${idx}`, t)}
                >
                  {copyWithFeedback.currentKey === `${keyPrefix}-twitter-${idx}` ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <ClipboardCopy className="w-4 h-4" />
                  )}
                </Button>
              </li>
            ))}
          </ol>
        </div>
      );
    case "linkedin":
      return (
        <div className="space-y-2">
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-300 hover:text-white hover:bg-gray-800"
              onClick={() => copyWithFeedback(`${keyPrefix}-linkedin`, toText(result.post))}
            >
              {copyWithFeedback.currentKey === `${keyPrefix}-linkedin` ? (
                <Check className="w-4 h-4 mr-1 text-emerald-400" />
              ) : (
                <ClipboardCopy className="w-4 h-4 mr-1" />
              )}
              Copy
            </Button>
          </div>
          <p className="text-sm text-gray-100 whitespace-pre-wrap leading-relaxed">{toText(result.post)}</p>
        </div>
      );
    case "reddit":
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-orange-300">{result.title}</div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-300 hover:text-white hover:bg-gray-800"
                onClick={() => copyWithFeedback(`${keyPrefix}-reddit-title`, result.title)}
              >
                {copyWithFeedback.currentKey === `${keyPrefix}-reddit-title` ? (
                  <Check className="w-4 h-4 mr-1 text-emerald-400" />
                ) : (
                  <ClipboardCopy className="w-4 h-4 mr-1" />
                )}
                Title
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-300 hover:text-white hover:bg-gray-800"
                onClick={() => copyWithFeedback(`${keyPrefix}-reddit-body`, toText(result.post))}
              >
                {copyWithFeedback.currentKey === `${keyPrefix}-reddit-body` ? (
                  <Check className="w-4 h-4 mr-1 text-emerald-400" />
                ) : (
                  <ClipboardCopy className="w-4 h-4 mr-1" />
                )}
                Body
              </Button>
            </div>
          </div>
          <p className="text-sm text-gray-100 whitespace-pre-wrap leading-relaxed">{toText(result.post)}</p>
        </div>
      );
    case "youtube":
      return (
        <div className="space-y-2">
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-300 hover:text-white hover:bg-gray-800"
              onClick={() => copyWithFeedback(`${keyPrefix}-youtube`, toText(result.script))}
            >
              {copyWithFeedback.currentKey === `${keyPrefix}-youtube` ? (
                <Check className="w-4 h-4 mr-1 text-emerald-400" />
              ) : (
                <ClipboardCopy className="w-4 h-4 mr-1" />
              )}
              Copy
            </Button>
          </div>
          {renderYoutube(result.script)}
        </div>
      );
    case "telegram":
      return (
        <div className="space-y-2">
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-300 hover:text-white hover:bg-gray-800"
              onClick={() => copyWithFeedback(`${keyPrefix}-telegram`, toText(result.post))}
            >
              {copyWithFeedback.currentKey === `${keyPrefix}-telegram` ? (
                <Check className="w-4 h-4 mr-1 text-emerald-400" />
              ) : (
                <ClipboardCopy className="w-4 h-4 mr-1" />
              )}
              Copy
            </Button>
          </div>
          <p className="text-sm text-gray-100 whitespace-pre-wrap leading-relaxed">{toText(result.post)}</p>
        </div>
      );
    default:
      return null;
  }
}

export default function ResultDisplay({ results }: { results: GenerateResult[] }) {
  const [preview, setPreview] = useState<GenerateResult | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyWithFeedback = (key: string, text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopiedKey(key);
        setTimeout(() => {
          setCopiedKey((prev) => (prev === key ? null : prev));
        }, 1200);
      })
      .catch(() => {});
  };

  // Expose currentKey to renderPlatform for conditional icon
  (copyWithFeedback as any).currentKey = copiedKey;
  const copyAll = () => {
    const serialized = results
      .map((r) => {
        switch (r.platform) {
          case "twitter":
            return `Twitter:\n${r.threads.join("\n")}`;
          case "linkedin":
            return `LinkedIn:\n${r.post}`;
          case "reddit":
            return `Reddit:\n${r.title}\n${r.post}`;
          case "youtube":
            return `YouTube Script:\n${r.script}`;
          case "telegram":
            return `Telegram:\n${r.post}`;
          default:
            return "";
        }
      })
      .join("\n\n");
    navigator.clipboard.writeText(serialized).catch(() => {});
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 pb-15">
     
      {results.map((res, idx) => (
        <div
          key={`${res.platform}-${idx}`}
          className="p-4 rounded-lg bg-[#1f2b33] border border-gray-700 shadow-sm"
        >
          <div className="flex items-start justify-between mb-5 ">
            <h2 className="text-lg font-semibold capitalize">{res.platform}</h2>
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-200 hover:text-gray-200 hover:bg-transparent cursor-pointer hover:border border-gray-700"
              onClick={() => setPreview(res)}
            >
              <MonitorPlay className="w-4 h-4" />
            </Button>
          </div>
          {renderPlatform(res, copyWithFeedback as any, `${res.platform}-${idx}`)}
          
        </div>
      ))}

      <Dialog open={Boolean(preview)} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="bg-[#0f1620] border border-gray-700 text-white max-w-3xl w-full max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="capitalize">{preview?.platform} preview</DialogTitle>
          </DialogHeader>
          {preview && <InterfaceShowcase result={preview} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
