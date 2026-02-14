"use client";

import { Github, History, Trash2Icon } from "lucide-react";
import Hero from "./comps/Hero";
import InputArea from "./comps/InputArea";
import ResultDisplay from "./comps/ResultDisplay";
import { Button } from "@/components/ui/button";
import { GenerateResult } from "@/lib/generatePost";
import { Suspense, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type StoredEntry = {
  id: string;
  request: {
    text: string;
    platforms: string[];
  };
  response: unknown;
  createdAt: number;
};

export default function Home() {
  const [result, setResult] = useState<GenerateResult[] | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<StoredEntry[]>([]);
  const [historySearch, setHistorySearch] = useState("");

  const router = useRouter();

  const parsedHistory = useMemo(() => history, [history]);
  const filteredHistory = useMemo(() => {
    const term = historySearch.trim().toLowerCase();
    if (!term) return parsedHistory;
    return parsedHistory.filter((entry) => {
      const hay = [
        entry.id,
        entry.request.text,
        entry.request.platforms.join(" "),
        JSON.stringify(entry.response || ""),
        new Date(entry.createdAt).toLocaleString(),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(term);
    });
  }, [parsedHistory, historySearch]);

  const openHistory = () => {
    const raw =
      typeof window !== "undefined"
        ? localStorage.getItem("chopHistory")
        : null;

    if (!raw) {
      setHistory([]);
      setShowHistory(true);
      return;
    }

    try {
      const parsed: StoredEntry[] = JSON.parse(raw);
      setHistory(parsed);
    } catch {
      setHistory([]);
    }

    setShowHistory(true);
  };

  const closeHistory = () => setShowHistory(false);

  const applyEntry = (entry: StoredEntry) => {
    const resp: any = entry.response as any;

    const payload = Array.isArray(resp)
      ? resp
      : Array.isArray(resp?.results)
      ? resp.results
      : Array.isArray(resp?.posts)
      ? resp.posts
      : null;

    if (payload) setResult(payload as GenerateResult[]);

    closeHistory();

    const url = new URL(window.location.href);
    url.searchParams.set("id", entry.id);
    window.history.replaceState(null, "", url.toString());
  };

  const deleteEntry = (id: string) => {
    const next = parsedHistory.filter((e) => e.id !== id);
    setHistory(next);

    if (typeof window !== "undefined") {
      localStorage.setItem("chopHistory", JSON.stringify(next));
    }
  };

  return (
    <>
      {/* 📱 Mobile View */}
      <main className="flex xl:hidden relative h-screen items-center justify-center text-white bg-[#1a222a] px-6 text-center">
        <div className="space-y-4">
          <h1 className="text-2xl font-semibold">Desktop Required</h1>
          <p className="text-white/60">
            Chop. is currently optimized for desktop.
            <br />
            Mobile and tablet support is coming soon.
          </p>
        </div>

        <Button
          asChild
          className="absolute bottom-5 right-5 border border-gray-600 text-white/50 hover:text-white transition-all duration-300"
        >
          <a
            href="https://github.com/Kaleab-Shewangizaw/chop"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Github />
          </a>
        </Button>
      </main>

      {/* 💻 Desktop View */}
      <main className="hidden xl:flex h-screen max-h-screen flex-col text-white items-center pb-5 bg-[#1a222a] justify-start overflow-hidden">
        <div className="h-16 flex px-10 justify-between items-center w-full z-10">
          {/* Reset page & remove queries */}
          <h1
            className="font-medium text-xl cursor-pointer"
            onClick={() => {
              setResult(null);
              router.push("/");
            }}
          >
            Chop.
          </h1>

          <div className="flex items-center gap-2">
            <Button
              className="cursor-pointer border border-gray-400 text-white/50 hover:text-white transition-all duration-300"
              onClick={openHistory}
            >
              <History />
            </Button>

            <Button
              asChild
              className="border border-gray-400 text-white/50 hover:text-white transition-all duration-300"
            >
              <a
                href="https://github.com/Kaleab-Shewangizaw/chop"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github />
              </a>
            </Button>
          </div>
        </div>

        {/* Hero section */}
        <div className="flex-1 w-full overflow-y-auto">
          {result ? <ResultDisplay results={result} /> : <Hero />}
        </div>

        {/* Input area */}
        <div className="w-full shrink-0">
          <Suspense fallback={null}>
            <InputArea result={result} setResult={setResult} />
          </Suspense>
        </div>
      </main>

      {/* History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="bg-[#111821] border border-gray-600 text-white max-w-4xl! w-full max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>History</DialogTitle>
          </DialogHeader>

          {filteredHistory.length === 0 && (
            <div className="text-gray-400 text-sm">
              No history yet. Submit a request to populate this list.
            </div>
          )}

          <div className="mb-3">
            <input
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              placeholder="Search by text, platform, or id"
              className="w-full rounded-md bg-[#0d141c] border border-gray-700 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-3">
            {filteredHistory.map((entry) => (
              <div
                key={entry.id}
                className="w-full rounded-lg border border-gray-700 bg-[#1b2430] hover:border-blue-500 hover:bg-[#1f2b38] transition p-3 cursor-pointer"
                onClick={() => applyEntry(entry)}
              >
                <div className="flex items-center justify-between text-sm text-gray-300">
                  <span className="text-left font-semibold hover:text-white">
                    {entry.id}
                  </span>

                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-xs">
                      {new Date(entry.createdAt).toLocaleString()}
                    </span>

                    <Button
                      variant="ghost"
                      className="h-7 px-2 text-xs border-gray-700 hover:bg-transparent hover:border-red-500 text-gray-400 hover:text-red-500 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteEntry(entry.id);
                      }}
                    >
                      <Trash2Icon className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                <div className="mt-1 text-xs text-gray-400 hover:text-gray-200">
                  Platforms: {entry.request.platforms.join(", ") || "-"}
                </div>

                <div className="mt-1 text-xs text-gray-400 line-clamp-2 hover:text-gray-200 text-left">
                  {entry.request.text || "(no text)"}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}