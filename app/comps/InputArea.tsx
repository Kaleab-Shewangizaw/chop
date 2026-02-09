"use client"

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Linkedin, Mic, Plus, Youtube } from "lucide-react";
import { useState } from "react";

import { FaXTwitter } from "react-icons/fa6";
import { GrReddit } from "react-icons/gr";
import { ImTelegram } from "react-icons/im";
import { PiTelegramLogo } from "react-icons/pi";


export default function InputArea() {
    const [selected, setSelected] = useState<string[]>([]);
    const [text, setText] = useState("");

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

    return (
        <div className="pb-10 -mt-5 flex flex-col  w-3xl">
            <div className="flex gap-3  w-full justify-end px-5">
                <Button 
                    variant="outline"
                    className={`
                        rounded-full transition-all duration-300 gap-2 cursor-pointer
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
                        rounded-full transition-all duration-300 gap-2 cursor-pointer
                        ${isLinkedinSelected 
                            ? "bg-white text-blue-600" 
                            : "bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-white"
                        }
                    `} 
                    onClick={toggleLinkedin}
                >
                    <Linkedin size={32} className="w-5 h-5" />
                    
                </Button>
                <Button 
                    variant="outline"
                    className={`
                        rounded-full transition-all duration-300 gap-2 cursor-pointer
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
                        rounded-full transition-all duration-300 gap-2 cursor-pointer
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
                        rounded-full transition-all duration-200  cursor-pointer
                        ${isTelegramSelected 
                            ? "bg-white text-blue-400" 
                            : "bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-white"
                        }
                    `} 
                    onClick={toggleTelegram}
                >
                    <PiTelegramLogo className="w-5 h-5 " />
                    
                </Button>
                
            </div>
            <div className="mt-3 w-full rounded-lg bg-gray-800 text-white">
                <textarea 
                    placeholder="Paste your content here..." 
                    className="w-full h-32 p-4  focus:outline-none  resize-none"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                />
                <div className="flex justify-between p-3 ">
                    <div className="flex gap-2">
                        <Button  className="text-gray-400 hover:text-white hover:bg-[#2a2f36] cursor-pointer transition-all duration-300 bg-[#1d242b]">
                           <Plus className="w-4 h-4" />
                        </Button>
                        <Select>
                            <SelectTrigger className="ml-2 bg-[#1d242b] border-[#2a2f36] hover:bg-[#2a2f36] text-gray-400 hover:text-white transition-all duration-300">
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
                        

                    </div>
                    <div>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300">
                        {isTwitterSelected || isLinkedinSelected || isRedditSelected || isYoutubeSelected || isTelegramSelected ? text.trim().length > 0 ? "Chop It!" : (<Mic />) : "Select a platform"}
                    </Button>
                    </div>
                    </div>
                </div>
        </div>
    );
}
