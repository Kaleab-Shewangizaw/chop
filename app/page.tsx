import { History } from "lucide-react";
import Hero from "./comps/Hero";
import InputArea from "./comps/InputArea";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <>
      {/* 🚫 Mobile + Tablet View (below 1024px) */}
      <main className="flex 2xl:hidden h-screen items-center justify-center text-white bg-[#1a222a] px-6 text-center">
        <div className="space-y-4">
          <h1 className="text-2xl font-semibold">Desktop Required</h1>
          <p className="text-white/60">
            Chop. is currently optimized for desktop.
            <br />
            Mobile and tablet support is coming soon.
          </p>
        </div>
      </main>

      {/* 💻 Desktop View (1024px and above) */}
      <main className="hidden 2xl:flex h-screen max-h-screen flex-col text-white items-center pb-15 bg-[#1a222a] justify-start overflow-hidden">
        <div className="h-4 flex p-4 px-10 justify-between w-full">
          <h1 className="font-medium text-xl cursor-pointer">Chop.</h1>

          <Button className="cursor-pointer text-white/50 hover:text-white transition-all duration-300">
            <History />
          </Button>
        </div>

        {/* Hero section */}
        <div className="flex-1 w-full overflow-y-auto">
          <Hero />
        </div>

        {/* Input area fixed at bottom */}
        <div className="w-full shrink-0">
          <InputArea />
        </div>
      </main>
    </>
  );
}