import { Sparkles, Share2, Scissors, Linkedin, Check, Youtube, Image, Link } from "lucide-react";
import { FaXTwitter } from "react-icons/fa6";
import { GiSoundWaves } from "react-icons/gi";
import { GrDocument, GrReddit } from "react-icons/gr";

export default function Hero() {
  return (
    <div className="flex flex-col items-center   w-full min-h-[60vh] h-auto scrollEdit overflow-hidden pt-0">
      
      <div className="flex-1  w-full   relative">
        
        {/* Card 1: The Input (Left - Rotate 6) */}
        <div className="absolute -rotate-6 top-24 left-[23%] 
                w-80 h-100
                bg-white/3 backdrop-blur-2xl hover:border-white/50 hover:-translate-y-3 transition-all duration-300 ease-out 
                p-6 rounded-2xl border border-white/20
                shadow-2xl text-left hidden md:block">
            <div className="flex items-center gap-2 mb-4 text-gray-400">
                <Scissors size={18} />
                <span className="text-xs uppercase tracking-widest font-semibold">Raw Input</span>
            </div>
            <div className="space-y-3">
                <div className="h-2 w-full bg-white/10 rounded" />
                <div className="h-2 w-5/6 bg-white/10 rounded" />
                <div className="h-2 w-full bg-white/10 rounded" />
                <div className="h-2 w-4/6 bg-white/10 rounded" />
                <div className="h-2 w-full bg-white/10 rounded-full mt-6 border border-dashed border-white/20" />
            </div>
            <div className="p-4 mt-4 flex justify-between w-full">
                <div className="flex flex-col items-center gap-2 text-gray-200">
                    <GrDocument size={32} className="text-white/40"/>
                    <span className="text-xs">Files</span>
                </div>

                <div className="flex flex-col items-center gap-2 text-gray-200">
                    <GiSoundWaves size={32} className="text-white/40"/>
                    <span className="text-xs">Voice</span>
                </div>
            </div>
            <div className="mx-auto border w-fit p-2 rounded-full">
                <Check size={18} className="" />
            </div>
            <div className="p-4 mt-2 flex justify-between w-full">
                <div className="flex flex-col items-center gap-2 text-gray-200">
                    <Image size={32} className="text-white/40"/>
                    <span className="text-xs">Images</span>
                </div>

                <div className="flex flex-col items-center gap-2 text-gray-200">
                    <Link size={32} className="text-white/40"/>
                    <span className="text-xs">Links</span>
                </div>
            </div>
        </div>

        {/* Card 2: The Transformation (Center - Stable) */}
        <div className="absolute z-10 top-16 left-1/2 -translate-x-1/2
                w-80 h-100 hover:-translate-y-3 transition-all duration-300 ease-out
                bg-linear-to-b from-white/30 to-transparent backdrop-blur-3xl 
                p-8 rounded-2xl border border-white/20
                shadow-[0_0_50px_-12px_rgba(255,255,255,0.2)] 
                text-white text-center flex flex-col items-center justify-center">
            <div className="bg-white text-black p-4 rounded-full mb-6 shadow-[0_0_20px_white]">
                <Sparkles size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">Chop. AI</h3>
            <p className="text-sm text-gray-400">Processing your content into viral threads...</p>
            <div className="mt-8 w-full bg-white/5 h-1 rounded-full overflow-hidden">
                <div className="bg-white h-full w-2/3 animate-pulse" />
            </div>
        </div>

        {/* Card 3: The Output (Right - Rotate -6) */}
        <div className="absolute rotate-6 top-24 right-[23%] transition-all duration-300 ease-out
                hover:-translate-y-3 hover:shadow-2xl border hover:border-white/50 border-white/20
                w-80 h-100
                bg-white/5 backdrop-blur-2xl 
                p-6 rounded-2xl 
                shadow-2xl text-left hidden md:block">
            <div className="flex items-center gap-2 mb-6 text-gray-400">
                <Share2 size={18} />
                <span className="text-xs uppercase tracking-widest font-semibold">Viral Result</span>
            </div>
            <div className="space-y-3">
                <div className="flex items-center gap-3 p-3">
                    <FaXTwitter size={32} className="text-white/70"  />
                    <div className="h-1.5 w-full bg-blue-400/20 rounded" />
                </div>
                <div className="flex items-center gap-3 p-3 ">
                    <Linkedin size={32} className="text-white/70"  />
                    <div className="h-1.5 w-full bg-blue-600/20 rounded" />
                </div>

                <div className="flex items-center gap-3 p-3 ">
                    <GrReddit size={32} className="text-white/70"  />
                    <div className="h-1.5 w-full bg-orange-600/20 rounded" />
                </div>

                <div className="flex items-center gap-3 p-3 ">
                    <Youtube size={32} className="text-white/70"  />
                    <div className="h-1.5 w-full bg-red-600/20 rounded" />
                </div>
            </div>
        </div>

      </div>

      {/* Hero text section - moved up slightly */}
      <div className="pb-   px-4 relative z-20 text-left ">
        <h1 className="text-5xl  md:text-3xl font-black tracking-tighter text-white mb-4">
            CHOP.
        </h1>
        <p className="text-xl md:text-xl text-gray-400 max-w-2xl mx-auto font-medium">
            Turn long-form ideas into <span className="text-white underline underline-offset-8 decoration-white/30">viral social threads</span> in seconds.
        </p>
      </div>
    </div>
  );
}