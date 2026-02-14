import { GenerateResult } from "@/lib/generatePost";
import { Avatar } from "@/components/ui/avatar";

function toText(val: unknown): string {
    if (typeof val === "string") return val;
    if (Array.isArray(val)) return val.map((v) => toText(v)).join("\n");
    if (val && typeof val === "object") return JSON.stringify(val, null, 2);
    return String(val ?? "");
}

function timeLabel(index: number) {
    const totalSeconds = index * 30;
    const m = Math.floor(totalSeconds / 60)
        .toString()
        .padStart(2, "0");
    const s = (totalSeconds % 60).toString().padStart(2, "0");
    return `[${m}:${s}]`;
}

import { Heart, Repeat2, MessageCircle, MoreHorizontal,Globe, ThumbsUp, Send, Share, ArrowUp,
  ArrowDown,
  
  Share2,
  Bookmark,
  ShareIcon,
  Share2Icon,
   } from 'lucide-react';
import {  AvatarFallback } from '@/components/ui/avatar'; // Assuming you have shadcn/ui

interface TwitterCardProps {
  threads: string[];
  username?: string;
  handle?: string;
  avatarLetter?: string;
  timestamp?: string;
}

export function TwitterCard({
  threads,
  username = "chop",
  handle = "chop",
  avatarLetter = "C",
  timestamp = "now",
}: TwitterCardProps) {
  // Highlight hashtags like real X
  const renderContent = (text: string) => {
    const parts = text.split(/(#\w+)/g);

    return parts.map((part, index) => {
      if (part.startsWith("#")) {
        return (
          <span key={index} className="text-[#1d9bf0] hover:underline cursor-pointer">
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-black text-white border border-[#2f3336] rounded-2xl overflow-hidden">
      
      {/* ===================== */}
      {/* ORIGINAL POST */}
      {/* ===================== */}
      <div className="px-4 py-4 border-b border-[#2f3336] hover:bg-[#080808] transition-colors">
        <div className="flex gap-3">
          <Avatar className="h-11 w-11 bg-gray-700">
            <AvatarFallback className="text-sm font-semibold text-white">
              {avatarLetter}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-bold hover:underline cursor-pointer">
                {username}
              </span>
              <span className="text-gray-500">@{handle}</span>
              <span className="text-gray-500">·</span>
              <span className="text-gray-500">{timestamp}</span>
            </div>

            <div className="mt-1 text-[15px] leading-relaxed whitespace-pre-wrap">
              {renderContent(threads[0])}
            </div>

            {/* Main Post Actions */}
            <div className="flex justify-between mt-4 max-w-md text-gray-500 text-sm">
              <button className="flex items-center gap-2 hover:text-blue-500 transition-colors">
                <MessageCircle className="w-4 h-4" />
                <span>{Math.floor(Math.random() * 30) + 1}</span>
              </button>

              <button className="flex items-center gap-2 hover:text-green-500 transition-colors">
                <Repeat2 className="w-4 h-4" />
                <span>{Math.floor(Math.random() * 20) + 1}</span>
              </button>

              <button className="flex items-center gap-2 hover:text-pink-500 transition-colors">
                <Heart className="w-4 h-4" />
                <span>{Math.floor(Math.random() * 50) + 5}</span>
              </button>

              <button className="hover:text-blue-500 transition-colors">
                <Share className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ===================== */}
      {/* REPLIES / THREADS */}
      {/* ===================== */}
      {threads.slice(1).map((tweet, idx) => (
        <div
          key={idx}
          className="relative px-4 py-3 hover:bg-[#080808] transition-colors border-b border-[#2f3336]"
        >
          <div className="flex gap-3">
            {/* Avatar + Vertical Line */}
            <div className="relative flex flex-col items-center">
              <Avatar className="h-10 w-10 bg-gray-700">
                <AvatarFallback className="text-sm font-semibold text-white">
                  {avatarLetter}
                </AvatarFallback>
              </Avatar>

              {idx !== threads.slice(1).length - 1 && (
                <div className="w-[2px] flex-1 bg-[#2f3336] mt-1" />
              )}
            </div>

            {/* Reply Content */}
            <div className="flex-1 ml-1">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-bold hover:underline cursor-pointer">
                  {username}
                </span>
                <span className="text-gray-500">@{handle}</span>
                <span className="text-gray-500">·</span>
                <span className="text-gray-500">{timestamp}</span>
              </div>

              <div className="mt-1 text-[15px] leading-relaxed whitespace-pre-wrap">
                {renderContent(tweet)}
              </div>

              {/* Reply Actions */}
              <div className="flex justify-between mt-3 max-w-md text-gray-500 text-sm">
                <button className="flex items-center gap-2 hover:text-blue-500 transition-colors">
                  <MessageCircle className="w-4 h-4" />
                </button>

                <button className="flex items-center gap-2 hover:text-green-500 transition-colors">
                  <Repeat2 className="w-4 h-4" />
                </button>

                <button className="flex items-center gap-2 hover:text-pink-500 transition-colors">
                  <Heart className="w-4 h-4" />
                </button>

                <button className="hover:text-blue-500 transition-colors">
                  <Share className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* ===================== */}
      {/* REPLY BOX */}
      {/* ===================== */}
      <div className="flex gap-3 px-4 py-3 border-t border-[#2f3336]">
        <Avatar className="h-8 w-8 bg-gray-700">
          <AvatarFallback className="text-xs text-white">+</AvatarFallback>
        </Avatar>

        <input
          type="text"
          placeholder="Post your reply..."
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-gray-500"
          readOnly
        />

        <button className="bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white px-4 py-1.5 rounded-full text-sm font-semibold">
          Reply
        </button>
      </div>
    </div>
  );
}



function LinkedinCard({ post }: { post: string }) {
  // Highlight hashtags like LinkedIn
  const renderContent = (text: string) => {
    const parts = text.split(/(#\w+)/g);

    return parts.map((part, index) => {
      if (part.startsWith("#")) {
        return (
          <span
            key={index}
            className="text-[#0a66c2] hover:underline cursor-pointer font-medium"
          >
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-white border border-[#e0e0e0] rounded-lg">
      
      {/* HEADER */}
      <div className="flex items-start justify-between p-4">
        <div className="flex gap-3">
          <Avatar className="h-12 w-12 bg-[#0a66c2] text-white text-sm font-semibold">
            C
          </Avatar>

          <div className="text-sm">
            <div className="font-semibold text-black hover:underline cursor-pointer">
              chop
            </div>

            {/* Headline (LinkedIn style) */}
            <div className="text-gray-600 text-xs">
              Full Stack Developer | Building AI tools | Open to Work
            </div>

            {/* Timestamp */}
            <div className="flex items-center gap-1 text-gray-500 text-xs mt-1">
              <span>1h</span>
              <span>·</span>
              <Globe className="w-3 h-3" />
            </div>
          </div>
        </div>

        <button className="text-gray-500 hover:bg-gray-100 p-1 rounded-full">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* POST CONTENT */}
      <div className="px-4 pb-3 text-[14px] leading-relaxed text-gray-800 whitespace-pre-wrap">
        {renderContent(post)}
      </div>

      {/* REACTION SUMMARY */}
      <div className="px-4 py-2 border-t border-[#e0e0e0] flex items-center justify-between text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1">
            <div className="h-4 w-4 bg-[#0a66c2] rounded-full flex items-center justify-center text-white text-[10px]">
              👍
            </div>
            <div className="h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px]">
              ❤️
            </div>
          </div>
          <span>112</span>
        </div>

        <div className="flex gap-3">
          <span>18 comments</span>
          <span>7 reposts</span>
        </div>
      </div>

      {/* ACTION BAR */}
      <div className="flex border-t border-[#e0e0e0] text-sm text-gray-600">
        <button className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-gray-100 transition">
          <ThumbsUp className="w-4 h-4" />
          Like
        </button>

        <button className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-gray-100 transition">
          <MessageCircle className="w-4 h-4" />
          Comment
        </button>

        <button className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-gray-100 transition">
          <Repeat2 className="w-4 h-4" />
          Repost
        </button>

        <button className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-gray-100 transition">
          <Send className="w-4 h-4" />
          Send
        </button>
      </div>
    </div>
  );
}



function RedditCard({
  title,
  post,
}: {
  title: string;
  post: string;
}) {
  const renderContent = (text: string) => {
    const parts = text.split(/(#\w+)/g);

    return parts.map((part, index) => {
      if (part.startsWith("#")) {
        return (
          <span
            key={index}
            className="text-[#4fbcff] hover:underline cursor-pointer"
          >
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-[#1a1a1b] border border-[#343536] rounded-md hover:border-[#818384] transition-colors">
      <div className="flex">
        {/* ================= */}
        {/* VOTE COLUMN */}
        {/* ================= */}
        <div className="flex flex-col items-center bg-[#161617] px-2 py-3 text-gray-400">
          <button className="hover:text-orange-500">
            <ArrowUp className="w-5 h-5" />
          </button>

          <span className="text-sm font-semibold text-gray-200 my-1">
            320
          </span>

          <button className="hover:text-blue-500">
            <ArrowDown className="w-5 h-5" />
          </button>
        </div>

        {/* ================= */}
        {/* MAIN CONTENT */}
        {/* ================= */}
        <div className="flex-1 p-4">
          {/* META ROW */}
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
            <div className="h-5 w-5 rounded-full bg-orange-500" />
            <span className="font-semibold text-gray-200 hover:underline cursor-pointer">
              r/chop
            </span>
            <span>•</span>
            <span>Posted by</span>
            <span className="hover:underline cursor-pointer">
              u/chop
            </span>
            <span>• 3h ago</span>
          </div>

          {/* TITLE */}
          <div className="text-[18px] font-semibold text-gray-100 mb-2 leading-snug">
            {title}
          </div>

          {/* POST BODY */}
          <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed mb-4">
            {renderContent(post)}
          </div>

          {/* ACTION BAR */}
          <div className="flex items-center gap-6 text-xs text-gray-400">
            <button className="flex items-center gap-2 hover:text-gray-200">
              <MessageCircle className="w-4 h-4" />
              52 Comments
            </button>

            <button className="flex items-center gap-2 hover:text-gray-200">
              <Share2 className="w-4 h-4" />
              Share
            </button>

            <button className="flex items-center gap-2 hover:text-gray-200">
              <Bookmark className="w-4 h-4" />
              Save
            </button>

            <button className="flex items-center gap-2 hover:text-gray-200">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


import { BiShareAlt } from "react-icons/bi";

import { Eye, Star } from "lucide-react";

function TelegramCard({ post }: { post: string }) {
  // Parse bold, hashtags, and links
  const renderContent = (text: string) => {
    // Split bold first
    const boldSplit = text.split(/(\*\*.*?\*\*)/g);

    return boldSplit.map((segment, i) => {
      // If bold
      if (segment.startsWith("**") && segment.endsWith("**")) {
        const clean = segment.slice(2, -2);
        return (
          <strong key={i} className="font-semibold text-white">
            {clean}
          </strong>
        );
      }

      // Now detect hashtags + links inside normal text
      const parts = segment.split(/(#\w+|https?:\/\/[^\s]+)/g);

      return parts.map((part, j) => {
        if (part.startsWith("#") || part.startsWith("http")) {
          return (
            <span
              key={`${i}-${j}`}
              className="text-[#5dade2] hover:underline cursor-pointer"
            >
              {part}
            </span>
          );
        }
        return <span key={`${i}-${j}`}>{part}</span>;
      });
    });
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-[#0e1621] p-4">
      
      {/* Channel Header */}
      <div className="flex items-center gap-3 mb-3">
        <Avatar className="h-10 w-10 bg-[#3390ec] text-white text-sm font-semibold">
          C
        </Avatar>

        <div>
          <div className="font-semibold text-white text-sm">
            chop
          </div>
          <div className="text-xs text-gray-400">
            24.3K subscribers
          </div>
        </div>
      </div>

      {/* Message Bubble */}
      <div className="bg-[#182533] rounded-xl px-4 py-3 text-sm text-gray-100 leading-relaxed whitespace-pre-wrap shadow-sm">
        {renderContent(post)}

        {/* Reaction Bar */}
       

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 text-xs text-gray-400">
          
          {/* Left: Star */}
          <div className="flex gap-3 items-center">
            <button className="flex items-center gap-1 hover:text-yellow-400 transition-colors">
            <Star className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1 bg-[#223547] px-2 py-1 rounded-full text-xs hover:bg-[#2c445c] cursor-pointer transition">
            ❤️ 124
          </div>
          <div className="flex items-center gap-1 bg-[#223547] px-2 py-1 rounded-full text-xs hover:bg-[#2c445c] cursor-pointer transition">
            🔥 32
          </div>
          <div className="flex items-center gap-1 bg-[#223547] px-2 py-1 rounded-full text-xs hover:bg-[#2c445c] cursor-pointer transition">
            👏 18
          </div>
          </div>

          {/* Right: Views + Time + Share */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              4.8K
            </div>

            <span>18:42</span>

           
          </div>
        </div>
      </div>
    </div>
  );
}

type YouTubeScriptStructured = {
    hook?: { time?: number; text?: string };
    body?: { time?: number; text?: string };
    timestamped_body?: Array<{ time?: number; text?: string }>;
    call_to_action?: { time?: number; text?: string };
};

function formatSeconds(time?: number) {
    if (typeof time !== "number" || Number.isNaN(time)) return "";
    const m = Math.floor(time / 60)
        .toString()
        .padStart(2, "0");
    const s = Math.floor(time % 60)
        .toString()
        .padStart(2, "0");
    return `[${m}:${s}]`;
}

function parseYouTubeScript(script: string): YouTubeScriptStructured | null {
    try {
        const parsed = JSON.parse(script);
        if (parsed && typeof parsed === "object") return parsed as YouTubeScriptStructured;
    } catch {
        // fall through
    }
    return null;
}

function YoutubeScript({ script }: { script: string }) {
    const structured = parseYouTubeScript(script);

    if (structured) {
        const { title, description, hook, body, timestamped_body = [], call_to_action } = structured as any;
        // Normalize hook to array of strings
        const hooks: string[] = Array.isArray(hook)
            ? hook.map((h: any) => (typeof h === "string" ? h : h?.text)).filter(Boolean)
            : hook && typeof hook === "object" && hook.text
            ? [hook.text]
            : hook && typeof hook === "string"
            ? [hook]
            : [];

        // Normalize CTA to array of strings
        const ctas: string[] = Array.isArray(call_to_action)
            ? call_to_action.map((c: any) => (typeof c === "string" ? c : c?.text)).filter(Boolean)
            : call_to_action && typeof call_to_action === "object" && call_to_action.text
            ? [call_to_action.text]
            : call_to_action && typeof call_to_action === "string"
            ? [call_to_action]
            : [];

        // Normalize timeline segments
        const timeline = Array.isArray(timestamped_body)
            ? timestamped_body
            : Array.isArray(body)
            ? body
            : [];

        return (
            <div className="bg-[#0e0f12] text-gray-100 rounded-xl border border-gray-800 p-4 space-y-4">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                    <span className="font-semibold">chop</span>
                    <span className="text-gray-500">@chop</span>
                </div>

                {title && <div className="text-base font-semibold text-white">{title}</div>}
                {description && <div className="text-sm text-gray-300">{description}</div>}

                {hooks.length > 0 && (
                    <div className="rounded-lg bg-[#13161c] border border-gray-800 p-3 space-y-1">
                        <div className="text-xs text-blue-300 font-semibold mb-1">Hook</div>
                        {hooks.map((h, idx) => (
                            <div key={idx} className="text-sm whitespace-pre-wrap leading-relaxed">
                                {h}
                            </div>
                        ))}
                    </div>
                )}

                {timeline.length > 0 && (
                    <div className="space-y-2">
                        <div className="text-xs text-gray-400 uppercase tracking-wide">Timeline</div>
                        {timeline.map((segment: any, idx: number) => (
                            <div key={idx} className="rounded-md bg-[#13161c] border border-gray-800 p-3">
                                <div className="text-xs text-emerald-300 font-semibold mb-1">{segment.timestamp || formatSeconds(segment.time)}</div>
                                <div className="text-sm whitespace-pre-wrap leading-relaxed">{segment.text}</div>
                            </div>
                        ))}
                    </div>
                )}

                {ctas.length > 0 && (
                    <div className="rounded-lg bg-[#13161c] border border-gray-800 p-3 space-y-1">
                        <div className="text-xs text-orange-300 font-semibold mb-1">Call to Action</div>
                        {ctas.map((c, idx) => (
                            <div key={idx} className="text-sm whitespace-pre-wrap leading-relaxed">
                                {c}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // fallback: plain text rendering
    const safeScript = toText(script);
    const lines = safeScript.split(/\n+/).filter(Boolean);
    return (
        <div className="bg-[#0e0f12] text-gray-100 rounded-xl border border-gray-800 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-300">
                <span className="font-semibold">chop</span>
                <span className="text-gray-500">@chop</span>
            </div>
            {lines.map((line, idx) => {
                const hasStamp = /^\s*\[.*\]/.test(line);
                const content = hasStamp ? line : `${timeLabel(idx)} ${line}`;
                return (
                    <div key={idx} className="text-sm whitespace-pre-wrap leading-relaxed">
                        {content}
                    </div>
                );
            })}
        </div>
    );
}

export default function InterfaceShowcase({ result }: { result: GenerateResult }) {
    switch (result.platform) {
        case "twitter":
            return <TwitterCard threads={result.threads} />;
        case "linkedin":
            return <LinkedinCard post={result.post} />;
        case "reddit":
            return <RedditCard title={result.title} post={result.post} />;
        case "telegram":
            return <TelegramCard post={result.post} />;
        case "youtube":
            return <YoutubeScript script={result.script} />;
        default:
            return null;
    }
}