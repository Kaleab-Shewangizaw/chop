"use client"

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Linkedin, Mic, Youtube, X, Paperclip } from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import TextareaAutosize from 'react-textarea-autosize';
import { FaXTwitter } from "react-icons/fa6";
import { GrReddit } from "react-icons/gr";
import { ImTelegram } from "react-icons/im";
import { PiTelegramLogo } from "react-icons/pi";

type SpeechRecognition = any;
type SpeechRecognitionEvent = any;

type StoredEntry = {
    id: string;
    request: {
        text: string;
        platforms: string[];
    };
    response: any[] | null;
    createdAt: number;
};

export default function InputArea({ result, setResult }: { result: any[] | null; setResult: (results: any[] | null) => void }) {
    const [selected, setSelected] = useState<string[]>([]);
    const [text, setText] = useState("");
    const [requestId, setRequestId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showVoice, setShowVoice] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [voiceFinalText, setVoiceFinalText] = useState("");
    const [voiceInterimText, setVoiceInterimText] = useState("");
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const audioStreamRef = useRef<MediaStream | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const rafRef = useRef<number | null>(null);
    const [levels, setLevels] = useState<number[]>(new Array(12).fill(0));
    const [speechSupported, setSpeechSupported] = useState(false);
    const voiceFinalRef = useRef("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [attachments, setAttachments] = useState<Array<{
        id: string;
        name: string;
        url?: string;
        kind: "image" | "video" | "doc";
        file?: File;
    }>>([]);
    const attachmentsRef = useRef<typeof attachments>(attachments);
    const searchParams = useSearchParams();
    const idParam = searchParams.get("id");

    const selectedPlatforms = useMemo(() => selected, [selected]);

    // Limit to four files, track previews for images/videos
    const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        const remainingSlots = Math.max(0, 4 - attachments.length);
        const usable = files.slice(0, remainingSlots);

        const next = usable.map((file) => {
            const mime = file.type;
            const isImage = mime.startsWith("image/");
            const isVideo = mime.startsWith("video/");
            let kind: "image" | "video" | "doc";
            if (isImage) {
                kind = "image";
            } else if (isVideo) {
                kind = "video";
            } else {
                kind = "doc";
            }
            return {
                id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 6)}`,
                name: file.name,
                url: isImage || isVideo ? URL.createObjectURL(file) : undefined,
                kind,
                file,
            };
        });

        setAttachments((prev) => [...prev, ...next]);
        e.target.value = ""; // allow re-uploading same file name
    };

    const removeAttachment = (id: string) => {
        setAttachments((prev) => {
            prev.forEach((item) => {
                if (item.id === id && item.url) URL.revokeObjectURL(item.url);
            });
            return prev.filter((item) => item.id !== id);
        });
    };

    // Track latest attachments for cleanup on unmount
    useEffect(() => {
        attachmentsRef.current = attachments;
    }, [attachments]);

    // Clean up object URLs on unmount
    useEffect(() => {
        return () => {
            attachmentsRef.current.forEach((item) => item.url && URL.revokeObjectURL(item.url));
            stopVoice();
        };
    }, []);

    const toggleTwitter = () => {
        if (selected.includes("twitter")) {
            setSelected(selected.filter(item => item !== "twitter"));
        } else {
            setSelected([...selected, "twitter"]);
        }
    };

    const toggleLinkedin = () => {
        if (selected.includes("linkedin")) {
            setSelected(selected.filter(item => item !== "linkedin"));
        } else {
            setSelected([...selected, "linkedin"]);
        }
    };

    const toggleReddit = () => {
        if (selected.includes("reddit")) {
            setSelected(selected.filter(item => item !== "reddit"));
        } else {
            setSelected([...selected, "reddit"]);
        }
    }

    const toggleYoutube = () => {
        if (selected.includes("youtube")) {
            setSelected(selected.filter(item => item !== "youtube"));
        } else {
            setSelected([...selected, "youtube"]);
        }
    }

    const toggleTelegram = () => {
        if (selected.includes("telegram")) {
            setSelected(selected.filter(item => item !== "telegram"));
        } else {
            setSelected([...selected, "telegram"]);
        }
    }

    const isTwitterSelected = selected.includes("twitter");
    const isLinkedinSelected = selected.includes("linkedin");
    const isRedditSelected = selected.includes("reddit");
    const isYoutubeSelected = selected.includes("youtube");
    const isTelegramSelected = selected.includes("telegram");

    // Auto focus textarea on mount
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.focus();
        }
    }, []);

    // Detect speech support client-side
    useEffect(() => {
        if (typeof window === "undefined") return;
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        setSpeechSupported(Boolean(SpeechRecognition));
    }, []);

    // Handle Enter key for submission, Shift+Enter for new line
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            void handleSubmit();
        }
    };

    const initSpeech = async () => {
        if (typeof window === "undefined") return null;
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setError("Speech recognition not supported in this browser. Use Chrome/Edge on https or localhost.");
            return null;
        }
        const rec: SpeechRecognition = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = "en-US";
        return rec;
    };

    const startVoice = async () => {
        setError(null);
        setVoiceFinalText("");
        setVoiceInterimText("");
        voiceFinalRef.current = "";
        setShowVoice(true);
        const rec = await initSpeech();
        if (!rec) return;

        // Mic stream for visualization
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioStreamRef.current = stream;
            const audioCtx = new AudioContext();
            audioCtxRef.current = audioCtx;
            const source = audioCtx.createMediaStreamSource(stream);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 128;
            source.connect(analyser);
            analyserRef.current = analyser;
            animateLevels();
        } catch (err) {
            console.error("Mic access error", err);
            setError("Microphone permission denied or unavailable");
        }

        rec.onresult = (event: SpeechRecognitionEvent) => {
            let interim = "";
            let finals = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript.trim();
                if (!transcript) continue;
                if (event.results[i].isFinal) {
                    finals += `${transcript} `;
                } else {
                    interim += `${transcript} `;
                }
            }

            // Deduplicate by only appending new final text beyond what we've already stored
            const currentFinal = voiceFinalRef.current;
            const nextFinalRaw = `${currentFinal} ${finals}`.trim();
            const nextFinal = nextFinalRaw.startsWith(currentFinal)
                ? (nextFinalRaw.slice(currentFinal.length).trim() ? `${currentFinal} ${nextFinalRaw.slice(currentFinal.length).trim()}`.trim() : currentFinal)
                : nextFinalRaw;

            voiceFinalRef.current = nextFinal;
            setVoiceFinalText(nextFinal);
            setVoiceInterimText(interim.trim());
        };

        rec.onerror = (event: { error: any; }) => {
            console.error("Speech error", event.error);
            setError(`Speech error: ${event.error}`);
            stopVoice();
        };

        rec.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = rec;
        rec.start();
        setIsListening(true);
    };

    const stopVoice = () => {
        if (recognitionRef.current) {
            recognitionRef.current.onresult = null as any;
            recognitionRef.current.onerror = null as any;
            recognitionRef.current.onend = null as any;
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
        if (audioStreamRef.current) {
            audioStreamRef.current.getTracks().forEach((t) => t.stop());
            audioStreamRef.current = null;
        }
        if (analyserRef.current) {
            analyserRef.current.disconnect();
            analyserRef.current = null;
        }
        if (audioCtxRef.current) {
            audioCtxRef.current.close().catch(() => {});
            audioCtxRef.current = null;
        }
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
        setIsListening(false);
        setLevels(new Array(12).fill(0));
        setVoiceFinalText("");
        setVoiceInterimText("");
        voiceFinalRef.current = "";
    };

    const animateLevels = () => {
        if (!analyserRef.current) return;
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const step = Math.max(1, Math.floor(bufferLength / 12));

        const loop = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArray);
            const nextLevels: number[] = [];
            for (let i = 0; i < 12; i++) {
                const slice = dataArray.slice(i * step, (i + 1) * step);
                const avg = slice.reduce((a, b) => a + b, 0) / slice.length || 0;
                nextLevels.push(Math.min(1, avg / 255));
            }
            setLevels(nextLevels);
            rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);
    };

    const commitVoice = () => {
        const mergedVoice = [voiceFinalText, voiceInterimText].filter(Boolean).join(" ").trim();
        const merged = [text, mergedVoice].filter(Boolean).join(text ? "\n" : "");
        setText(merged);
        stopVoice();
        setShowVoice(false);
    };

    const cancelVoice = () => {
        stopVoice();
        setShowVoice(false);
    };

    const handleSubmit = async () => {
        setError(null);

        if (!selectedPlatforms.length) {
            setError("Select at least one platform");
            return;
        }

        if (!text.trim() && attachments.length === 0) {
            setError("Add text or attachments");
            return;
        }

        try {
            setIsLoading(true);
            const form = new FormData();
            form.append("text", text);
            form.append("platforms", JSON.stringify(selectedPlatforms));
            attachments.forEach((item) => {
                if (item.file) form.append("files", item.file);
            });

            const res = await fetch("/api/process-input", {
                method: "POST",
                body: form,
            });

            const raw = await res.text();
            let data: any = null;
            try {
                data = raw ? JSON.parse(raw) : null;
            } catch (parseErr) {
                console.error("Failed to parse response JSON", parseErr, raw);
            }

            if (!res.ok) {
                throw new Error(data?.error || data?.message || raw || `Request failed (${res.status})`);
            }

            if (!data) {
                throw new Error("Empty response from server");
            }

            console.log("API response", data);

            const rid = data.requestId || crypto.randomUUID();
            setRequestId(rid);

            const payload = data.posts || data.results || data;
            setResult(payload);

            // Persist to localStorage
            const entry: StoredEntry = {
                id: rid,
                request: { text, platforms: selectedPlatforms },
                response: payload,
                createdAt: Date.now(),
            };

            const historyRaw = localStorage.getItem("chopHistory");
            const parsed: StoredEntry[] = historyRaw ? JSON.parse(historyRaw) : [];
            const next = [entry, ...parsed.filter((e) => e.id !== entry.id)].slice(0, 50);
            localStorage.setItem("chopHistory", JSON.stringify(next));

            // Clear input and attachments after success
            setText("");
            setAttachments((prev) => {
                prev.forEach((item) => item.url && URL.revokeObjectURL(item.url));
                return [];
            });

        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    // When there is no id in the URL, reset the input surface to a fresh state
    useEffect(() => {
        if (idParam) return;

        setText("");
        setSelected([]);
        setAttachments((prev) => {
            prev.forEach((item) => item.url && URL.revokeObjectURL(item.url));
            return [];
        });
        setRequestId(null);
        setError(null);
        setVoiceFinalText("");
        setVoiceInterimText("");
        setShowVoice(false);
        setResult(null);
    }, [idParam, setResult]);

    // Load saved entry by id from URL
    useEffect(() => {
        if (!idParam) return;
        const raw = typeof window !== "undefined" ? localStorage.getItem("chopHistory") : null;
        if (!raw) return;
        try {
            const parsed: StoredEntry[] = JSON.parse(raw);
            const found = parsed.find((e) => e.id === idParam);
            if (found) {
                setText(found.request.text);
                setSelected(found.request.platforms);
                setResult(found.response);
                setRequestId(found.id);
            }
        } catch {
            // ignore parsing errors
        }
    }, [idParam, setResult]);

    return (
        <div className="  flex flex-col  relative w-full max-w-4xl pt-2 mx-auto px-4 bg-transparent z-20 ">
            
            <div className={`flex justify-between absolute ${attachments.length > 0 ? "-top-22" : "-top-12"} right-1   w-full px-3 pl-6 items-end py-2 bg-transparent`}>
                
                    
                    <div className="flex flex-1   justify-end gap-2 max-w-[80%] ">
                        {attachments.map((item) => (
                            <div
                                key={item.id}
                                className="relative w-20 h-20 rounded-md overflow-hidden border-gray-700 bg-gray-800 flex items-center justify-center"
                            >
                                {item.kind === "image" && item.url ? (
                                    <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                                ) : item.kind === "video" && item.url ? (
                                    <video src={item.url} className="w-full h-full object-cover" muted />
                                ) : (
                                    <div className="px-1 text-[11px] text-gray-300 text-center wrap-break-words">
                                        {item.name}
                                    </div>
                                )}
                                <button
                                    aria-label="Remove attachment"
                                    onClick={() => removeAttachment(item.id)}
                                    className="absolute z-10 -top-0.5 right-0 bg-gray-900 text-gray-200 rounded-full p-2 hover:bg-red-500 hover:text-white"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                   
                </div>
                {/* Platform buttons row - Fully rounded buttons */}
                <div className="flex gap-3 w-full justify-end  pr-3">
                <Button 
                    variant="outline"
                    className={`
                        w-10 h-10 p-0 transition-all duration-300 cursor-pointer
                        ${isTwitterSelected 
                            ? "bg-white text-black" 
                            : "bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-white"
                        }
                    `} 
                    onClick={toggleTwitter}
                >
                    <FaXTwitter className="w-5 h-5" />
                </Button>
                <Button 
                    variant="outline"
                    className={`
                        w-10 h-10 p-0 transition-all duration-300 cursor-pointer
                        ${isLinkedinSelected 
                            ? "bg-white text-blue-600" 
                            : "bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-white"
                        }
                    `} 
                    onClick={toggleLinkedin}
                >
                    <Linkedin className="w-5 h-5" />
                </Button>
                <Button 
                    variant="outline"
                    className={`
                        w-10 h-10 p-0 transition-all duration-300 cursor-pointer
                        ${isRedditSelected 
                            ? "bg-white text-orange-600" 
                            : "bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-white"
                        }
                    `} 
                    onClick={toggleReddit}
                >
                    <GrReddit className="w-5 h-5" />
                </Button>
                <Button 
                    variant="outline"
                    className={`
                        w-10 h-10 p-0 transition-all duration-300 cursor-pointer
                        ${isYoutubeSelected 
                            ? "bg-white text-red-600" 
                            : "bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-white"
                        }
                    `} 
                    onClick={toggleYoutube}
                >
                    <Youtube className="w-5 h-5" />
                </Button>
                <Button 
                    variant="outline"
                    className={`
                        w-10 h-10 p-0 transition-all duration-200 cursor-pointer
                        ${isTelegramSelected 
                            ? "bg-white text-blue-400" 
                            : "bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-white"
                        }
                    `} 
                    onClick={toggleTelegram}
                >
                    <PiTelegramLogo className="w-5 h-5" />
                </Button>
            </div>
            </div>
            
            {/* Text area container - fixed max height */}
            <div className="w-full rounded-lg bg-gray-800 text-white border border-gray-700">
                <TextareaAutosize
                    ref={textareaRef}
                    minRows={1}
                    maxRows={6} // Fixed max rows to prevent going off screen
                    placeholder="Paste your content here..."
                    className="w-full p-4 focus:outline-none resize-none bg-transparent"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    style={{
                        height: 200, // Fixed max height
                        overflowY: 'auto'
                    }}
                />
                <div className="flex justify-between p-3 border-t border-gray-700">
                    <div className="flex gap-2">
                      
                        <Select>
                            <SelectTrigger disabled className="ml-2 bg-[#1d242b] border-[#2a2f36] hover:bg-[#2a2f36] text-gray-400 hover:text-white transition-all duration-300">
                                <SelectValue placeholder="More options" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#1d242b] border-[#2a2f36] text-gray-400">
                                <SelectGroup>
                                    <SelectItem value="option1">Educational</SelectItem>
                                    <SelectItem value="option2">Entertainment</SelectItem>
                                    <SelectItem value="option3">News</SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                          <div className="flex items-center gap-3">
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/*,video/*,.pdf,.doc,.docx,.txt,.ppt,.pptx"
                            className="hidden"
                            onChange={handleFilesChange}
                        />
                        <Button
                            variant="outline"
                            className="bg-gray-800 cursor-pointer text-gray-300 border-gray-700 hover:bg-gray-700 hover:text-white"
                            onClick={() => fileInputRef.current?.click()}
                            // disabled={attachments.length >= 4}
                            disabled
                        >
                           <Paperclip/>
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="bg-gray-800 cursor-pointer text-gray-300 border-gray-700 hover:bg-gray-700 hover:text-white"
                            onClick={startVoice}
                            disabled={!speechSupported}
                        >
                            <Mic className="w-4 h-4" />
                        </Button>
                        
                    </div>
                    </div>
                    <div>
                        <Button
                            className="rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 px-6"
                            onClick={handleSubmit}
                            disabled={isLoading}
                        >
                            {isLoading
                                ? "Working..."
                                : (isTwitterSelected || isLinkedinSelected || isRedditSelected || isYoutubeSelected || isTelegramSelected)
                                    ? text.trim().length > 0 || attachments.length > 0
                                        ? "Chop It!"
                                        : "Add text or use mic"
                                    : "Select a platform"}
                        </Button>
                    </div>
                </div>
            </div>
            {error && (
                <div className="mt-3 text-sm text-red-400">{error}</div>
            )}
            {!speechSupported && (
                <div className="mt-2 text-xs text-yellow-400">Voice input not supported in this browser. Use Chrome/Edge on https or localhost.</div>
            )}
           

            {showVoice && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="w-full max-w-md rounded-xl bg-gray-900 border border-gray-700 p-5 shadow-lg">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-lg font-semibold text-white">Voice Capture</h3>
                            <button onClick={cancelVoice} aria-label="Close" className="text-gray-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="mb-4 text-gray-300 text-sm">
                            {isListening ? "Listening... speak now" : "Starting microphone..."}
                        </div>
                        <div className="flex items-end gap-1 h-20 mb-4">
                            {levels.map((lvl, idx) => (
                                <div
                                    key={idx}
                                    className="flex-1 bg-blue-500/70 rounded-sm"
                                    style={{ height: `${10 + lvl * 70}px`, transition: "height 0.08s linear" }}
                                />
                            ))}
                        </div>
                        <div className="mb-4">
                            <label className="text-xs uppercase tracking-wide text-gray-400">Live transcript</label>
                            <div className="mt-1 min-h-20 rounded-md border border-gray-700 bg-gray-800 p-3 text-sm text-gray-100">
                                {(voiceFinalText || voiceInterimText) ? `${voiceFinalText} ${voiceInterimText}`.trim() : "Listening..."}
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" className="border-gray-700 text-gray-200 hover:bg-transparent hover:text-red-300 cursor-pointer" onClick={cancelVoice}>
                                Cancel
                            </Button>
                            <Button
                                className="bg-blue-600 hover:bg-blue-700 cursor-pointer"
                                onClick={commitVoice}
                                disabled={!(voiceFinalText.trim() || voiceInterimText.trim())}
                            >
                                Use Transcript
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}